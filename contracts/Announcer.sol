//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.3;

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
