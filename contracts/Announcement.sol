pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./IDSNPAnnounce.sol";

contract Announcement is IDSNPAnnounce {
    function batch(bytes32 hash, string calldata dsnpUri) external override {
        emit DSNPBatch(hash, dsnpUri);
    }
}
