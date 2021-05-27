import { ethers, waffle } from "hardhat";
import { ContractTransaction } from "ethers";
import chai from "chai";
import { describe } from "mocha";
import { DelegationPermission, DelegationRole } from "./helpers/DSNPEnums";
const { expect } = chai;

const getProxyAddressFromResponse = async (response: ContractTransaction) => {
  const receipt = await response.wait();
  const events = receipt?.events?.filter((x) => x.event === "ProxyCreated") || [];
  if (events.length === 0) throw new Error("Unable to find ProxyCreated event!");
  return events[0]?.args?.addr;
};

describe("BeaconFactory", () => {
  let factoryInstance, beaconInstance, identityInstance;
  let deployer, signer;
  const noMoneyAddress = "0x0A7D8ED2973c7495E043d5a7fe37684e51Dc707D";

  beforeEach(async () => {
    [deployer, signer] = await ethers.getSigners();

    const Identity = await ethers.getContractFactory("Identity");
    identityInstance = await Identity.deploy("0x0000000000000000000000000000000000000000");
    await identityInstance.deployed();

    const Beacon = await ethers.getContractFactory("Beacon");
    beaconInstance = await Beacon.deploy(identityInstance.address);
    await beaconInstance.deployed();

    const BeaconFactory = await ethers.getContractFactory("BeaconFactory");
    factoryInstance = await BeaconFactory.deploy(beaconInstance.address);
    await factoryInstance.deployed();
  });

  describe("getBeacon", () => {
    it("has the default beacon set", async () => {
      const currentBeacon = await factoryInstance.getBeacon();
      expect(currentBeacon).to.equal(beaconInstance.address);
    });
  });

  describe("createBeaconProxy()", () => {
    it("can deploy a contract with the beacon", async () => {
      await expect(factoryInstance.connect(signer)["createBeaconProxy()"]()).to.emit(
        factoryInstance,
        "ProxyCreated"
      );
    });

    it("Event has a proper address", async () => {
      const response = await factoryInstance.connect(signer)["createBeaconProxy()"]();
      const newProxyAddress = await getProxyAddressFromResponse(response);
      expect(newProxyAddress).to.be.properAddress;
    });

    it("initializes the proxy", async () => {
      const response = await factoryInstance.connect(signer)["createBeaconProxy()"]();
      const newProxyAddress = await getProxyAddressFromResponse(response);

      const proxyAsDelegate = await ethers.getContractAt("IDelegation", newProxyAddress);

      expect(
        await proxyAsDelegate.isAuthorizedTo(
          signer.address,
          DelegationPermission.OWNERSHIP_TRANSFER,
          "0x0"
        )
      ).to.be.true;
    });
  });

  describe("createBeaconProxy(address)", () => {
    let otherBeacon, testDelegate;

    beforeEach(async () => {
      // Create a TestDelegate
      const TestDelegate = await ethers.getContractFactory("TestDelegate");
      testDelegate = await TestDelegate.deploy("0x0000000000000000000000000000000000000000");
      await testDelegate.deployed();

      const Beacon = await ethers.getContractFactory("Beacon");
      otherBeacon = await Beacon.deploy(testDelegate.address);
      await otherBeacon.deployed();
    });

    it("can deploy a contract with the beacon", async () => {
      await expect(
        factoryInstance.connect(signer)["createBeaconProxy(address)"](otherBeacon.address)
      ).to.emit(factoryInstance, "ProxyCreated");
    });

    it("Event has a proper address", async () => {
      const response = await factoryInstance
        .connect(signer)
        ["createBeaconProxy(address)"](otherBeacon.address);
      const newProxyAddress = await getProxyAddressFromResponse(response);
      expect(newProxyAddress).to.be.properAddress;
    });

    it("really is using the TestDelegate Logic", async () => {
      const response = await factoryInstance
        .connect(signer)
        ["createBeaconProxy(address)"](otherBeacon.address);
      const newProxyAddress = await getProxyAddressFromResponse(response);
      const proxyAsDelegate = await ethers.getContractAt("IDelegation", newProxyAddress);

      await expect(proxyAsDelegate.delegate(signer.address, DelegationRole.OWNER)).to.revertedWith(
        "Not implemented"
      );
    });

    it("initializes the proxy", async () => {
      const response = await factoryInstance
        .connect(signer)
        ["createBeaconProxy(address)"](otherBeacon.address);
      const newProxyAddress = await getProxyAddressFromResponse(response);

      const proxyAsDelegate = await ethers.getContractAt("IDelegation", newProxyAddress);

      expect(
        await proxyAsDelegate.isAuthorizedTo(
          signer.address,
          DelegationPermission.OWNERSHIP_TRANSFER,
          "0x0"
        )
      ).to.be.true;
    });
  });

  describe("createBeaconProxyWithOwner", () => {
    it("can deploy a contract with the beacon", async () => {
      await expect(
        factoryInstance
          .connect(signer)
          .createBeaconProxyWithOwner(beaconInstance.address, noMoneyAddress)
      ).to.emit(factoryInstance, "ProxyCreated");
    });

    it("Event has a proper address", async () => {
      const response = await factoryInstance
        .connect(signer)
        .createBeaconProxyWithOwner(beaconInstance.address, noMoneyAddress);
      const newProxyAddress = await getProxyAddressFromResponse(response);
      expect(newProxyAddress).to.be.properAddress;
    });

    it("can really is use the TestDelegate Logic", async () => {
      // Create a TestDelegate
      const TestDelegate = await ethers.getContractFactory("TestDelegate");
      const testDelegate = await TestDelegate.deploy("0x0000000000000000000000000000000000000000");
      await testDelegate.deployed();

      const Beacon = await ethers.getContractFactory("Beacon");
      const otherBeacon = await Beacon.deploy(testDelegate.address);
      await otherBeacon.deployed();

      const response = await factoryInstance
        .connect(signer)
        .createBeaconProxyWithOwner(otherBeacon.address, noMoneyAddress);
      const newProxyAddress = await getProxyAddressFromResponse(response);
      const proxyAsDelegate = await ethers.getContractAt("IDelegation", newProxyAddress);

      await expect(proxyAsDelegate.delegate(signer.address, DelegationRole.OWNER)).to.revertedWith(
        "Not implemented"
      );
    });

    it("initializes the proxy with noMoneyAddress", async () => {
      const response = await factoryInstance
        .connect(signer)
        .createBeaconProxyWithOwner(beaconInstance.address, noMoneyAddress);
      const newProxyAddress = await getProxyAddressFromResponse(response);

      const proxyAsDelegate = await ethers.getContractAt("IDelegation", newProxyAddress);

      expect(
        await proxyAsDelegate.isAuthorizedTo(
          noMoneyAddress,
          DelegationPermission.OWNERSHIP_TRANSFER,
          "0x0"
        )
      ).to.be.true;
    });
  });
});
