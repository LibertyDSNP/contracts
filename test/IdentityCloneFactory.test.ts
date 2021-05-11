import { ethers } from "hardhat";
import chai from "chai";
const { expect } = chai;

describe("IdentityCloneFactory", () => {
  let signer;
  let identity, factory;

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    signer = signers[0];

    const IdentityCloneFactory = await ethers.getContractFactory("IdentityCloneFactory");
    factory = await IdentityCloneFactory.deploy();
    await factory.deployed();

    const Identity = await ethers.getContractFactory("Identity");
    identity = await Identity.deploy();
    await identity.deployed();
  });
  describe("createCloneProxy", () => {
    it("can create a clone", async () => {
      const receipt = await factory.createCloneProxy(identity.address);

      console.log({receipt});
      // const isAuthorized = await identity.isAuthorizedTo(signer.address, 0x1, 0);
      // expect(isAuthorized).to.equal(true);
    });
  });
});
