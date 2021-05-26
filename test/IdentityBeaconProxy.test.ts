import { ethers } from "hardhat";
import chai from "chai";
const { expect } = chai;
import { describe } from "mocha";
import { DelegationPermission, DelegationRole } from "./helpers/DSNPEnums";

describe("IdentityBeaconProxy", () => {
  let beaconInstance, testDelegate, identityInstance, beaconFactoryInstance;
  let deployer, signer;
  const noMoneyAddress = "0x0A7D8ED2973c7495E043d5a7fe37684e51Dc707D";

  const deployProxy = async (beacon: string, owner: string): Promise<string> => {
    const receipt = await (
      await beaconFactoryInstance.createBeaconProxyWithOwner(beacon, owner)
    ).wait();
    const events = receipt?.events?.filter((x) => x.event === "ProxyCreated") || [];
    const addr = events[0]?.args?.addr;
    if (!addr) throw new Error("failed proxy creation");
    return addr;
  };

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

    const BeaconFactory = await ethers.getContractFactory("BeaconFactory");
    beaconFactoryInstance = await BeaconFactory.deploy(beaconInstance.address);
    await beaconFactoryInstance.deployed();
  });

  describe("Calls logic code", () => {
    it("Use IDelegation to hit Test Delegate code", async () => {
      const proxyAddress = await deployProxy(beaconInstance.address, noMoneyAddress);
      const proxyAsDelegate = await ethers.getContractAt("IDelegation", proxyAddress);
      const result = await proxyAsDelegate.isAuthorizedTo(noMoneyAddress, "0x1", "0x0");
      expect(result).to.be.true;
    });

    it("Use IDelegation to hit Test Delegate code and fail", async () => {
      const proxyAddress = await deployProxy(beaconInstance.address, noMoneyAddress);
      const proxyAsDelegate = await ethers.getContractAt("IDelegation", proxyAddress);
      await expect(proxyAsDelegate.delegate(noMoneyAddress, "0x1")).to.be.revertedWith(
        "Not implemented"
      );
    });

    it("Can update the beacon to hit a different logic contract", async () => {
      const proxyAddress = await deployProxy(beaconInstance.address, signer.address);

      // Test "failure"
      const proxyAsDelegate = await ethers.getContractAt("IDelegation", proxyAddress);
      await expect(
        proxyAsDelegate.connect(signer).delegate(noMoneyAddress, DelegationRole.ANNOUNCER)
      ).to.be.revertedWith("Not implemented");

      // Update beacon
      await beaconInstance.upgradeTo(identityInstance.address);

      // New Logic Contract "works"
      await expect(
        proxyAsDelegate.connect(signer).delegate(noMoneyAddress, DelegationRole.ANNOUNCER)
      ).to.be.revertedWith("Sender does not have the DELEGATE_ADD permission");
    });
  });

  describe("initialize", () => {
    it("is initialized with owner", async () => {
      const proxyAddress = await deployProxy(beaconInstance.address, noMoneyAddress);
      const TestDelegate = await ethers.getContractFactory("TestDelegate");
      const instance = TestDelegate.attach(proxyAddress);

      expect(
        await instance.isAuthorizedTo(noMoneyAddress, DelegationPermission.OWNERSHIP_TRANSFER, 0x0)
      ).to.be.true;
    });

    it("Doesn't allow for more than one initialize call", async () => {
      const proxyAddress = await deployProxy(beaconInstance.address, noMoneyAddress);
      const IdentityBeaconProxy = await ethers.getContractFactory("IdentityBeaconProxy");
      const instance = IdentityBeaconProxy.attach(proxyAddress);

      expect(instance.initialize(beaconInstance.address, signer.address)).to.be.revertedWith(
        "Already initialized"
      );
    });
  });
});
