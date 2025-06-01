// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
import "hardhat/console.sol";

contract FundManager{

  enum Status {
    DOING,
    STOPPED,
    FINISHED
  }

  struct fund_t{
    uint fID;
    address payable owner;
    uint date_created;
    uint[] end_of_phase;
    uint256[] phase_goal;
    uint no_phase;
    Status status;
    uint256[] current_value;
    bool[] withdrawed;
    uint current_phase;
    bool extended;
    uint deadline_poc;
    bool banned;
  }

  address manager;
  mapping (uint => fund_t) public funds;
  uint public no_funds;

  struct donorEntry{
    address payable donor;
    uint amount;
    uint phase;
    uint timestamp;
  }

  mapping (uint => donorEntry[]) public donors;
  mapping (address => fund_t[]) public fundOf;
  mapping (uint => bool) public fundExist;

  constructor(){
    manager = msg.sender;
  }

  event AddFuncSuccess(uint fid, address owner, uint created);
  event DonateSuccess(uint fid, address sender , uint value, uint timestamp);
  event WithdrawSucess(uint fid, uint phase ,address owner, uint timestamp);
  event SubmitPOCSuccess(uint fid, uint phase, address owner, uint  ,uint timestamp);
  event RefundSuccess(uint fid, uint phase, uint timestamp);

  function UpdateProgress(uint fid) internal {
    require(fundExist[fid], "Fund must be exist");
    fund_t storage current_fund = funds[fid];
    uint current_phase_ = current_fund.current_phase;
    uint no_phase_ = current_fund.no_phase;

    if(current_fund.end_of_phase[current_phase_] < block.timestamp && 
      current_fund.current_value[current_phase_] < current_fund.phase_goal[current_phase_]){
        current_fund.status = Status.STOPPED;
        ////console.log("set STOPPED");
      }

    while(current_phase_ < no_phase_-1 && current_fund.current_value[current_phase_] > current_fund.phase_goal[current_phase_]){
        uint spare = current_fund.current_value[current_phase_] - current_fund.phase_goal[current_phase_];
        current_fund.current_value[current_phase_] -= spare;
        current_fund.current_value[current_phase_+1] += spare;
        current_fund.current_phase++;
        current_phase_++;

    }

    for(uint i=0;i<no_phase_;i++){
      // //console.log("%d ", current_fund.current_value[i]);
    }
    // print phase goals
    for(uint i=0;i<no_phase_;i++){
      //console.log("Phase goal[%d] %d: ",i ,current_fund.phase_goal[i]);
    }
    //print current value
    for(uint i=0;i<no_phase_;i++){
      //console.log("Phase value[%d] %d: ",i, current_fund.current_value[i]);
    }
    if(current_fund.current_value[no_phase_-1] >= current_fund.phase_goal[no_phase_-1] && current_fund.status != Status.STOPPED){
        current_fund.status = Status.FINISHED;
        current_fund.current_phase++;
        //console.log("Current phase %d", current_fund.current_phase);
        //console.log("set FINISHED");
      }
  }

  function AddFund(uint fid, uint[] memory end_of_phase_, uint[] memory phase_goal_) public {
    uint[] memory initialValues = new uint[](phase_goal_.length);
    bool[] memory init_withdraw = new bool[](phase_goal_.length);
    for(uint i = 0; i < phase_goal_.length; i++) {
      initialValues[i] = 0;
      init_withdraw[i] = false;
    }

    fund_t memory new_fund = fund_t({
      fID: fid,
      end_of_phase: end_of_phase_,
      phase_goal: phase_goal_,
      no_phase: phase_goal_.length,
      date_created: block.timestamp,
      owner: payable(msg.sender),
      status: Status.DOING,
      current_value: initialValues,
      current_phase: 0,
      extended: false,
      deadline_poc: 0,
      banned: false,
      withdrawed: init_withdraw
    });
    funds[fid] = new_fund;
    no_funds++;
    fundExist[fid] = true;
    fundOf[msg.sender].push(new_fund);
    emit AddFuncSuccess(fid, new_fund.owner, block.timestamp);
  }

  function Donate(uint fid) payable public {
    UpdateProgress(fid);
    require(fundExist[fid], "Fund must be exist");
    // //console.log("Status %d",uint(funds[fid].status));
    require(funds[fid].status == Status.DOING, "This fund is no longer accepting donate");   
    require(msg.value > 0, "Donation value must be positive");
    fund_t storage current_fund = funds[fid];
    uint current_phase_ = current_fund.current_phase;
    uint donate_val = msg.value;
    current_fund.current_value[current_phase_] += donate_val;
    UpdateProgress(fid);
    donorEntry memory entry = donorEntry({
      donor: payable(msg.sender),
      amount: msg.value,
      phase: current_phase_,
      timestamp: block.timestamp
    });
    donors[fid].push(entry);
    emit DonateSuccess(fid, msg.sender ,donate_val, block.timestamp);
  }

  function Withdraw(uint fid, uint phase) public {
    require(fundExist[fid], "Fund does not exist");
    require(funds[fid].owner == msg.sender, "You are not the owner of this fund");
    fund_t storage current_fund = funds[fid];
    require(current_fund.no_phase > phase, "Invalid phase");
    //console.log("Current phase %d", current_fund.current_phase);
    //console.log(current_fund.current_phase > phase ? "Current value is enough" : "Current value is not enough");
    require(current_fund.current_phase > phase, "The phase is not finished");
    require(current_fund.status != Status.STOPPED, "The fund is stopped and no longer working");
    // console.log("Contract balance:", address(this).balance);
    // console.log("Sending to:", current_fund.owner);
    // console.log("Amount:", current_fund.current_value[phase]);
    (bool success, ) = current_fund.owner.call{value: current_fund.current_value[phase]}("");
    require(success, "Transfer failed");
    emit WithdrawSucess(fid, phase, current_fund.owner, block.timestamp);
  }

  function ExtendDay(uint fid,uint[] memory new_phase_dl) public {
    require(fundExist[fid], "Fund does not exist");
    fund_t storage current_fund = funds[fid];
    require(new_phase_dl.length == current_fund.end_of_phase.length);
    bool dates_valid =true ;
    for (uint i=0;i<new_phase_dl.length;i++){
      if(new_phase_dl[i] < 0){
        dates_valid = false;
        break;
      }
    }
    require(dates_valid, "Invalid date");
    for(uint i=0;i<new_phase_dl.length;i++){
      current_fund.end_of_phase[i] = new_phase_dl[i];
    }
  }

  function Refund(uint fid, uint phase) public {
    require(fundExist[fid], "Fund does not exist");
    for(uint i=0;i<donors[fid].length;i++){
      donorEntry memory entry = donors[fid][i];
      if(phase != entry.phase){
        continue;
      }
      (bool success,) = entry.donor.call{value: entry.amount}("");
      require(success, "Refund success");
    }
  }

  function GetPlan(uint fid) public view returns (uint[] memory){
    require(fundExist[fid], "Fund does not exist");
    fund_t storage current_fund = funds[fid];
    return current_fund.end_of_phase;
  }

  function GetDonor(uint fid) public view returns (donorEntry[] memory){
    require(fundExist[fid], "Fund does not exist");
    return donors[fid];
  }

  function GetCurrentFundMoney(uint fid) public view returns (uint256, uint256){
    require(fundExist[fid], "Fund does not exist");
    fund_t storage current_fund = funds[fid];
    return (current_fund.current_phase, current_fund.current_value[current_fund.current_phase]);
  }

  function GetState(uint fid) public view returns(Status){
    fund_t storage current_fund = funds[fid];
    return current_fund.status;
  }

  function GetFund(uint fid) public view returns(fund_t memory){
    return funds[fid];
  }

  // function SubmitPOC(uint fid, uint phase) public {
  //   emit
  // }
}