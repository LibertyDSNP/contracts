// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0 <0.9.0;

interface IAnnounce {
    struct Announcement {
        int16 dsnpType;
        string uri;
        bytes32 hash;
    }

    event DSNPBatch(int16 indexed dsnpType, bytes32 dsnpHash, string dsnpUri);

    /**
     * @param announcements Array of announcement struct
     */
    function batch(Announcement[] calldata announcements) external;
}
