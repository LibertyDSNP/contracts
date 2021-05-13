// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0 <0.9.0;

import "./IDelegation.sol";
import "./ERC165.sol";

contract Identity is IDelegation, ERC165 {
    struct AddressDelegation {
        Role role;
        uint64 endBlock;
    }

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

    constructor(address owner) {
        _setDelegateRole(owner, Role.OWNER);
        _delegationData().initialized = true;
    }

    function initialize(address owner) external {
        // Checks
        require(_delegationData().initialized == false, "Already initialized");
        // Effects
        _setDelegateRole(owner, Role.OWNER);
        _delegationData().initialized = true;
    }

    function _delegationData() internal pure returns (DelegationStorage storage ds) {
        bytes32 position = DELEGATION_STORAGE_SLOT;
        assembly {
            ds.slot := position
        }
    }

    function doesRoleHavePermission(Role role, Permission permission) public pure returns (bool) {
        // bitwise (possible) AND (check single permission mask)
        return rolePermissions & (((1 << uint32(permission))) << (uint32(role) * 32)) > 0x0;
    }

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

    function isAuthorizedTo(
        address addr,
        Permission permission,
        uint256 blockNumber
    ) external view override returns (bool) {
        return _checkAuthorization(addr, permission, blockNumber);
    }

    function _setDelegateRole(address addr, Role role) internal {
        AddressDelegation storage delegation = _delegationData().delegations[addr];
        delegation.role = role;
        delegation.endBlock = 0x0;
        emit DSNPAddDelegate(addr, role);
    }

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

    function _setDelegateEnd(address addr, uint64 endBlock) internal {
        AddressDelegation storage delegation = _delegationData().delegations[addr];
        delegation.endBlock = endBlock;
        emit DSNPRemoveDelegate(addr, endBlock);
    }

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

    function supportsInterface(bytes4 interfaceID) external pure override returns (bool) {
        return
            interfaceID == type(ERC165).interfaceId || interfaceID == type(IDelegation).interfaceId;
    }
}
