// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0 <0.9.0;

/**
 * @dev DSNP Identity Interface for managing delegates
 */
interface IDelegation {
    struct DelegateAdd {
        uint32 nonce;
        address delegateAddr;
        Role role;
    }

    struct DelegateRemove {
        uint32 nonce;
        address delegateAddr;
    }

    /**
     * @dev Enumerated Permissions
     *      Roles have different permissions
     *      APPEND ONLY
     */
    enum Permission {
        /**
         * @dev 0x0 NONE reserved for no permissions
         */
        NONE,
        /**
         * @dev 0x1 Sign a DSNP Announcement
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
     *      APPEND ONLY
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
    event DSNPAddDelegate(address indexed delegate, Role role);

    /**
     * @dev Log for removal of a delegate
     * @param delegate Address revoked
     */
    event DSNPRemoveDelegate(address indexed delegate);

    /**
     * @dev Add or change permissions for delegate
     * @param newDelegate Address to delegate new permissions to
     * @param role Role for the delegate
     *
     * MUST be called by owner or other delegate with permissions
     * MUST consider newDelegate to be valid from the beginning to time
     * MUST emit DSNPAddDelegate
     */
    function delegate(address newDelegate, Role role) external;

    /**
     * @dev Add or change permissions for delegate by EIP-712 signature
     * @param v EIP-155 calculated Signature v value
     * @param r ECDSA Signature r value
     * @param s ECDSA Signature s value
     * @param change Change data containing new delegate address, role, and nonce
     *
     * MUST be signed by owner or other delegate with permissions (implementation specific)
     * MUST consider newDelegate to be valid from the beginning to time
     * MUST emit DSNPAddDelegate
     */
    function delegateByEIP712Sig(
        uint8 v,
        bytes32 r,
        bytes32 s,
        DelegateAdd calldata change
    ) external;

    /**
     * @dev Remove Delegate
     * @param addr Address to remove all permissions from
     *
     * MUST be called by the delegate, owner, or other delegate with permissions
     * MUST store the block.number as the endBlock for response in isAuthorizedToAnnounce (exclusive)
     * MUST emit DSNPRemoveDelegate
     */
    function delegateRemove(address addr) external;

    /**
     * @dev Remove Delegate By EIP-712 Signature
     * @param v EIP-155 calculated Signature v value
     * @param r ECDSA Signature r value
     * @param s ECDSA Signature s value
     * @param change Change data containing new delegate address and nonce
     *
     * MUST be signed by the delegate, owner, or other delegate with permissions
     * MUST store the block.number as the endBlock for response in isAuthorizedToAnnounce (exclusive)
     * MUST emit DSNPRemoveDelegate
     */
    function delegateRemoveByEIP712Sig(
        uint8 v,
        bytes32 r,
        bytes32 s,
        DelegateRemove calldata change
    ) external;

    /**
     * @dev Checks to see if address is authorized with the given permission
     * @param addr Address that is used to test
     * @param permission Level of permission check. See Permission for details
     * @param blockNumber Check for authorization at a particular block number, 0x0 reserved for endless permissions
     * @return boolean
     *
     * @dev Return MAY change as deauthorization can revoke past messages
     */
    function isAuthorizedTo(
        address addr,
        Permission permission,
        uint256 blockNumber
    ) external view returns (bool);

    /**
     * @dev Get a delegate's nonce
     * @param addr The delegate's address to get the nonce for
     *
     * @return nonce value for delegate
     */
    function getNonceForDelegate(address addr) external view returns (uint32);
}
