// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DEX {
    IERC20 public token1;
    IERC20 public token2;

    uint256 public fee = 1; // 0.1% fee

    event Swap(
        address user,
        uint256 amountIn,
        uint256 amountOut,
        address tokenIn,
        address tokenOut
    );

    constructor(address _token1, address _token2) {
        token1 = IERC20(_token1);
        token2 = IERC20(_token2);
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

        IERC20 inputToken = IERC20(tokenIn);
        IERC20 outputToken = IERC20(tokenOut);

        require(
            inputToken.transferFrom(msg.sender, address(this), amountIn),
            "Transfer failed"
        );

        uint256 inputReserve = inputToken.balanceOf(address(this));
        uint256 outputReserve = outputToken.balanceOf(address(this));

        amountOut = getAmountOut(amountIn, inputReserve, outputReserve);

        require(outputToken.transfer(msg.sender, amountOut), "Transfer failed");

        emit Swap(msg.sender, amountIn, amountOut, tokenIn, tokenOut);
    }

    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public view returns (uint256) {
        require(amountIn > 0, "Insufficient input amount");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");

        uint256 amountInWithFee = amountIn * (1000 - fee);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;

        return numerator / denominator;
    }

    function addLiquidity(uint256 amount1, uint256 amount2) external {
        require(
            token1.transferFrom(msg.sender, address(this), amount1),
            "Transfer of token1 failed"
        );
        require(
            token2.transferFrom(msg.sender, address(this), amount2),
            "Transfer of token2 failed"
        );
    }
}
