import hre from "hardhat";
import chai from "chai";
import { keccak256} from "js-sha3";

const { expect } = chai;

const ethers = hre.ethers


describe("publisher", () => {
  const hash = keccak256("0x");
  let publisher;

  describe("publish", () => {
    beforeEach(async () => {
      const Publisher = await ethers.getContractFactory("Publisher");
      publisher = await Publisher.deploy();
    });

    it("batch emits a DSNPBatchPublication event", async () => {
      await expect(
        publisher.publish([{ fileHash: hash, fileUrl: "http://x.com", announcementType: 1 }])
      )
        .to.emit(publisher, "DSNPBatchPublication")
        .withArgs(1, hash, "http://x.com");
    });

    it("reverts when batch size is greater or equal to 100", async () => {
      const batch = Array(100).fill({
        fileHash: hash,
        fileUrl: "http://x.com",
        announcementType: 1,
      });

      await expect(publisher.publish(batch)).to.be.revertedWith("gas consumption is high");
    });
  });
});
