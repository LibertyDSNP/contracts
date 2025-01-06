import { ethers } from "hardhat";
import chai from "chai";
const { expect } = chai;
import hre from "hardhat";


describe("IdentityBeaconProxy", () => {
  const deployIdentityAndBeacon = async () => {
    const [deployer, signer] = await ethers.getSigners();

    const Identity = await hre.ethers.getContractFactory("Identity");
    const identityInstance = await Identity.deploy("0x0000000000000000000000000000000000000000");

    const TestDelegate = await hre.ethers.getContractFactory("TestDelegate");
    const testDelegate = await TestDelegate.deploy(signer.address);
    let testDelegateAddress = await testDelegate.getAddress();

    const Beacon = await hre.ethers.getContractFactory("Beacon");

    const beaconInstance = await Beacon.deploy(testDelegateAddress, deployer.address);
    return { identityInstance, testDelegateAddress, beaconInstance, deployer, signer };
  };

  describe("implementation", () => {
    it("is set correctly", async () => {
      const { testDelegateAddress, beaconInstance } =
        await deployIdentityAndBeacon();
      expect(await beaconInstance.implementation()).to.equal(testDelegateAddress);
    });
  });

  describe("can be upgraded", () => {
    it("by the owner", async () => {
      const { identityInstance, beaconInstance, deployer } =
        await deployIdentityAndBeacon();
      let identityInstanceAddress = await identityInstance.getAddress();
      await expect(beaconInstance.connect(deployer).upgradeTo(identityInstanceAddress)).to.not.be
        .reverted;
      expect(await beaconInstance.implementation()).to.equal(identityInstanceAddress);
    });
    it("but NOT by anyone else", async () => {
      const { identityInstance, testDelegateAddress, beaconInstance, signer } =
        await deployIdentityAndBeacon();

      let identityInstanceAddress = await identityInstance.getAddress();

      await expect(beaconInstance.connect(signer).upgradeTo(identityInstanceAddress)).to.be
        .reverted;

      expect(await beaconInstance.implementation()).to.equal(testDelegateAddress);
    });
    it("emits upgraded event", async () => {
      const { identityInstance, beaconInstance, deployer } =
        await deployIdentityAndBeacon();

      let identityInstanceAddress = await identityInstance.getAddress();
      await expect(beaconInstance.connect(deployer).upgradeTo(identityInstanceAddress))
        .to.emit(beaconInstance, "Upgraded")
        .withArgs(identityInstanceAddress);
    });
  });
});
