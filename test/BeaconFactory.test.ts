import hre from "hardhat";
import { ContractTransaction, Signer } from "ethers";
import chai from "chai";
import { DelegationPermission, DelegationRole } from "./helpers/DSNPEnums";
const { expect } = chai;
const ethers = hre.ethers;

const getContractFactory = hre.ethers.getContractFactory;

const getProxyAddressFromResponse = async (response: ContractTransaction) => {
  const receipt = await response.wait();
  const events = receipt?.events?.filter((x) => x.event === "ProxyCreated") || [];
  if (events.length === 0) throw new Error("Unable to find ProxyCreated event!");
  return events[0]?.args?.addr;
};

type DSNPRegistryUpdate = {
  id: number;
  addr: string;
  handle: string;
};

const getDSNPRegistryUpdateFromResponse = async (
  response: ContractTransaction
): Promise<DSNPRegistryUpdate> => {
  const receipt = await response.wait();
  const Registry = await getContractFactory("Registry");
  const regEvents = (l) => {
    try {
      return Registry.interface.parseLog(l);
    } catch {
      return;
    }
  };

  const events =
    receipt?.events?.map(regEvents).filter((e) => e?.name === "DSNPRegistryUpdate") || [];
  if (events.length === 0) throw new Error("Unable to find DSNPRegistryUpdate event!");
  return {
    id: events[0]?.args[0],
    addr: events[0]?.args[1],
    handle: events[0]?.args[2],
  };
};

describe("BeaconFactory", () => {
  let factoryInstance, beaconInstance, identityInstance;
  let beaconAddress = '';
  let deployer: Signer, signer: Signer;
  const noMoneyAddress = "0x0A7D8ED2973c7495E043d5a7fe37684e51Dc707D";
  const handle = "flarp";

  beforeEach(async () => {
    [deployer, signer] = await hre.ethers.getSigners();
    const deployerAddress = await deployer.getAddress();

    const Registry = await getContractFactory("Registry");
    const registry = await Registry.deploy();
    const registryAddress = await registry.getAddress();

    const Identity = await getContractFactory("Identity");
    identityInstance = await Identity.deploy("0x0000000000000000000000000000000000000000");
    const identityAddress = await identityInstance.getAddress();

    const Beacon = await getContractFactory("Beacon");
    beaconInstance = await Beacon.deploy(identityAddress, deployerAddress);
    beaconAddress = await beaconInstance.getAddress();

    const BeaconFactory = await getContractFactory("BeaconFactory");
    factoryInstance = await BeaconFactory.deploy(beaconAddress, registryAddress);
  });

  describe("getBeacon", () => {
    it("has the default beacon set", async () => {
      const currentBeacon = await factoryInstance.getBeacon();
      expect(currentBeacon).to.equal(beaconAddress);
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
    let otherBeaconAddress: string = '';
    let testDelegateAddress: string = ''

    beforeEach(async () => {
      [deployer, signer] = await hre.ethers.getSigners();
      // Create a TestDelegate
      const TestDelegate = await getContractFactory("TestDelegate");
      testDelegate = await TestDelegate.deploy("0x0000000000000000000000000000000000000000");
      testDelegateAddress = await testDelegate.getAddress();

      const Beacon = await getContractFactory("Beacon");
      otherBeacon = await Beacon.deploy(testDelegateAddress, deployer.address);
      otherBeaconAddress = await otherBeacon.getAddress();
    });

    it("can deploy a contract with the beacon", async () => {
      await expect(
        factoryInstance.connect(signer)["createBeaconProxy(address)"](otherBeaconAddress)
      ).to.emit(factoryInstance, "ProxyCreated");
    });

    it("Event has a proper address", async () => {
      const response = await factoryInstance
        .connect(signer)
        ["createBeaconProxy(address)"](otherBeaconAddress);
      const newProxyAddress = await getProxyAddressFromResponse(response);
      expect(newProxyAddress).to.be.properAddress;
    });

    it("really is using the TestDelegate Logic", async () => {
      const response = await factoryInstance
        .connect(signer)
        ["createBeaconProxy(address)"](otherBeaconAddress);
      const newProxyAddress = await getProxyAddressFromResponse(response);
      const proxyAsDelegate = await ethers.getContractAt("IDelegation", newProxyAddress);

      await expect(proxyAsDelegate.delegate(signer.address, DelegationRole.OWNER)).to.revertedWith(
        "Not implemented"
      );
    });

    it("initializes the proxy", async () => {
      const response = await factoryInstance
        .connect(signer)
        ["createBeaconProxy(address)"](otherBeaconAddress);
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
          .createBeaconProxyWithOwner(beaconAddress, noMoneyAddress)
      ).to.emit(factoryInstance, "ProxyCreated");
    });

    it("Event has a proper address", async () => {
      const response = await factoryInstance
        .connect(signer)
        .createBeaconProxyWithOwner(beaconAddress, noMoneyAddress);
      const newProxyAddress = await getProxyAddressFromResponse(response);
      expect(newProxyAddress).to.be.properAddress;
    });

    it("can really use the TestDelegate Logic", async () => {
      // Create a TestDelegate
      const TestDelegate = await getContractFactory("TestDelegate");
      const testDelegate = await TestDelegate.deploy("0x0000000000000000000000000000000000000000");

      const Beacon = await getContractFactory("Beacon");
      const deployerAddress = await deployer.getAddress()
      const otherBeacon = await Beacon.deploy(await testDelegate.getAddress(), deployerAddress);
      const otherBeaconAddress = await otherBeacon.getAddress();

      const response = await factoryInstance
        .connect(signer)
        .createBeaconProxyWithOwner(otherBeaconAddress, noMoneyAddress);
      const newProxyAddress = await getProxyAddressFromResponse(response);
      const proxyAsDelegate = await ethers.getContractAt("IDelegation", newProxyAddress);

      await expect(proxyAsDelegate.delegate(signer.address, DelegationRole.OWNER)).to.revertedWith(
        "Not implemented"
      );
    });

    it("initializes the proxy with noMoneyAddress", async () => {
      const response = await factoryInstance
        .connect(signer)
        .createBeaconProxyWithOwner(beaconAddress, noMoneyAddress);
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

  describe("createAndRegisterBeaconProxy", () => {
    it("emits both a ProxyCreated and DSNPRegistryUpdateFromResponse event", async () => {
      const response = await factoryInstance
        .connect(signer)
        .createAndRegisterBeaconProxy(beaconAddress, noMoneyAddress, handle);
      const newProxyAddress = await getProxyAddressFromResponse(response);
      expect(newProxyAddress).to.be.properAddress;

      const registryEvent = await getDSNPRegistryUpdateFromResponse(response);
      expect(registryEvent.addr).to.equal(newProxyAddress);
      expect(registryEvent.handle).to.equal(handle);
    });

    it("revert in register reverts call", async () => {
      // make one call that registers handle
      await factoryInstance
        .connect(signer)
        .createAndRegisterBeaconProxy(beaconAddress, noMoneyAddress, handle);

      // make another call for different address that attempts to register same handle
      await expect(
        factoryInstance
          .connect(signer)
          .createAndRegisterBeaconProxy(beaconAddress, signer.address, handle)
      ).to.be.revertedWith("Handle already exists");
    });
  });
});
