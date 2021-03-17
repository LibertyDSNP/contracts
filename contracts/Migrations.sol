pragma solidity ^0.7.3;

/// SPDX-License-Identifier: UNLICENSED
import "hardhat/console.sol";

contract Migrations {
    address public owner;
    uint256 public lastCompleted;

    // This event indicates the last completed migration, the new contract address, and the ABI
    // for the new contract.
    event DSNPMigration(uint256 lastCompleted, address contractAddr, string contractName, string abi);

    constructor() {
        owner = msg.sender;
    }

    modifier restricted() {
        if (msg.sender == owner) _;
    }

    // set the last completed migration number
    function setCompleted(uint256 completed) public restricted {
        lastCompleted = completed;
    }

    // required for truffle migration scripts
    function lastCompletedMigration() public view returns (uint256) {
        return lastCompleted;
    }

    // This method should be called only after deployment has succeeded.
    function upgraded(address contractAddr, string memory contractName, string memory abijson) public restricted {
        emit DSNPMigration(lastCompleted, contractAddr, contractName, abijson);
    }
}
