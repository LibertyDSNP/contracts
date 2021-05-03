// SPDX-License-Identifier: Apache-2.0
pragma solidity >= 0.8.0 <0.9.0;

import "./IAnnounce.sol";

contract Announcer is IAnnounce {
    /**
     * @param hash Keccak256 hash of the content found at uri
     * @param dsnpUri string URL, ipfs, etc... to the content
     */
    function batch(bytes32 hash, string calldata dsnpUri) external override {
        emit DSNPBatch(hash, dsnpUri);
    }
}
