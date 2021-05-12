// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0 <0.9.0;

import "./IAnnounce.sol";

contract Announcer is IAnnounce {
    /**
     * @param announcements array of struct announcements
     */
    function batch(Announcement[] calldata announcements) external override {
        require(announcements.length < 100, "gas consumption is high");
        for (uint256 i = 0; i < announcements.length; i++) {
            emit DSNPBatch(announcements[i].dsnpType, announcements[i].hash, announcements[i].uri);
        }
    }
}
