import { ethers } from "hardhat";
import chai from "chai";
const { expect } = chai;



describe("Identity", () => {
  let signer;
  let identity
  beforeEach(async () => {
    const signers = await ethers.getSigners();
    signer = signers[0];
    const Identity = await ethers.getContractFactory("Identity");
    identity = await Identity.deploy();
    await identity.deployed();
  });
  describe("is authorized", () => {
    it("returns true if permission is Announce", async () => {
      const isAuthorized = await identity.isAuthorizedTo(signer.address, 0x1, 0);
      expect(isAuthorized).to.equal(true);
    });
  });
});
