//SPDX-License-Identifier: Unlicensed
pragma solidity ^0.7.3;

import "./IRegistry.sol";
import "hardhat/console.sol";

contract Registry is IRegistry {
    uint64 private idSequence = 1;
      
    // Id and identity contract adddress to be mapped to handle 
    struct Registration {
        uint64 id;
        address identityAddress;
    }
  
    // Map from handle to registration
    mapping (string => Registration) registrations;

    /**
     * @dev Register a new DSNP Id
     * @param addr Address for the new DSNP Id to point at
     * @param handle The handle for discovery
     * @return id of registration
     * 
     * TODO: MUST be called by someone who is authorized on the contract
     *      via `IDelegation(addr).isAuthorizedTo(msg.sender, Permission.OWNERSHIP_TRANSFER, block.number)`
     */
    function register(address addr, string calldata handle) external override returns (uint64) {
        // TODO: message identity contract for authorization

        return registerAfterAuth(addr, handle);
    }

    /**
     * @dev Register a new DSNP Id by EIP-712 Signature
     * @param r ECDSA Signature r value
     * @param s ECDSA Signature s value
     * @param v EIP-155 calculated Signature v value
     * @param addr Address for the new DSNP Id to point at
     * @param handle The handle for discovery
     * @return id of registration
     * 
     * MUST be signed by someone who is authorized on the contract
     *      via `IDelegation(addr).isAuthorizedTo(ecrecovedAddr, Permission.OWNERSHIP_TRANSFER, block.number)`
     */
    function registerByEIP712Sig(bytes32 r, bytes32 s, uint32 v, address addr, string calldata handle) external override returns (uint64) {

        // TODO: message identity contract for authorization with EIP712

        return registerAfterAuth(addr, handle);
    }

    /**
     * @dev Register a new DSNP Id. This checks that the handle has not already been set, 
     *      assigns the handle the next id and saves the address
     * @param addr Address for the new DSNP Id to point at
     * @param handle The handle for discovery
     * @return id of registration
     */
    function registerAfterAuth(address addr, string calldata handle) private returns (uint64) {
        // Checks
        Registration storage reg = registrations[handle];
        require(reg.id == 0, "Handle already exists");

        // Effects
        // Set id to latest sequence number then increment
        reg.id = idSequence++;

        reg.identityAddress = addr;

        // emit registration event
        emit DSNPRegistryUpdate(reg.id, addr, handle);

        return reg.id;
    }

    /**
     * @dev Alter a DSNP Id resolution address
     * @param newAddr Original or new address to resolve to
     * @param handle The handle to modify
     * 
     * MUST be called by someone who is authorized on the contract
     *      via `IDelegation(oldAddr).isAuthorizedTo(oldAddr, Permission.OWNERSHIP_TRANSFER, block.number)`
     * MUST emit DSNPRegistryUpdate
     */
    function changeAddress(address newAddr, string calldata handle) external override {
        // TODO: message old identity contract for authorization
        // TODO: message new identity contract for authorization?

        // Checks
        Registration storage reg = registrations[handle];
        require(reg.id != 0, "Handle does not exist");


        // Effects
        reg.identityAddress = newAddr;
        emit DSNPRegistryUpdate(reg.id, newAddr, handle);
    }

    /**
     * @dev Alter a DSNP Id resolution address by EIP-712 Signature
     * @param r ECDSA Signature r value
     * @param s ECDSA Signature s value
     * @param v EIP-155 calculated Signature v value
     * @param newAddr New address for the DSNP Id to point at
     * @param handle The handle to modify
     * 
     * MUST be signed by someone who is authorized on the contract
     *      via `IDelegation(oldAddr).isAuthorizedTo(ecrecovedAddr, Permission.OWNERSHIP_TRANSFER, block.number)`
     * MUST check that newAddr implements IDelegation interface
     * TODO: FIX THE ISSUE OF newAddr not being a part of the creation
     * MUST emit DSNPRegistryUpdate
     */
    function changeAddressByEIP712Sig(bytes32 r, bytes32 s, uint32 v, address newAddr, string calldata handle) external override {
        // TODO: message old identity contract for authorization
        // TODO: message new identity contract for authorization?

        // Checks
        Registration storage reg = registrations[handle];
        require(reg.id != 0, "Handle does not exist");


        // Effects
        reg.identityAddress = newAddr;
        emit DSNPRegistryUpdate(reg.id, newAddr, handle);
    }

    /**
     * @dev Alter a DSNP Id handle
     * @param oldHandle The previous handle for modification
     * @param newHandle The new handle to use for discovery
     * 
     * MUST NOT allow a registration of a handle that is already in use
     * MUST be called by someone who is authorized on the contract
     *      via `IDelegation(oldHandle -> addr).isAuthorizedTo(ecrecovedAddr, Permission.OWNERSHIP_TRANSFER, block.number)`
     * MUST emit DSNPRegistryUpdate
     */
    function changeHandle(string calldata oldHandle, string calldata newHandle) external override {
        // Checks

        Registration storage oldReg = registrations[oldHandle];
        require(oldReg.id != 0, "Old handle does not exist");

        // TODO: message oldReg.identityAddress for authorization

        Registration storage newReg = registrations[newHandle];
        require(newReg.id == 0, "New handle already exists");

        // Effects

        // assign to new registration
        newReg.id = oldReg.id;
        newReg.identityAddress = oldReg.identityAddress;

        // signal that the old handle is unassigned and available
        oldReg.id = 0;

        // notify the change
        emit DSNPRegistryUpdate(newReg.id, newReg.identityAddress, newHandle);
    }

    /**
     * @dev Alter a DSNP Id handle by EIP-712 Signature
     * @param r ECDSA Signature r value
     * @param s ECDSA Signature s value
     * @param v EIP-155 calculated Signature v value
     * @param oldHandle The previous handle for modification
     * @param newHandle The new handle to use for discovery
     * 
     * MUST NOT allow a registration of a handle that is already in use
     * MUST be signed by someone who is authorized on the contract
     *      via `IDelegation(handle -> addr).isAuthorizedTo(ecrecovedAddr, Permission.OWNERSHIP_TRANSFER, block.number)`
     * MUST emit DSNPRegistryUpdate
     */
    function changeHandleByEIP712Sig(bytes32 r, bytes32 s, uint32 v, string calldata oldHandle, string calldata newHandle) external override {
        // Checks

        Registration storage oldReg = registrations[oldHandle];
        require(oldReg.id != 0, "Old handle does not exist");

        // TODO: message oldReg.identityAddress for authorization with EIP712

        Registration storage newReg = registrations[newHandle];
        require(newReg.id == 0, "New handle already exists");

        // Effects

        // assign to new registration
        newReg.id = oldReg.id;
        newReg.identityAddress = oldReg.identityAddress;

        // signal that the old handle is unassigned and available
        oldReg.id = 0;

        // notify the change
        emit DSNPRegistryUpdate(newReg.id, newReg.identityAddress, newHandle);
    }

    /**
     * @dev Resolve a handle to a contract address
     * @param handle The handle to resolve
     * 
     * @return Address of the contract
     */
    function resolveHandleToAddress(string calldata handle) external view override returns (address) {
        Registration memory reg = registrations[handle];
        require(reg.id != 0, "Handle does not exist");
        return reg.identityAddress;
    }

    /**
     * @dev Resolve a handle to a DSNP Id
     * @param handle The handle to resolve
     * 
     * @return DSNP Id
     */
    function resolveHandleToId(string calldata handle)  external view override returns (uint64) {
        Registration memory reg = registrations[handle];
        require(reg.id != 0, "Handle does not exist");
        return reg.id;
    }
}