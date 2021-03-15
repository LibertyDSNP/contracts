//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.3;

interface IAnnounce {
    event DSNPBatch(bytes32 hash, string dsnpUri);

    /**
     * @param hash Keccak256 hash of the content found at uri
     * @param dsnpUri string URL, ipfs, etc... to the content
     */
    function batch(bytes32 hash, string calldata dsnpUri) external;
}
