// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0 <0.9.0;

import "./IDelegation.sol";
import "./ERC165.sol";

contract Identity is IDelegation, ERC165 {
    bytes32 private constant ownerPosition = keccak256("org.zeppelinos.identity.owner");
    uint32[] rolePermissions = new uint32[](3);

    constructor() public {
        rolePermissions[uint(Role.NONE)] = 0;
        rolePermissions[uint(Role.OWNER)] =  (1 << uint32(Permission.ANNOUNCE)) | (1 << uint32(Permission.OWNERSHIP_TRANSFER)) |  (1 << uint32(Permission.DELEGATE_ADD)) | (1 << uint32(Permission.DELEGATE_REMOVE));
        rolePermissions[uint(Role.ANNOUNCER)] = 1 << uint32(Permission.ANNOUNCE);
    }

//    function storeIdentityOwner (address idenityOwner) public {
//        bytes32 position = ownerposition;
//        assembly {
//            sstore(position, identityOwner)
//        }
//    }
//
//    function identityOwner() public view returns(address owner) {
//        bytes32 position = ownerPosition;
//        assembly {
//            owner: = sload(position)
//        }
//    }


    function isAuthorizedTo(address addr, Permission permission, uint256 blockNumber)external override view returns (bool) {
        return (rolePermissions[uint(Role.ANNOUNCER)] == (1 << uint32(permission))) ? true : false;
    }

    function delegate(address newDelegate, Role role,  Permission permission) external override {
        require(false, "Not implemented");
    }

    function delegateByEIP712Sig(
        bytes32 r,
        bytes32 s,
        uint32 v,
        address newDelegate,
        Role role,
        Permission permission
    ) external override {
        require(false, "Not implemented");
    }


    function delegateRemove(address addr, uint64 endBlock) external override{
        require(false, "Not implemented");
    }

    function delegateRemoveByEIP712Sig(
        bytes32 r,
        bytes32 s,
        uint32 v,
        address addr,
        uint64 endBlock
    ) external override{
        require(false, "Not implemented");
    }


    /* solhint-enable */

    function supportsInterface(bytes4 interfaceID) external pure override returns (bool) {
        return
        interfaceID == this.supportsInterface.selector || // ERC165
        interfaceID == // IDelegation
        this.delegate.selector ^
        this.delegateByEIP712Sig.selector ^
        this.delegateRemove.selector ^
        this.delegateRemoveByEIP712Sig.selector ^
        this.isAuthorizedTo.selector;
    }
}
