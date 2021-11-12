import { ethers } from "hardhat";
import chai from "chai";
const { expect } = chai;
import { describe } from "mocha";

describe("IdentityBeaconProxy", () => {
  let beaconInstance, testDelegate, identityInstance;
  let deployer, signer;

  beforeEach(async () => {
    [deployer, signer] = await ethers.getSigners();

    const Identity = await ethers.getContractFactory("Identity");
    identityInstance = await Identity.deploy("0x0000000000000000000000000000000000000000");
    await identityInstance.deployed();

    const TestDelegate = await ethers.getContractFactory("TestDelegate");
    testDelegate = await TestDelegate.deploy(signer.address);
    await testDelegate.deployed();

    const Beacon = await ethers.getContractFactory("Beacon");
    beaconInstance = await Beacon.deploy(testDelegate.address);
    await beaconInstance.deployed();
  });

  describe("implementation", () => {
    it("is set correctly", async () => {
      expect(await beaconInstance.implementation()).to.equal(testDelegate.address);
    });
  });

  describe("can be upgraded", () => {
    it("by the owner", async () => {
      await expect(beaconInstance.connect(deployer).upgradeTo(identityInstance.address)).to.not.be
        .reverted;
      expect(await beaconInstance.implementation()).to.equal(identityInstance.address);
    });
    it("but NOT by anyone else", async () => {
      await expect(beaconInstance.connect(signer).upgradeTo(identityInstance.address)).to.be
        .reverted;

      expect(await beaconInstance.implementation()).to.equal(testDelegate.address);
    });
    it("emits upgraded event", async () => {
      await expect(beaconInstance.connect(deployer).upgradeTo(identityInstance.address))
        .to.emit(beaconInstance, "Upgraded")
        .withArgs(identityInstance.address);
    });
  });
});
