import { ethers } from "hardhat";
import chai from "chai";
const { expect } = chai;

describe("annoucement", () => {
  let announcement;

  describe("bach", () => {
    beforeEach(async () => {
      const Announcement = await ethers.getContractFactory("Announcement");
      announcement = await Announcement.deploy();
      await announcement.deployed();
    });

    it("batch emits emit", async () => {
      await expect(
        announcement.batch(
          "0x044852b2a670ade5407e78fb2863c51de9fcb96542a07186fe3aeda6bb8a116d",
          "http://x.com"
        )
      )
        .to.emit(announcement, "DSNPBatch")
        .withArgs(
          "0x044852b2a670ade5407e78fb2863c51de9fcb96542a07186fe3aeda6bb8a116d",
          "http://x.com"
        );
    });
  });
});
