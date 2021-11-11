// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

// This is the Beacon that the social network (developer) owns which can update its
// Identity logic (see Identity.sol) to a new version.
contract IdentityBeacon is UpgradeableBeacon {
    // solhint-disable-next-line no-empty-blocks
    constructor(address _logic) UpgradeableBeacon(_logic) {}
}
