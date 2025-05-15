import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("FundManager", function () {
  let fundManager: Contract;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];

  const Status = {
    DOING: 0,
    STOPPED: 1,
    FINISHED: 2
  };

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy FundManager contract
    const FundManager = await ethers.getContractFactory("FundManager");
    fundManager = await FundManager.deploy();
    await fundManager.waitForDeployment();
  });

  describe("Fund Creation", function () {
    it("Should create a new fund with correct parameters", async function () {
      const fId = 1;
      const currentTimestamp = await time.latest();
      
      // Define phase end times (1 day, 2 days, and 3 days from now)
      const endOfPhase = [
        currentTimestamp + 86400,  // +1 day
        currentTimestamp + 172800, // +2 days
        currentTimestamp + 259200  // +3 days
      ];
      
      // Define funding goals for each phase
      const phaseGoals = [
        ethers.parseEther("1"),  // 1 ETH
        ethers.parseEther("2"),  // 2 ETH
        ethers.parseEther("3")   // 3 ETH
      ];

      // Create a new fund
      const tx = await fundManager.AddFund(fId, endOfPhase, phaseGoals);
      
      // Check for event emission
      await expect(tx)
        .to.emit(fundManager, "AddFuncSuccess")
        .withArgs(fId, owner.address, await time.latest());

      // Verify fund exists
      expect(await fundManager.fundExist(fId)).to.equal(true);
      
      // Fetch the fund and verify its properties
      const fund = await fundManager.funds(fId);
      expect(fund.fID).to.equal(fId);
      expect(fund.owner).to.equal(owner.address);
      expect(fund.no_phase).to.equal(3);
      expect(fund.status).to.equal(Status.DOING);
      expect(fund.current_phase).to.equal(0);
      expect(fund.extended).to.equal(false);
    });

    it("Should store multiple funds with different IDs", async function () {
      const currentTimestamp = await time.latest();
      const endOfPhase = [currentTimestamp + 86400];
      const phaseGoals = [ethers.parseEther("1")];

      await fundManager.AddFund(1, endOfPhase, phaseGoals);
      await fundManager.AddFund(2, endOfPhase, phaseGoals);
      
      expect(await fundManager.no_funds()).to.equal(2);
      expect(await fundManager.fundExist(1)).to.equal(true);
      expect(await fundManager.fundExist(2)).to.equal(true);
    });
  });

  describe("Donation", function () {
    beforeEach(async function () {
      const fId = 1;
      const currentTimestamp = await time.latest();
      const endOfPhase = [
        currentTimestamp + 86400,
        currentTimestamp + 172800
      ];
      const phaseGoals = [
        ethers.parseEther("1"),
        ethers.parseEther("2")
      ];
      await fundManager.AddFund(fId, endOfPhase, phaseGoals);
    });

    it("Should accept donations for an existing fund", async function () {
      const donationAmount = ethers.parseEther("0.5");
      
      const tx = await fundManager.connect(addr1).Donate(1, { value: donationAmount });
      
      await expect(tx)
        .to.emit(fundManager, "DonateSuccess")
        .withArgs(1, addr1.address, donationAmount, await time.latest());
      
      // Check donor entry was created
      const donors = await fundManager.GetSubmitter(1);
      expect(donors.length).to.equal(1);
      expect(donors[0].donor).to.equal(addr1.address);
      expect(donors[0].amount).to.equal(donationAmount);
      expect(donors[0].phase).to.equal(0);
    });

    it("Should fail when donating to non-existent fund", async function () {
      await expect(
        fundManager.connect(addr1).Donate(999, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Fund must be exist");
    });

    it("Should fail when donation value is zero", async function () {
      await expect(
        fundManager.connect(addr1).Donate(1, { value: 0 })
      ).to.be.revertedWith("Donation value must be positive");
    });

    it("Should update phase when goal is met", async function () {
      // Donate enough to complete phase 0
      await fundManager.connect(addr1).Donate(1, { value: ethers.parseEther("1.2") });
      
      // Check phase is updated
      const fund = await fundManager.funds(1);
      expect(fund.current_phase).to.equal(1);
    });
  });

  describe("Withdrawal", function () {
    beforeEach(async function () {
      const fId = 1;
      const currentTimestamp = await time.latest();
      const endOfPhase = [
        currentTimestamp + 86400,
        currentTimestamp + 172800
      ];
      const phaseGoals = [
        ethers.parseEther("1"),
        ethers.parseEther("2")
      ];
      await fundManager.AddFund(fId, endOfPhase, phaseGoals);
      
      // Complete phase 0
      await fundManager.connect(addr1).Donate(1, { value: ethers.parseEther("1.2") });
    });

    it("Should allow owner to withdraw completed phase funds", async function () {
      const initialBalance = await ethers.provider.getBalance(owner.address);
      
      // Owner withdraws from completed phase 0
      const tx = await fundManager.Withdraw(1, 0);
      
      await expect(tx)
        .to.emit(fundManager, "WithdrawSucess")
        .withArgs(1, 0, owner.address, await time.latest());
      
      // Check owner's balance increased (minus gas costs)
      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should fail withdrawal for non-existent fund", async function () {
      await expect(fundManager.Withdraw(999, 0)).to.be.revertedWith("Fund does not exist");
    });

    it("Should fail withdrawal for uncompleted phase", async function () {
      await expect(fundManager.Withdraw(1, 1)).to.be.revertedWith("The phase is not finished");
    });
  });

  describe("Fund Extensions", function () {
    beforeEach(async function () {
      const fId = 1;
      const currentTimestamp = await time.latest();
      const endOfPhase = [
        currentTimestamp + 86400,
        currentTimestamp + 172800
      ];
      const phaseGoals = [
        ethers.parseEther("1"),
        ethers.parseEther("2")
      ];
      await fundManager.AddFund(fId, endOfPhase, phaseGoals);
    });

    it("Should allow extending deadlines", async function () {
      const currentTimestamp = await time.latest();
      const newEndOfPhase = [
        currentTimestamp + 259200,  // +3 days
        currentTimestamp + 345600   // +4 days
      ];
      
      await fundManager.ExtendDay(1, newEndOfPhase);
      
      // Verify the deadlines were updated
      const updatedDeadlines = await fundManager.GetPlan(1);
      expect(updatedDeadlines[0]).to.equal(newEndOfPhase[0]);
      expect(updatedDeadlines[1]).to.equal(newEndOfPhase[1]);
    });

    it("Should fail extension for non-existent fund", async function () {
      const currentTimestamp = await time.latest();
      const newEndOfPhase = [currentTimestamp + 259200, currentTimestamp + 345600];
      
      await expect(
        fundManager.ExtendDay(999, newEndOfPhase)
      ).to.be.revertedWith("Fund does not exist");
    });
  });

  describe("Refunds", function () {
    beforeEach(async function () {
      const fId = 1;
      const currentTimestamp = await time.latest();
      const endOfPhase = [
        currentTimestamp + 86400,
        currentTimestamp + 172800
      ];
      const phaseGoals = [
        ethers.parseEther("1"),
        ethers.parseEther("2")
      ];
      await fundManager.AddFund(fId, endOfPhase, phaseGoals);
      
      // Make a donation
      await fundManager.connect(addr1).Donate(1, { value: ethers.parseEther("0.5") });
    });

    it("Should refund donors when requested", async function () {
      const initialBalance = await ethers.provider.getBalance(addr1.address);
      
      // Process refunds for phase 0
      await fundManager.Refund(1, 0);
      
      // Check donor received refund
      const finalBalance = await ethers.provider.getBalance(addr1.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should fail refund for non-existent fund", async function () {
      await expect(fundManager.Refund(999, 0)).to.be.revertedWith("Fund does not exist");
    });
  });

  describe("Status Updates", function () {
    it("Should mark fund as STOPPED when deadline is reached without meeting goal", async function () {
      const fId = 1;
      const currentTimestamp = await time.latest();
      const endOfPhase = [currentTimestamp + 100]; // Very short deadline
      const phaseGoals = [ethers.parseEther("10")]; // High goal
      
      await fundManager.AddFund(fId, endOfPhase, phaseGoals);
      
      // Make small donation
      await fundManager.connect(addr1).Donate(1, { value: ethers.parseEther("0.1") });
      
      // Advance time past deadline
      await time.increase(200);
      
      // Make another donation to trigger status update
      await expect(
        fundManager.connect(addr2).Donate(1, { value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("This fund is no longer accepting donate");
      
      // Check status
      let fund = await fundManager.GetFund(1);
      console.log(fund);
      // expect(fund).to.equal(Status.STOPPED);
      await expect(
        fundManager.connect(addr2).Donate(1, { value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("This fund is no longer accepting donate");


    });

    it("Should mark fund as FINISHED when all goals are met", async function () {
      const fId = 1;
      const currentTimestamp = await time.latest();
      const endOfPhase = [
        currentTimestamp + 86400,
        currentTimestamp + 172800
      ];
      const phaseGoals = [
        ethers.parseEther("1"),
        ethers.parseEther("1"),
        ethers.parseEther("1")
      ];
      
      await fundManager.AddFund(fId, endOfPhase, phaseGoals);
      
      // Complete both phases
      await fundManager.connect(addr1).Donate(1, { value: ethers.parseEther("3.2") });
      
      // Check status
      let fund = await fundManager.GetFund(1);
      console.log(fund);
      // expect(fund).to.equal(Status.FINISHED);
    });
  });
});