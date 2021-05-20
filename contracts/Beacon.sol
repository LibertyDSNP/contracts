// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

contract Beacon is UpgradeableBeacon {
    constructor(address _logic) UpgradeableBeacon(_logic) {}
}
