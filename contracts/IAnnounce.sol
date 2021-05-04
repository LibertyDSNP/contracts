// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0 <0.9.0;

interface IAnnounce {
    event DSNPBatch(bytes32 hash, string dsnpUri);

    /**
     * @param hash Keccak256 hash of the content found at uri
     * @param dsnpUri string URL, ipfs, etc... to the content
     */
    function batch(bytes32 hash, string calldata dsnpUri) external;
}
