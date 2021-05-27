// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0 <0.9.0;

import "../ERC165.sol";
import "../IDelegation.sol";

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

    function initialize(address owner) external {
        delegateAddr = owner;
    }

    function delegate(address newDelegate, Role role) external override {
        require(false, "Not implemented");
    }

    function delegateByEIP712Sig(
        uint8 v,
        bytes32 r,
        bytes32 s,
        DelegateAdd calldata change
    ) external override {
        require(false, "Not implemented");
    }

    function delegateRemove(address addr, uint64 endBlock) external override {
        require(false, "Not implemented");
    }

    function delegateRemoveByEIP712Sig(
        uint8 v,
        bytes32 r,
        bytes32 s,
        DelegateRemove calldata change
    ) external override {
        require(false, "Not implemented");
    }

    function isAuthorizedTo(
        address addr,
        Permission permission,
        uint256 blockNumber
    ) external view override returns (bool) {
        return addr == delegateAddr;
    }

    function getNonceForDelegate(address addr) external view override returns (uint32) {
        require(false, "Not implemented");
        return 0;
    }

    function supportsInterface(bytes4 interfaceID) external pure override returns (bool) {
        return
            interfaceID == type(ERC165).interfaceId || interfaceID == type(IDelegation).interfaceId;
    }
}

/**
 * This is a fake contract that only satisfies the ERC165 interface.
 * It can be used to test behavior against contracts that do NOT implement a required
 * interface.
 */
contract TestERC165 is ERC165 {
    function supportsInterface(bytes4 interfaceID) external pure override returns (bool) {
        return interfaceID == type(ERC165).interfaceId;
    }
}
