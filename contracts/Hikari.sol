// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Hikari is ERC20 {
    constructor(uint256 initialSupply) ERC20("Hikari", "HKR") {
        _mint(msg.sender, initialSupply);
    }
}
