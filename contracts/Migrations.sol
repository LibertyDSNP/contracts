pragma solidity ^0.7.3;

/// SPDX-License-Identifier: UNLICENSED
import "hardhat/console.sol";

contract Migrations {
    address public owner;

    // This event indicates the last completed migration, the new contract address, and the ABI
    // for the new contract.
    event DSNPMigration(address contractAddr, string contractName);

    constructor() {
        owner = msg.sender;
    }

    modifier restricted() {
        if (msg.sender == owner) _;
    }

    // This method should be called only after deployment has succeeded.
    function upgraded(address contractAddr, string memory contractName) public restricted {
        emit DSNPMigration(contractAddr, contractName);
    }
}
