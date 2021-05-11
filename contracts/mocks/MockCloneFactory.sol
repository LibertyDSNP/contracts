// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/proxy/Clones.sol";

/// @dev a quick contract to deploy a simple clone
contract MockCloneFactory {
    using Clones for address;

    event ProxyCreated(address addr);

    function createCloneProxy(address logic) public {
        address instance = logic.clone();
        emit ProxyCreated(instance);
    }
}
