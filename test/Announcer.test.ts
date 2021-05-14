import { ethers } from "hardhat";
import chai from "chai";
const { expect } = chai;

describe("announcement", () => {
  const hash = ethers.utils.keccak256("0x");
  let announcer;

  describe("batch", () => {
    beforeEach(async () => {
      const Announcer = await ethers.getContractFactory("Announcer");
      announcer = await Announcer.deploy();
      await announcer.deployed();
    });

    it("batch emits a DSNPBatch event", async () => {
      await expect(announcer.batch([{ hash: hash, uri: "http://x.com", dsnpType: 1 }]))
        .to.emit(announcer, "DSNPBatch")
        .withArgs(1, hash, "http://x.com");
    });

    it("reverts when batch size is greater or equal to 100", async () => {
      const batch = Array(100).fill({ hash: hash, uri: "http://x.com", dsnpType: 1 });

      await expect(announcer.batch(batch)).to.be.revertedWith("gas consumption is high");
    });
  });
});
