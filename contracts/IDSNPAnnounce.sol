pragma solidity ^0.8.0;

interface IDSNPAnnounce {
    event DSNPBatch(bytes32 hash, string dsnpUri);

    /**
     * FROM the Social Identity
     * @param hash Keccak256 hash of the content found at uri
     * @param dsnpUri string URL, ipfs, etc... to the content
     */
    function batch(bytes32 hash, string calldata dsnpUri) external;
}
