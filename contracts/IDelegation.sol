// SPDX-License-Identifier: Apache-2.0
pragma solidity >= 0.8.0 <0.9.0;

/**
 * @dev DSNP Identity Interface for managing delegates
 */
interface IDelegation {

    /**
     * @dev Enumerated Permissions
     *      Roles have different permissions
     */
    enum Permission {
        /**
         * @dev 0x0 NONE reserved for no permissions 
         */
        NONE,

        /**
         * @dev 0x1 Announce any DSNP message
         */
        ANNOUNCE,

        /**
         * @dev 0x2 Add new delegate
         */
        OWNERSHIP_TRANSFER,

        /**
         * @dev 0x3 Add new delegates
         */
        DELEGATE_ADD,

        /**
         * @dev 0x4 Remove delegates
         */
        DELEGATE_REMOVE
    }

    /**
     * @dev Enumerated Roles
     *      Roles have different permissions 
     *      For example: 
     */
    enum Role {
        /**
         * @dev 0x0 NONE reserved for no permissions 
         */
        NONE,

        /**
         * @dev 0x1 OWNER:
         *      - Permission.*
         */
        OWNER,

        /**
         * @dev 0x2 ANNOUNCER:
         *      - Permission.ANNOUNCE
         */
        ANNOUNCER
    }

    /**
     * @dev Log for addition of a new delegate
     * @param delegate Address delegated
     * @param role Permission Role
     */
    event DSNPAddDelegate(address delegate, Role role);

    /**
     * @dev Log for removal of a delegate
     * @param delegate Address revoked 
     * @param endBlock Block number considered to be the end of the delegate permissions
     */
    event DSNPRemoveDelegate(address delegate, uint64 endBlock);

    /**
     * @dev Add or change permissions for delegate 
     * @param newDelegate Address to delegate new permissions to
     * @param permission Permission level
     * 
     * MUST be called by owner or other delegate with permissions
     * MUST consider newDelegate to be valid from the beginning to time
     * MUST emit DSNPAddDelegate
     */
    function delegate(address newDelegate, Role role, Permission permission) external;

    /**
     * @dev Add or change permissions for delegate by EIP-712 signature
     * @param r ECDSA Signature r value
     * @param s ECDSA Signature s value
     * @param v EIP-155 calculated Signature v value
     * @param newDelegate Address to delegate new permissions to
     * @param permission Permission level
     * 
     * MUST be signed by owner or other delegate with permissions (implementation specific)
     * MUST consider newDelegate to be valid from the beginning to time
     * MUST emit DSNPAddDelegate
     */
    function delegateByEIP712Sig(bytes32 r, bytes32 s, uint32 v, address newDelegate, Role role, Permission permission) external;

    /**
     * @dev Remove Delegate
     * @param addr Address to remove all permissions from
     * @param endBlock Block number to consider the permissions terminated (MUST be > 0x0). 
     * 
     * MUST be called by the delegate, owner, or other delegate with permissions
     * MUST store endBlock for response in isAuthorizedToAnnounce
     * MUST emit DSNPRemoveDelegate
     */
    function delegateRemove(address addr, uint64 endBlock) external;

    /**
     * @dev Remove Delegate By EIP-712 Signature
     * @param addr Address to remove all permissions from
     * @param endBlock Block number to consider the permissions terminated (MUST be > 0x0).
     * @param r ECDSA Signature r value
     * @param s ECDSA Signature s value
     * @param v EIP-155 calculated Signature v value
     * 
     * MUST be signed by the delegate, owner, or other delegate with permissions
     * MUST store endBlock for response in isAuthorizedToAnnounce
     * MUST emit DSNPRemoveDelegate
     */
    function delegateRemoveByEIP712Sig(bytes32 r, bytes32 s, uint32 v, address addr, uint64 endBlock) external;

    /**
     * @dev Checks to see if address is authorized to announce messages
     * @param addr Address that is used to test with ecrecover
     * @param permission Level of permission check. See Permission for details
     * @param blockNumber Check for authorization at a particular block number
     * @return boolean 
     * 
     * @dev Return MAY change as deauthorization can revoke past messages
     */
    function isAuthorizedTo(address addr, Permission permission, uint256 blockNumber) external view returns (bool);
}