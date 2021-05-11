// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0 <0.9.0;

import "./IDelegation.sol";
import "./ERC165.sol";

contract Identity is IDelegation, ERC165 {
    bytes32 private constant ownerPosition = keccak256("org.zeppelinos.identity.owner");
    /**
     * @dev We can store the role to permissions data currently via bitwise
     * uint256(...[32 bit ANNOUNCER permissions][32 bit OWNER permissions][32 bit NONE permissions])
     */
    uint256 constant rolePermissions =
    // Role.OWNER Mask
    ((1 << uint32(Permission.ANNOUNCE)) | (1 << uint32(Permission.OWNERSHIP_TRANSFER)) |  (1 << uint32(Permission.DELEGATE_ADD)) | (1 << uint32(Permission.DELEGATE_REMOVE))) << (uint32(Role.OWNER) * 32)
    // Role.ANNOUCNER Mask
    | (1 << uint32(Permission.ANNOUNCE)) << (uint32(Role.ANNOUNCER) * 32);

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

    function doesRoleHavePermission(Role role, Permission permission) public pure returns (bool) {
        // bitwise (possible) AND (check mask)
        return rolePermissions & ((1 << uint32(permission))) << (uint32(role) * 32) > 0x0;
    }

    function isAuthorizedTo(address addr, Permission permission, uint256 blockNumber)external override view returns (bool) {
//        return _doesRoleHavePermission(Role.ANNOUNCER, )
        return true; //(rolePermissions[uint(Role.ANNOUNCER)] == (1 << uint32(permission))) ? true : false;
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
