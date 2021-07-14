// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0 <0.9.0;

interface IPublish {
    struct Publication {
        int16 announcementType;
        string fileUrl;
        bytes32 fileHash;
    }

    /**
     * @dev Log Event for each batch published
     * @param announcementType The type of Announcement in the batch file
     * @param fileHash The keccak hash of the batch file
     * @param fileUrl A url that resolves to the batch file
     */
    event DSNPBatchPublication(int16 indexed announcementType, bytes32 fileHash, string fileUrl);

    /**
     * @param publications Array of Batch struct to publish
     */
    function publish(Publication[] calldata publications) external;
}
