// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Fundraise {
  using Counters for Counters.Counter;

  IERC20 public scalToken;
  Counters.Counter private _campaignIds;

  struct Campaign {
    address creator;
    uint256 goal;
    uint256 deadline;
    uint256 balance;
    bool completed;
  }

  mapping(uint256 => Campaign) private _campaigns;
  mapping(uint256 => mapping(address => uint256)) private _contributions;

  event CampaignCreated(uint256 indexed campaignId, address indexed creator, uint256 goal, uint256 deadline);
  event ContributionMade(uint256 indexed campaignId, address indexed contributor, uint256 amount);
  event FundsWithdrawn(uint256 indexed campaignId, address indexed creator, uint256 amount);

  constructor(IERC20 _scalToken) {
    scalToken = _scalToken;
  }

  function createCampaign(uint256 goal, uint256 duration) external {
    require(goal > 0, "Fundraising: goal must be greater than 0");
    require(duration > 0, "Fundraising: duration must be greater than 0");

    _campaignIds.increment();
    uint256 campaignId = _campaignIds.current();
    uint256 deadline = block.timestamp + duration;

    _campaigns[campaignId] = Campaign(msg.sender, goal, deadline, 0, false);

    emit CampaignCreated(campaignId, msg.sender, goal, deadline);
  }

  function contribute(uint256 campaignId) external {
    require(campaignExists(campaignId), "Fundraising: campaign does not exist");
    Campaign storage campaign = _campaigns[campaignId];
    require(block.timestamp < campaign.deadline, "Fundraising: campaign has ended");

    uint256 amount = scalToken.allowance(msg.sender, address(this));
    require(amount > 0, "Fundraising: no allowance for the contract");

    scalToken.transferFrom(msg.sender, address(this), amount);

    campaign.balance += amount;
    _contributions[campaignId][msg.sender] += amount;

    emit ContributionMade(campaignId, msg.sender, amount);
  }

  function withdraw(uint256 campaignId) external {
    require(campaignExists(campaignId), "Fundraising: campaign does not exist");
    Campaign storage campaign = _campaigns[campaignId];
    require(msg.sender == campaign.creator, "Fundraising: only the creator can withdraw funds");
    require(block.timestamp >= campaign.deadline, "Fundraising: campaign has not ended yet");
    require(!campaign.completed, "Fundraising: funds already withdrawn");
    require(campaign.balance >= campaign.goal, "Fundraising: campaign goal not reached");

    uint256 amount = campaign.balance;
    campaign.completed = true;
    campaign.balance = 0;

    scalToken.transfer(msg.sender, amount);

    emit FundsWithdrawn(campaignId, msg.sender, amount);
  }

  function getCampaign(uint256 campaignId) external view returns (Campaign memory) {
    require(campaignExists(campaignId), "Fundraising: campaign does not exist");
    return _campaigns[campaignId];
  }

  function getContribution(uint256 campaignId, address contributor) external view returns (uint256) {
    require(campaignExists(campaignId), "Fundraising: campaign does not exist");
    return _contributions[campaignId][contributor];
  }

  function campaignExists(uint256 campaignId) private view returns (bool) {
    return _campaignIds.current() >= campaignId && campaignId > 0;
  }
}
