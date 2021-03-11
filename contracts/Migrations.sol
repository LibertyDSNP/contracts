pragma solidity >=0.7.4 <0.9.0;

/// SPDX-License-Identifier: UNLICENSED
import "hardhat/console.sol";

contract Migrations {
    address public owner;
    uint256 public lastCompletedMigration;

    event DSNPMigration(address contractAddr, string abi);

    constructor() {
        owner = msg.sender;
    }

    modifier restricted() {
        if (msg.sender == owner) _;
    }

    function setCompleted(uint256 completed) public restricted {
        lastCompletedMigration = completed;
    }

    function upgrade(address new_address, string memory abijson) public restricted {
        Migrations upgraded = Migrations(new_address);
        upgraded.setCompleted(lastCompletedMigration);
        emit DSNPMigration(new_address, abijson);
    }
}
