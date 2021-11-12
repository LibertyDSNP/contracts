// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0 <0.9.0;

/**
 * @dev DSNP Identity Factory Interface for creating beacon following identities
 */
interface IIdentityBeaconFactory {
    /**
     * @dev event to log the created proxy contract address
     */
    event ProxyCreated(address addr);

    /**
     * @dev This MUST NOT be upgradable by the owner of the factory
     *
     * @return The current beacon contract suggested by this factory
     */
    function getBeacon() external view returns (address);

    /**
     * @dev Creates a new identity with the ecrecover address as the owner
     * @param owner The initial owner's address of the new contract
     *
     * @dev This MUST emit ProxyCreated with the address of the new proxy contract
     * @return The address of the newly created proxy contract
     */
    function createBeaconProxyWithOwner(address owner) external returns (address);
}
