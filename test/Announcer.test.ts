import { ethers } from "hardhat";
import chai from "chai";
const { expect } = chai;

describe("annoucement", () => {
  const hash = ethers.utils.keccak256("0x");
  let announcer;

  describe("batch", () => {
    beforeEach(async () => {
      const Announcer = await ethers.getContractFactory("Announcer");
      announcer = await Announcer.deploy();
      await announcer.deployed();
    });

    it("batch emits a DSNPBatch event", async () => {
      await expect(
        announcer.batch(
          hash,
          "http://x.com"
        )
      )
        .to.emit(announcer, "DSNPBatch")
        .withArgs(
          hash,
          "http://x.com"
        );
    });
  });
});
