// SPDX-License-Identifier: Apache-2.0
pragma solidity >= 0.8.0 <0.9.0;

import "./ERC165.sol";
import "./IDelegation.sol";

/**
 * This is a fake identity contract that satisfies the IDelegation interface.
 * It only supports one address configured during construction, and returns
 * true to all authorization requests so long as the provided address matches
 * the configured address.
 */
contract TestDelegate is ERC165, IDelegation {
    address private delegateAddr;

    constructor(address addr) {
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

    function supportsInterface(bytes4 interfaceID) external override pure returns (bool) {
        return 
            interfaceID == this.supportsInterface.selector ||   // ERC165
            interfaceID == this.delegate.selector ^             // IDelegation
                this.delegateByEIP712Sig.selector ^
                this.delegateRemove.selector ^
                this.delegateRemoveByEIP712Sig.selector ^
                this.isAuthorizedTo.selector;
    }
}

/**
 * This is a fake contract that only satisfies the ERC165 interface.
 * It can be used to test behavior against contracts that do NOT implement a required
 * interface.
 */
contract TestERC165 is ERC165 {
    function supportsInterface(bytes4 interfaceID) external override pure returns (bool) {
        return 
            interfaceID == this.supportsInterface.selector;   // ERC165
    }
}
