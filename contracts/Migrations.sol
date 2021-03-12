pragma solidity >=0.7.4 <0.9.0;

/// SPDX-License-Identifier: UNLICENSED
import "hardhat/console.sol";

contract Migrations {
    address public owner;
    uint256 public lastCompletedMigration;

    event DSNPMigration(uint256 lastCompleted, address contractAddr, string contractName, string abi);

    constructor() {
        owner = msg.sender;
    }

    modifier restricted() {
        if (msg.sender == owner) _;
    }

    function setCompleted(uint256 completed) public restricted {
        lastCompletedMigration = completed;
    }

    function upgraded(address contractAddr, string memory contractName, string memory abijson) public restricted {
        emit DSNPMigration(lastCompletedMigration, contractAddr, contractName, abijson);
    }
}
