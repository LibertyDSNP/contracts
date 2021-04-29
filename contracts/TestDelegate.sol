//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.7.3;

import "./IDelegate.sol";

/**
 * This is a stub identity contract that satisfies the IDelegation interface.
 * It only supports one address configured during construction, and returns
 * true to all authorization requests so long as the provided address matches
 * the configured address.
 */
contract TestDelegate is IDelegation {
    address private delegateAddr;

    constructor(address addr) public {
        delegateAddr = addr;
    }

    function delegate(address newDelegate, Role role, Permission permission) external override {
        require(false, "Not implemented");
    }

    function delegateByEIP712Sig(bytes32 r, bytes32 s, uint32 v, address newDelegate, Role role, Permission permission) external override {
        require(false, "Not implemented");
    }

    function delegateRemove(address addr, uint64 endBlock) external override {
        require(false, "Not implemented");
    }

    function delegateRemoveByEIP712Sig(bytes32 r, bytes32 s, uint32 v, address addr, uint64 endBlock) external override {
        require(false, "Not implemented");
    }

    function isAuthorizedTo(address addr, Permission permission, uint256 blockNumber) external override view returns (bool) {
        return addr == delegateAddr;
    }
}
