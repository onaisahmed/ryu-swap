// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Math.sol";

interface IFeeDistributor {
    function receiveFees(uint256 amount) external;
}

contract DEX is ERC20 {
    IERC20 public token1;
    IERC20 public token2;

    uint256 public constant FEE = 3; // 0.3% fee
    address public feeDistributor;

    event AddLiquidity(
        address indexed user,
        uint256 amount1,
        uint256 amount2,
        uint256 liquidity
    );
    event RemoveLiquidity(
        address indexed user,
        uint256 amount1,
        uint256 amount2,
        uint256 liquidity
    );
    event Swap(
        address indexed user,
        uint256 amountIn,
        uint256 amountOut,
        address tokenIn,
        address tokenOut
    );

    constructor(
        address _token1,
        address _token2,
        address _feeDistributor
    ) ERC20("LP Token", "LP") {
        token1 = IERC20(_token1);
        token2 = IERC20(_token2);
        feeDistributor = _feeDistributor;
    }

    function swap(
        uint256 amountIn,
        address tokenIn,
        address tokenOut
    ) external returns (uint256 amountOut) {
        require(
            tokenIn == address(token1) || tokenIn == address(token2),
            "Invalid input token"
        );
        require(
            tokenOut == address(token1) || tokenOut == address(token2),
            "Invalid output token"
        );
        require(tokenIn != tokenOut, "Cannot swap same token");

        IERC20 inToken = IERC20(tokenIn);
        IERC20 outToken = IERC20(tokenOut);

        inToken.transferFrom(msg.sender, address(this), amountIn);

        uint256 inReserve = inToken.balanceOf(address(this));
        uint256 outReserve = outToken.balanceOf(address(this));

        amountOut = getAmountOut(amountIn, inReserve, outReserve);

        uint256 fee = (amountOut * FEE) / 1000;
        amountOut -= fee;

        outToken.transfer(msg.sender, amountOut);
        outToken.transfer(feeDistributor, fee);

        IFeeDistributor(feeDistributor).receiveFees(fee);

        emit Swap(
            msg.sender,
            amountIn,
            amountOut,
            address(tokenIn),
            address(tokenOut)
        );
    }

    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256) {
        require(amountIn > 0, "Insufficient input amount");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");

        uint256 amountInWithFee = amountIn * (1000 - FEE);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;

        return numerator / denominator;
    }

    function addLiquidity(
        uint256 amount1,
        uint256 amount2
    ) external returns (uint256 liquidity) {
        require(amount1 > 0 && amount2 > 0, "Insufficient liquidity amounts");

        uint256 balance1 = token1.balanceOf(address(this));
        uint256 balance2 = token2.balanceOf(address(this));

        uint256 amount1Actual;
        uint256 amount2Actual;

        if (totalSupply() == 0) {
            // First time adding liquidity
            liquidity = Math.sqrt(amount1 * amount2);
            amount1Actual = amount1;
            amount2Actual = amount2;
        } else {
            // Subsequent liquidity additions
            uint256 amount2Optimal = (amount1 * balance2) / balance1;
            if (amount2Optimal <= amount2) {
                amount1Actual = amount1;
                amount2Actual = amount2Optimal;
            } else {
                uint256 amount1Optimal = (amount2 * balance1) / balance2;
                amount1Actual = amount1Optimal;
                amount2Actual = amount2;
            }
            liquidity = Math.min(
                (amount1Actual * totalSupply()) / balance1,
                (amount2Actual * totalSupply()) / balance2
            );
        }

        require(liquidity > 0, "Insufficient liquidity minted");

        token1.transferFrom(msg.sender, address(this), amount1Actual);
        token2.transferFrom(msg.sender, address(this), amount2Actual);

        _mint(msg.sender, liquidity);

        emit AddLiquidity(msg.sender, amount1Actual, amount2Actual, liquidity);
    }

    function removeLiquidity(
        uint256 liquidity
    ) external returns (uint256 amount1, uint256 amount2) {
        require(liquidity > 0, "Invalid liquidity amount");

        uint256 balance1 = token1.balanceOf(address(this));
        uint256 balance2 = token2.balanceOf(address(this));
        uint256 totalSupply = totalSupply();

        amount1 = (liquidity * balance1) / totalSupply;
        amount2 = (liquidity * balance2) / totalSupply;

        require(amount1 > 0 && amount2 > 0, "Insufficient liquidity burned");

        _burn(msg.sender, liquidity);
        token1.transfer(msg.sender, amount1);
        token2.transfer(msg.sender, amount2);

        emit RemoveLiquidity(msg.sender, amount1, amount2, liquidity);
    }
}
