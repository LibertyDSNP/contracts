pragma solidity >=0.7.4 <=0.9.0;

/// SPDX-License-Identifier: UNLICENSED
import "hardhat/console.sol";

contract Migrations {
    address public owner;
    uint256 public lastCompletedMigration;

    event DSNPMigration(address contractAddr);

    constructor() {
        owner = msg.sender;
    }

    modifier restricted() {
        if (msg.sender == owner) _;
    }

    function setCompleted(uint256 completed) public restricted {
        console.log("HERE1");
        lastCompletedMigration = completed;
        emit DSNPMigration(owner);
        console.log("HERE2");
    }
}
