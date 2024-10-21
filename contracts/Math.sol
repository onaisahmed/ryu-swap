// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

library Math {
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    function divDown(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0, "Math: division by zero");
        return a / b;
    }

    function mulDown(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b == 0 || a <= type(uint256).max / b, "Math: overflow");
        return a * b;
    }

    function divUp(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0, "Math: division by zero");
        return (a + b - 1) / b;
    }

    function mulUp(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b == 0 || a <= type(uint256).max / b, "Math: overflow");
        return (a * b + b - 1) / b;
    }
}
