import { ethers } from "hardhat";
import chai from "chai";
const { expect } = chai;

describe("publisher", () => {
  const hash = ethers.utils.keccak256("0x");
  let publisher;

  describe("publish", () => {
    beforeEach(async () => {
      const Publisher = await ethers.getContractFactory("Publisher");
      publisher = await Publisher.deploy();
      await publisher.deployed();
    });

    it("batch emits a DSNPBatchPublication event", async () => {
      await expect(publisher.publish([{ hash: hash, url: "http://x.com", dsnpType: 1 }]))
        .to.emit(publisher, "DSNPBatchPublication")
        .withArgs(1, hash, "http://x.com");
    });

    it("reverts when batch size is greater or equal to 100", async () => {
      const batch = Array(100).fill({ hash: hash, url: "http://x.com", dsnpType: 1 });

      await expect(publisher.publish(batch)).to.be.revertedWith("gas consumption is high");
    });
  });
});
