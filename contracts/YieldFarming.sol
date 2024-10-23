// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Math.sol";

interface IFeeDistributor {
    function updateReward(address account) external;
}

contract YieldFarm {
    IERC20 public lpToken;
    IERC20 public ryuToken;
    address public feeDistributor;

    uint256 public constant REWARD_RATE = 1e15; // 0.001 reward tokens per second per staked LP token

    struct UserInfo {
        uint256 stakedAmount;
        uint256 rewardDebt;
    }

    mapping(address => UserInfo) public userInfo;

    uint256 public totalStaked;
    uint256 public accRewardPerShare;
    uint256 public lastUpdateTime;

    event Stake(address indexed user, uint256 amount);
    event Unstake(address indexed user, uint256 amount);
    event ClaimReward(address indexed user, uint256 amount);

    constructor(address _lpToken, address _ryuToken, address _feeDistributor) {
        lpToken = IERC20(_lpToken);
        ryuToken = IERC20(_ryuToken);
        feeDistributor = _feeDistributor;
        lastUpdateTime = block.timestamp;
    }

    function stake(uint256 amount) external {
        updatePool();
        if (userInfo[msg.sender].stakedAmount > 0) {
            uint256 pending = Math.min(
                (Math.mulDown(
                    userInfo[msg.sender].stakedAmount,
                    accRewardPerShare
                ) / 1e18) - userInfo[msg.sender].rewardDebt,
                ryuToken.balanceOf(address(this))
            );
            if (pending > 0) {
                ryuToken.transfer(msg.sender, pending);
            }
        }
        if (amount > 0) {
            lpToken.transferFrom(msg.sender, address(this), amount);
            userInfo[msg.sender].stakedAmount += amount;
            totalStaked += amount;
        }
        userInfo[msg.sender].rewardDebt =
            Math.mulDown(userInfo[msg.sender].stakedAmount, accRewardPerShare) /
            1e18;
        emit Stake(msg.sender, amount);
    }

    function unstake(uint256 amount) external {
        require(
            userInfo[msg.sender].stakedAmount >= amount,
            "Insufficient staked amount"
        );
        updatePool();
        uint256 pending = Math.min(
            (Math.mulDown(
                userInfo[msg.sender].stakedAmount,
                accRewardPerShare
            ) / 1e18) - userInfo[msg.sender].rewardDebt,
            ryuToken.balanceOf(address(this))
        );
        if (pending > 0) {
            ryuToken.transfer(msg.sender, pending);
        }
        if (amount > 0) {
            userInfo[msg.sender].stakedAmount -= amount;
            totalStaked -= amount;
            lpToken.transfer(msg.sender, amount);
        }
        userInfo[msg.sender].rewardDebt =
            Math.mulDown(userInfo[msg.sender].stakedAmount, accRewardPerShare) /
            1e18;
        emit Unstake(msg.sender, amount);
    }

    function claimReward() external {
        updatePool();
        uint256 pending = Math.min(
            (Math.mulDown(
                userInfo[msg.sender].stakedAmount,
                accRewardPerShare
            ) / 1e18) - userInfo[msg.sender].rewardDebt,
            ryuToken.balanceOf(address(this))
        );
        if (pending > 0) {
            ryuToken.transfer(msg.sender, pending);
        }
        userInfo[msg.sender].rewardDebt =
            Math.mulDown(userInfo[msg.sender].stakedAmount, accRewardPerShare) /
            1e18;
        emit ClaimReward(msg.sender, pending);
    }

    function updatePool() public {
        if (block.timestamp <= lastUpdateTime) {
            return;
        }
        if (totalStaked == 0) {
            lastUpdateTime = block.timestamp;
            return;
        }
        uint256 multiplier = block.timestamp - lastUpdateTime;
        uint256 reward = Math.mulDown(
            Math.mulDown(multiplier, REWARD_RATE),
            totalStaked
        );
        accRewardPerShare += Math.divDown(
            Math.mulUp(reward, 1e18),
            totalStaked
        );
        lastUpdateTime = block.timestamp;

        // Update FeeDistributor
        IFeeDistributor(feeDistributor).updateReward(address(0));
    }
}
