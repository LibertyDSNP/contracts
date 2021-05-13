// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0 <0.9.0;

import "./IDelegation.sol";
import "./ERC165.sol";

contract Identity is IDelegation, ERC165 {
    /**
     * @dev Used for storing an address's delegation data
     */
    struct AddressDelegation {
        Role role;
        uint64 endBlock;
    }

    /**
     * @dev Storage for the delegation data
     */
    struct DelegationStorage {
        bool initialized;
        mapping(address => AddressDelegation) delegations;
    }

    bytes32 private constant DELEGATION_STORAGE_SLOT =
        bytes32(uint256(keccak256("dsnp.org.delegations")) - 1);

    /**
     * @dev We can store the role to permissions data currently via bitwise
     * uint256(...[32 bit ANNOUNCER permissions][32 bit OWNER permissions][32 bit NONE permissions])
     */
    uint256 constant rolePermissions =
        // Role.OWNER Mask
        (((1 << uint32(Permission.ANNOUNCE)) |
            (1 << uint32(Permission.OWNERSHIP_TRANSFER)) |
            (1 << uint32(Permission.DELEGATE_ADD)) |
            (1 << uint32(Permission.DELEGATE_REMOVE))) << (uint32(Role.OWNER) * 32)) |
            // Role.ANNOUNCER Mask
            ((1 << uint32(Permission.ANNOUNCE)) << (uint32(Role.ANNOUNCER) * 32));

    /*
     * @dev Modifier that requires that the contract data be initialized
     */
    modifier isInitialized() {
        require(_delegationData().initialized, "Contract not initialized");
        _;
    }

    /**
     * @dev Constructor is only for use if the contract is being used directly
     *      Construct with address(0x0) for logic contracts
     * @param owner Address to be set as the owner
     */
    constructor(address owner) {
        _setDelegateRole(owner, Role.OWNER);
        _delegationData().initialized = true;
    }

    /**
     * @dev Initialize for use as a proxy's logic contract
     * @param owner Address to be set as the owner
     */
    function initialize(address owner) external {
        // Checks
        require(_delegationData().initialized == false, "Already initialized");
        // Effects
        _setDelegateRole(owner, Role.OWNER);
        _delegationData().initialized = true;
    }

    /**
     * @dev Return the data storage slot
     *      Slot used to prevent memory collisions for proxy contracts
     * @return delegation storage
     */
    function _delegationData() internal pure returns (DelegationStorage storage ds) {
        bytes32 position = DELEGATION_STORAGE_SLOT;
        assembly {
            ds.slot := position
        }
    }

    /**
     * @dev Check to see if the role has a particular permission
     * @param role The Role to test against
     * @param permission The Permission to test with the role
     * @return true if the role is assigned the given permission
     */
    function doesRoleHavePermission(Role role, Permission permission) public pure returns (bool) {
        // bitwise (possible) AND (check single permission mask)
        return rolePermissions & (((1 << uint32(permission))) << (uint32(role) * 32)) > 0x0;
    }

    /**
     * @dev Internal check authorization method
     * @param addr The address to inspect permissions of
     * @param permission The permission to check
     * @param blockNumber Block number to check at. Use 0x0 for endless permissions.
     * @return true if the address has the permission at the given block
     */
    function _checkAuthorization(
        address addr,
        Permission permission,
        uint256 blockNumber
    ) internal view returns (bool) {
        AddressDelegation storage delegation = _delegationData().delegations[addr];
        return
            // endBlock check, 0x0 reserved for endless permissions
            (delegation.endBlock == 0 || (delegation.endBlock > blockNumber && blockNumber != 0)) &&
            // Permission check
            doesRoleHavePermission(delegation.role, permission);
    }

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
    ) external view override returns (bool) {
        return _checkAuthorization(addr, permission, blockNumber);
    }

    /**
    * @dev Assigns a delegate role
    * @param addr The address to assign the given role to
    * @param role The role to assign
    */
    function _setDelegateRole(address addr, Role role) internal {
        AddressDelegation storage delegation = _delegationData().delegations[addr];
        delegation.role = role;
        delegation.endBlock = 0x0;
        emit DSNPAddDelegate(addr, role);
    }

    /**
     * @dev Add or change permissions for delegate
     * @param newDelegate Address to delegate new permissions to
     * @param role Role for the delegate
     *
     * MUST be called by owner or other delegate with permissions
     * MUST consider newDelegate to be valid from the beginning to time
     * MUST emit DSNPAddDelegate
     */
    function delegate(address newDelegate, Role role) external override {
        // Checks
        require(
            _checkAuthorization(msg.sender, Permission.DELEGATE_ADD, block.number),
            "Sender does not have the DELEGATE_ADD permission."
        );
        require(role != Role.NONE, "Role.NONE not allowed. Use delegateRemove.");

        // Effects
        _setDelegateRole(newDelegate, role);
    }

    /**
     * @dev Add or change permissions for delegate by EIP-712 signature
     * @param r ECDSA Signature r value
     * @param s ECDSA Signature s value
     * @param v EIP-155 calculated Signature v value
     * @param newDelegate Address to delegate new permissions to
     * @param role Role for the delegate
     *
     * MUST be signed by owner or other delegate with permissions (implementation specific)
     * MUST consider newDelegate to be valid from the beginning to time
     * MUST emit DSNPAddDelegate
     */
    function delegateByEIP712Sig(
        bytes32 r,
        bytes32 s,
        uint32 v,
        address newDelegate,
        Role role
    ) external override {
        // Get Signer
        address signer;

        // Checks
        require(
            _checkAuthorization(signer, Permission.DELEGATE_ADD, block.number),
            "Signer does not have the DELEGATE_ADD permission."
        );
        require(role != Role.NONE, "Role.NONE not allowed. Use delegateRemove.");
        require(role <= Role.ANNOUNCER, "Unknown Role");

        // Effects
        _setDelegateRole(newDelegate, role);
    }

    /**
    * @dev Removes a delegate role at a given point
    * @param addr The address to revoke the given role to
    * @param endBlock The exclusive block to end permissions on (0x1 for always)
    */
    function _setDelegateEnd(address addr, uint64 endBlock) internal {
        AddressDelegation storage delegation = _delegationData().delegations[addr];
        delegation.endBlock = endBlock;
        emit DSNPRemoveDelegate(addr, endBlock);
    }

    /**
     * @dev Remove Delegate
     * @param addr Address to remove all permissions from
     * @param endBlock Block number to consider the permissions terminated (MUST be > 0x0).
     *
     * MUST be called by the delegate, owner, or other delegate with permissions
     * MUST store endBlock for response in isAuthorizedToAnnounce (exclusive)
     * MUST emit DSNPRemoveDelegate
     */
    function delegateRemove(address addr, uint64 endBlock) external override {
        require(
            // Always allow self removal
            msg.sender == addr ||
                _checkAuthorization(msg.sender, Permission.DELEGATE_REMOVE, block.number),
            "Sender does not have the DELEGATE_REMOVE permission."
        );
        require(endBlock > 0x0, "endBlock 0x0 reserved for endless permissions");

        // Effects
        _setDelegateEnd(addr, endBlock);
    }

    /**
     * @dev Remove Delegate By EIP-712 Signature
     * @param addr Address to remove all permissions from
     * @param endBlock Block number to consider the permissions terminated (MUST be > 0x0).
     * @param r ECDSA Signature r value
     * @param s ECDSA Signature s value
     * @param v EIP-155 calculated Signature v value
     *
     * MUST be signed by the delegate, owner, or other delegate with permissions
     * MUST store endBlock for response in isAuthorizedToAnnounce (exclusive)
     * MUST emit DSNPRemoveDelegate
     */
    function delegateRemoveByEIP712Sig(
        bytes32 r,
        bytes32 s,
        uint32 v,
        address addr,
        uint64 endBlock
    ) external override {
        require(false, "Not implemented");
        // Checks

        require(
            msg.sender == addr ||
                _checkAuthorization(msg.sender, Permission.DELEGATE_REMOVE, block.number),
            "Sender does not have the DELEGATE_REMOVE permission."
        );

        // Effects
        _setDelegateEnd(addr, endBlock);
    }

    /**
     * @notice Query if a contract implements an interface
     * @param interfaceID The interface identifier, as specified in ERC-165
     * @dev Interface identification is specified in ERC-165. This function
     *  uses less than 30,000 gas.
     * @return `true` if the contract implements `interfaceID` and
     *  `interfaceID` is not 0xffffffff, `false` otherwise
     */
    function supportsInterface(bytes4 interfaceID) external pure override returns (bool) {
        return
            interfaceID == type(ERC165).interfaceId || interfaceID == type(IDelegation).interfaceId;
    }
}
