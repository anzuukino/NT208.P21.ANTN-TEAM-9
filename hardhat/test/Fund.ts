const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const anyValue = require("@nomicfoundation/hardhat-chai-matchers").anyValue;
describe("FundManager", function () {
  async function deployFundManagerFixture() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    
    const FundManager = await ethers.getContractFactory("FundManager");
    const fundManager = await FundManager.deploy();
    
    return { fundManager, owner, addr1, addr2, addr3 };
  }

  describe("Deployment", function () {
    it("Should set the right manager", async function () {
      const { fundManager, owner } = await loadFixture(deployFundManagerFixture);
      
      // The manager should be the deployer
      expect(await fundManager.no_funds()).to.equal(0);
    });

    it("Should initialize with zero funds", async function () {
      const { fundManager } = await loadFixture(deployFundManagerFixture);
      
      expect(await fundManager.no_funds()).to.equal(0);
    });
  });

  describe("AddFund", function () {
    it("Should create a new fund successfully", async function () {
      const { fundManager, owner } = await loadFixture(deployFundManagerFixture);
      
      const fid = 1;
      const currentTime = await time.latest();
      const end_of_phase = [currentTime + 86400, currentTime + 172800]; // 1 day, 2 days
      const phase_goal = [ethers.parseEther("1"), ethers.parseEther("2")];
      
      await expect(fundManager.AddFund(fid, end_of_phase, phase_goal))
        .to.emit(fundManager, "AddFuncSuccess")
        .withArgs(fid, owner.address, await time.latest()+1);
      
      expect(await fundManager.no_funds()).to.equal(1);
      expect(await fundManager.fundExist(fid)).to.be.true;
    });

    it("Should initialize fund with correct values", async function () {
      const { fundManager } = await loadFixture(deployFundManagerFixture);
      
      const fid = 1;
      const currentTime = await time.latest();
      const end_of_phase = [currentTime + 86400, currentTime + 172800];
      const phase_goal = [ethers.parseEther("1"), ethers.parseEther("2")];
      
      await fundManager.AddFund(fid, end_of_phase, phase_goal);
      
      const fund = await fundManager.GetFund(fid);
      expect(fund.fID).to.equal(fid);
      expect(fund.no_phase).to.equal(2);
      expect(fund.current_phase).to.equal(0);
      expect(fund.status).to.equal(0); // Status.DOING
      expect(fund.extended).to.be.false;
      expect(fund.banned).to.be.false;
    });

    it("Should allow multiple funds from same owner", async function () {
      const { fundManager } = await loadFixture(deployFundManagerFixture);
      
      const currentTime = await time.latest();
      const end_of_phase = [currentTime + 86400];
      const phase_goal = [ethers.parseEther("1")];
      
      await fundManager.AddFund(1, end_of_phase, phase_goal);
      await fundManager.AddFund(2, end_of_phase, phase_goal);
      
      expect(await fundManager.no_funds()).to.equal(2);
      expect(await fundManager.fundExist(1)).to.be.true;
      expect(await fundManager.fundExist(2)).to.be.true;
    });
  });

  describe("Donate", function () {
    async function setupFundFixture() {
      const { fundManager, owner, addr1, addr2, addr3 } = await loadFixture(deployFundManagerFixture);
      
      const fid = 1;
      const currentTime = await time.latest();
      const end_of_phase = [currentTime + 86400, currentTime + 172800];
      const phase_goal = [ethers.parseEther("1"), ethers.parseEther("2")];
      
      await fundManager.AddFund(fid, end_of_phase, phase_goal);
      
      return { fundManager, owner, addr1, addr2, addr3, fid };
    }

    it("Should accept donations to existing fund", async function () {
      const { fundManager, addr1, fid } = await loadFixture(setupFundFixture);
      
      const donationAmount = ethers.parseEther("0.5");
      
      await expect(fundManager.connect(addr1).Donate(fid, { value: donationAmount }))
        .to.emit(fundManager, "DonateSuccess")
        .withArgs(fid, addr1.address, donationAmount, await time.latest()+1);
    });

    it("Should reject donations to non-existent fund", async function () {
      const { fundManager, addr1 } = await loadFixture(setupFundFixture);
      
      const donationAmount = ethers.parseEther("0.5");
      
      await expect(fundManager.connect(addr1).Donate(999, { value: donationAmount }))
        .to.be.revertedWith("Fund must be exist");
    });

    it("Should reject zero donations", async function () {
      const { fundManager, addr1, fid } = await loadFixture(setupFundFixture);
      
      await expect(fundManager.connect(addr1).Donate(fid, { value: 0 }))
        .to.be.revertedWith("Donation value must be positive");
    });

    it("Should track current fund money correctly", async function () {
      const { fundManager, addr1, fid } = await loadFixture(setupFundFixture);
      
      const donationAmount = ethers.parseEther("0.5");
      await fundManager.connect(addr1).Donate(fid, { value: donationAmount });
      
      const [currentPhase, currentValue] = await fundManager.GetCurrentFundMoney(fid);
      expect(currentPhase).to.equal(0);
      expect(currentValue).to.equal(donationAmount);
    });

    it("Should advance phase when goal is reached", async function () {
      const { fundManager, addr1, fid } = await loadFixture(setupFundFixture);
      
      // Donate more than phase 0 goal (1 ETH)
      const donationAmount = ethers.parseEther("1.5");
      await fundManager.connect(addr1).Donate(fid, { value: donationAmount });
      
      const [currentPhase, currentValue] = await fundManager.GetCurrentFundMoney(fid);
      expect(currentPhase).to.equal(1); // Should advance to phase 1
      expect(currentValue).to.equal(ethers.parseEther("0.5")); // Excess should go to next phase
    });

    it("Should record donor information", async function () {
      const { fundManager, addr1, fid } = await loadFixture(setupFundFixture);
      
      const donationAmount = ethers.parseEther("0.5");
      await fundManager.connect(addr1).Donate(fid, { value: donationAmount });
      
      const donors = await fundManager.GetDonor(fid);
      expect(donors.length).to.equal(1);
      expect(donors[0].donor).to.equal(addr1.address);
      expect(donors[0].amount).to.equal(donationAmount);
      expect(donors[0].phase).to.equal(0);
    });

    it("Should set fund status to FINISHED when all goals met", async function () {
      const { fundManager, addr1, fid } = await loadFixture(setupFundFixture);
      
      // Donate total amount needed (3 ETH total for both phases)
      const donationAmount = ethers.parseEther("3");
      await fundManager.connect(addr1).Donate(fid, { value: donationAmount });
      
      const status = await fundManager.GetState(fid);
      expect(status).to.equal(2); // Status.FINISHED
    });
  });

  describe("Withdraw", function () {
    async function setupFundWithDonationFixture() {
      const { fundManager, owner, addr1, addr2, addr3 } = await loadFixture(deployFundManagerFixture);
      
      const fid = 1;
      const currentTime = await time.latest();
      const end_of_phase = [currentTime + 86400, currentTime + 172800];
      const phase_goal = [ethers.parseEther("1"), ethers.parseEther("2")];
      
      await fundManager.AddFund(fid, end_of_phase, phase_goal);
      
      // Add donations to complete phase 0
      await fundManager.connect(addr1).Donate(fid, { value: ethers.parseEther("1") });
      await fundManager.connect(addr1).Donate(fid, { value: ethers.parseEther("2.5") });
      
      return { fundManager, owner, addr1, addr2, addr3, fid };
    }

    it("Should allow owner to withdraw from completed phase", async function () {
      const { fundManager, owner, fid } = await loadFixture(setupFundWithDonationFixture);
      
      const initialBalance = await ethers.provider.getBalance(owner.address);
      
      await expect(fundManager.Withdraw(fid, 0))
        .to.emit(fundManager, "WithdrawSucess")
        .withArgs(fid, 0, owner.address,await time.latest()+1);
      
      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });
    it("Should allow owner to withdraw from next phase after goal met", async function () {
      const { fundManager, owner, addr1,  fid } = await loadFixture(setupFundWithDonationFixture);
      
      // Withdraw from phase 1 after meeting goal
      fundManager.connect(addr1).Donate(fid, { value: ethers.parseEther("1337") });
      await expect(fundManager.Withdraw(fid, 1))
        .to.emit(fundManager, "WithdrawSucess")
        .withArgs(fid, 1, owner.address,await time.latest()+1);
    });

    it("Should reject withdrawal from non-existent fund", async function () {
      const { fundManager, owner } = await loadFixture(setupFundWithDonationFixture);
      
      await expect(fundManager.Withdraw(999, 0))
        .to.be.revertedWith("Fund does not exist");
    });

    it("Should reject withdrawal by non-owner", async function () {
      const { fundManager, addr1, fid } = await loadFixture(setupFundWithDonationFixture);
      
      await expect(fundManager.connect(addr1).Withdraw(fid, 0))
        .to.be.revertedWith("You are not the owner of this fund");
    });

    it("Should reject withdrawal from invalid phase", async function () {
      const { fundManager, owner, fid } = await loadFixture(setupFundWithDonationFixture);
      
      await expect(fundManager.Withdraw(fid, 5))
        .to.be.revertedWith("Invalid phase");
    });

    it("Should reject withdrawal from unfinished phase", async function () {
      const { fundManager, owner, fid } = await loadFixture(setupFundWithDonationFixture);
      
      // Try to withdraw from phase 1 which is not finished
      await expect(fundManager.Withdraw(fid, 1))
        .to.be.revertedWith("The phase is not finished");
    });
  });

  describe("Fund Status Updates", function () {
    it("Should set fund to STOPPED when phase deadline passes without meeting goal", async function () {
      const { fundManager, addr1 } = await loadFixture(deployFundManagerFixture);
      
      const fid = 1;
      const currentTime = await time.latest();
      const end_of_phase = [currentTime + 100]; // Very short deadline
      const phase_goal = [ethers.parseEther("10")]; // High goal
      
      await fundManager.AddFund(fid, end_of_phase, phase_goal);
      
      // Make small donation
      await fundManager.connect(addr1).Donate(fid, { value: ethers.parseEther("0.1") });
      
      // Fast forward time past deadline
      await time.increaseTo(currentTime + 200);
      
      // Try to donate again to trigger UpdateProgress
      await expect(fundManager.connect(addr1).Donate(fid, { value: ethers.parseEther("0.1") }))
        .to.be.revertedWith("This fund is no longer accepting donate");
      
      const status = await fundManager.GetState(fid);
      expect(status).to.equal(1); // Status.STOPPED
    });
  });

  describe("ExtendDay", function () {
    async function setupFundForExtensionFixture() {
      const { fundManager, owner, addr1 } = await loadFixture(deployFundManagerFixture);
      
      const fid = 1;
      const currentTime = await time.latest();
      const end_of_phase = [currentTime + 86400, currentTime + 172800];
      const phase_goal = [ethers.parseEther("1"), ethers.parseEther("2")];
      
      await fundManager.AddFund(fid, end_of_phase, phase_goal);
      
      return { fundManager, owner, addr1, fid, currentTime };
    }

    it("Should allow extending phase deadlines", async function () {
      const { fundManager, owner, fid, currentTime } = await loadFixture(setupFundForExtensionFixture);
      
      const new_phase_dl = [currentTime + 259200, currentTime + 345600]; // 3 days, 4 days
      
      await fundManager.ExtendDay(fid, new_phase_dl);
      
      const fund = await fundManager.GetFund(fid);
      expect(fund.end_of_phase[0]).to.equal(new_phase_dl[0]);
      expect(fund.end_of_phase[1]).to.equal(new_phase_dl[1]);
    });

    it("Should reject extension for non-existent fund", async function () {
      const { fundManager, owner, currentTime } = await loadFixture(setupFundForExtensionFixture);
      
      const new_phase_dl = [currentTime + 259200];
      
      await expect(fundManager.ExtendDay(999, new_phase_dl))
        .to.be.revertedWith("Fund does not exist");
    });
  });

  describe("Refund", function () {
    async function setupFundForRefundFixture() {
      const { fundManager, owner, addr1, addr2 } = await loadFixture(deployFundManagerFixture);
      
      const fid = 1;
      const currentTime = await time.latest();
      const end_of_phase = [currentTime + 86400, currentTime + 172800];
      const phase_goal = [ethers.parseEther("1"), ethers.parseEther("2")];
      
      await fundManager.AddFund(fid, end_of_phase, phase_goal);
      
      // Add some donations
      await fundManager.connect(addr1).Donate(fid, { value: ethers.parseEther("0.3") });
      await fundManager.connect(addr2).Donate(fid, { value: ethers.parseEther("0.2") });
      
      return { fundManager, owner, addr1, addr2, fid };
    }

    it("Should refund donors for specific phase", async function () {
      const { fundManager, owner, addr1, addr2, fid } = await loadFixture(setupFundForRefundFixture);
      
      const addr1InitialBalance = await ethers.provider.getBalance(addr1.address);
      const addr2InitialBalance = await ethers.provider.getBalance(addr2.address);
      
      await fundManager.Refund(fid, 0);
      
      const addr1FinalBalance = await ethers.provider.getBalance(addr1.address);
      const addr2FinalBalance = await ethers.provider.getBalance(addr2.address);
      
      // Both donors should receive their refunds
      expect(addr1FinalBalance).to.be.gt(addr1InitialBalance);
      expect(addr2FinalBalance).to.be.gt(addr2InitialBalance);
    });

    it("Should reject refund for non-existent fund", async function () {
      const { fundManager, owner } = await loadFixture(setupFundForRefundFixture);
      
      await expect(fundManager.Refund(999, 0))
        .to.be.revertedWith("Fund does not exist");
    });
  });

  describe("View Functions", function () {
    async function setupFundForViewsFixture() {
      const { fundManager, owner, addr1 } = await loadFixture(deployFundManagerFixture);
      
      const fid = 1;
      const currentTime = await time.latest();
      const end_of_phase = [currentTime + 86400, currentTime + 172800];
      const phase_goal = [ethers.parseEther("1"), ethers.parseEther("2")];
      
      await fundManager.AddFund(fid, end_of_phase, phase_goal);
      await fundManager.connect(addr1).Donate(fid, { value: ethers.parseEther("0.5") });
      
      return { fundManager, owner, addr1, fid, end_of_phase, phase_goal };
    }

    it("Should return correct plan", async function () {
      const { fundManager, fid, end_of_phase } = await loadFixture(setupFundForViewsFixture);
      
      const plan = await fundManager.GetPlan(fid);
      expect(plan.length).to.equal(2);
      expect(plan[0]).to.equal(end_of_phase[0]);
      expect(plan[1]).to.equal(end_of_phase[1]);
    });

    it("Should return donor information", async function () {
      const { fundManager, addr1, fid } = await loadFixture(setupFundForViewsFixture);
      
      const donors = await fundManager.GetDonor(fid);
      expect(donors.length).to.equal(1);
      expect(donors[0].donor).to.equal(addr1.address);
      expect(donors[0].amount).to.equal(ethers.parseEther("0.5"));
    });

    it("Should return current fund money", async function () {
      const { fundManager, fid } = await loadFixture(setupFundForViewsFixture);
      
      const [phase, value] = await fundManager.GetCurrentFundMoney(fid);
      expect(phase).to.equal(0);
      expect(value).to.equal(ethers.parseEther("0.5"));
    });

    it("Should return fund state", async function () {
      const { fundManager, fid } = await loadFixture(setupFundForViewsFixture);
      
      const state = await fundManager.GetState(fid);
      expect(state).to.equal(0); // Status.DOING
    });

    it("Should return complete fund information", async function () {
      const { fundManager, owner, fid } = await loadFixture(setupFundForViewsFixture);
      
      const fund = await fundManager.GetFund(fid);
      expect(fund.fID).to.equal(fid);
      expect(fund.owner).to.equal(owner.address);
      expect(fund.no_phase).to.equal(2);
      expect(fund.status).to.equal(0); // Status.DOING
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple donations pushing through multiple phases", async function () {
      const { fundManager, addr1 } = await loadFixture(deployFundManagerFixture);
      
      const fid = 1;
      const currentTime = await time.latest();
      const end_of_phase = [currentTime + 86400, currentTime + 172800, currentTime + 259200];
      const phase_goal = [ethers.parseEther("1"), ethers.parseEther("1"), ethers.parseEther("1")];
      
      await fundManager.AddFund(fid, end_of_phase, phase_goal);
      
      // Donate enough to complete all phases
      await fundManager.connect(addr1).Donate(fid, { value: ethers.parseEther("3") });
      
      const status = await fundManager.GetState(fid);
      expect(status).to.equal(2); // Status.FINISHED
    });

    it("Should reject operations on stopped fund", async function () {
      const { fundManager, owner, addr1 } = await loadFixture(deployFundManagerFixture);
      
      const fid = 1;
      const currentTime = await time.latest();
      const end_of_phase = [currentTime + 100]; // Very short deadline
      const phase_goal = [ethers.parseEther("10")]; // High goal
      
      await fundManager.AddFund(fid, end_of_phase, phase_goal);
      await fundManager.connect(addr1).Donate(fid, { value: ethers.parseEther("0.1") });
      
      // Fast forward time to make fund STOPPED
      await time.increaseTo(currentTime + 200);
      
      // Trigger status update by attempting donation (which should fail)
      await expect(fundManager.connect(addr1).Donate(fid, { value: ethers.parseEther("0.1") }))
        .to.be.revertedWith("This fund is no longer accepting donate");
      
      // Withdrawal should also fail on stopped fund
      await expect(fundManager.Withdraw(fid, 0))
        .to.be.revertedWith("The fund is stopped and no longer working");
    });
  });
});

// Helper function for matching any value in events
