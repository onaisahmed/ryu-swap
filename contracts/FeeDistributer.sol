// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IYieldFarm {
    function userInfo(
        address user
    ) external view returns (uint256 stakedAmount, uint256 rewardDebt);

    function totalStaked() external view returns (uint256);
}

contract FeeDistributor {
    IERC20 public feeToken;
    IYieldFarm public yieldFarm;

    uint256 public totalFees;
    uint256 public totalDistributed;
    uint256 public lastUpdateTime;

    mapping(address => uint256) public userRewardPerSharePaid;
    mapping(address => uint256) public rewards;

    uint256 public rewardPerShareStored;

    event FeesReceived(uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);

    constructor(address _feeToken, address _yieldFarm) {
        feeToken = IERC20(_feeToken);
        yieldFarm = IYieldFarm(_yieldFarm);
        lastUpdateTime = block.timestamp;
    }

    function receiveFees(uint256 amount) external {
        require(
            msg.sender == address(feeToken),
            "Only fee token can call this function"
        );
        updateReward(address(0));
        totalFees += amount;
        emit FeesReceived(amount);
    }

    function updateReward(address account) public {
        rewardPerShareStored = rewardPerShare();
        lastUpdateTime = block.timestamp;
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerSharePaid[account] = rewardPerShareStored;
        }
    }

    function rewardPerShare() public view returns (uint256) {
        if (yieldFarm.totalStaked() == 0) {
            return rewardPerShareStored;
        }
        return
            rewardPerShareStored +
            (totalFees - totalDistributed * (1e18 / yieldFarm.totalStaked()));
    }

    function earned(address account) public view returns (uint256) {
        (uint256 stakedAmount, ) = yieldFarm.userInfo(account);
        return
            (stakedAmount *
                (rewardPerShare() - userRewardPerSharePaid[account])) /
            1e18 +
            rewards[account];
    }

    function getReward() public updateUserReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            feeToken.transfer(msg.sender, reward);
            totalDistributed += reward;
            emit RewardPaid(msg.sender, reward);
        }
    }

    modifier updateUserReward(address account) {
        rewardPerShareStored = rewardPerShare();
        lastUpdateTime = block.timestamp;
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerSharePaid[account] = rewardPerShareStored;
        }
        _;
    }
}
