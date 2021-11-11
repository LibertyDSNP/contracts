// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

import "./IIdentityBeaconFactory.sol";
import "./IdentityBeaconProxy.sol";
import "./Identity.sol";
import "./IRegistry.sol";

contract IdentityBeaconProxyFactory is IIdentityBeaconFactory {
    address private immutable defaultBeacon;

    // this should actually be the byteCode
    constructor(bytes32 _beaconAddr, address _registry) {
        defaultBeacon = _beaconAddr;
    }

    /**
     * @return The current beacon contract suggested by this factory
     */
    function getBeacon() external view override returns (address) {
        return defaultBeacon;
    }

    /**
     * @dev Creates a new identity with the ecrecover address as the owner
     * @param beacon The beacon address to use logic contract resolution
     * @param owner The initial owner's address of the new contract
     *
     * @dev This MUST emit ProxyCreated with the address of the new proxy contract
     * @return The address of the newly created proxy contract
     */
    function createBeaconProxyWithOwner(address owner)
        external
        override
        returns (address)
    {
        address proxy = createClone();
        // set the owner for the proxy here by


        return proxy;
    }

    function createClone() internal returns (address result) {
        bytes20 targetBytes = bytes20(target);
        // 363d3d373d3d3d363d73bebebebebebebebebebebebebebebebebebebebe5af43d82803e903d91602b57fd5bf3
        assembly {
            let clone := mload(0x40)
            mstore(clone, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(clone, 0x14), defaultBeacon)
            mstore(add(clone, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            result := create(0, clone, 0x37)
        }
    }

}
