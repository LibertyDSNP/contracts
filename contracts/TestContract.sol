//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.3;

import "hardhat/console.sol";

contract TestContract {
    string greeting;

    constructor(string memory _greeting) {
        greeting = _greeting;
    }

    function greet() public view returns (string memory) {
        return greeting;
    }
}
