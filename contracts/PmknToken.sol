
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PmknToken is ERC20, AccessControl,Ownable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("PmknToken", "PMKN") {}

    function setRole(address minter) public {
        // Grant the minter role to a specified account
        _setupRole(MINTER_ROLE, minter);
    }

    function mint(address to, uint256 amount) public  {
         require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");
        _mint(to, amount);
    }
}