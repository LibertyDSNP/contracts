// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0 <0.9.0;

// https://docs.openzeppelin.com/contracts/4.x/api/proxy#Proxy
import "@openzeppelin/contracts/proxy/Proxy.sol";


import "@openzeppelin/contracts/proxy/beacon/IBeacon.sol";

// This contract points to an IdentityBeacon. It is also upgradeable
// (as it obviously also inherits from UpgradeableBeacon)
contract IdentityBeaconProxy is Proxy, UpgradeableBeacon {
    /**
     * @dev Storage for the delegation data
     */
    struct BeaconStorage {
        address beacon;
        bool initialized;
    }

    //  Slot used to prevent memory collisions for proxy contracts, see
    //  https://blog.openzeppelin.com/upgradeability-using-unstructured-storage/
    //  a -1 offset is added so the preimage of the hash cannot be known, further reducing the chances of a possible attack.
    bytes32 private constant BEACON_SLOT = bytes32(uint256(keccak256("dsnp.org.beacon")) - 1);

    function _implementation() internal view override returns (address) {
        return IBeacon(_beaconData().beacon).implementation();
    }

    /**
     * @dev Initialize for use as a proxy's logic contract
     * @param owner Address to be set as the owner
     */
    function initialize(address beacon, address owner) external {
        BeaconStorage storage bs = _beaconData();
        // Checks
        require(bs.initialized == false, "Already initialized");

        // Beacon
        bs.beacon = beacon;
        bs.initialized = true;

        // Call Base Logic
        // solhint-disable avoid-low-level-calls
        (bool success, ) = IBeacon(beacon).implementation().delegatecall(
            abi.encodeWithSignature("initialize(address)", owner)
        );
        require(success, "initialize failed");
    }

    /**
     * @dev Return the beacon address variable
     * @return beaconStorage address of the beacon for the logic contract
     */
    function _beaconData() internal pure returns (BeaconStorage storage beaconStorage) {
        bytes32 position = BEACON_SLOT;
        // solhint-disable no-inline-assembly
        assembly {
            beaconStorage.slot := position
        }
    }
}
