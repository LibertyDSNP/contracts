import { ethers } from "hardhat";
import chai from "chai";
import { ContractFactory } from "ethers";
import { DelegationRole } from "./helpers/DSNPEnums";
const { expect } = chai;

describe("IdentityCloneFactory", () => {
  let signer, noMoney;
  let identity, factory;
  let Identity: ContractFactory;

  beforeEach(async () => {
    [signer, noMoney] = await ethers.getSigners();

    const IdentityCloneFactory = await ethers.getContractFactory("IdentityCloneFactory");
    factory = await IdentityCloneFactory.deploy();
    await factory.deployed();

    Identity = await ethers.getContractFactory("Identity");
    identity = await Identity.deploy("0x0000000000000000000000000000000000000000");
    await identity.deployed();
  });

  describe("createCloneProxy", () => {
    it("can create a clone", async () => {
      // Deploy new proxy
      const receipt = await (await factory.createCloneProxy(identity.address)).wait();
      const createEvent = factory.interface.parseLog(
        receipt.logs.filter(({ address }) => address === factory.address)[0]
      );
      // Use proxy as an identity
      const proxyAsIdentity = Identity.attach(createEvent.args.addr);

      // See if the proxy is used
      const isAuthorized = await proxyAsIdentity.isAuthorizedTo(
        signer.address,
        DelegationRole.OWNER,
        0x1
      );
      expect(isAuthorized).to.equal(true);

      // Make sure it is initialized
      expect(proxyAsIdentity.initialize("0x0000000000000000000000000000000000000000")).to.be
        .reverted;
    });

    it("emits ProxyCreated", async () => {
      await expect(factory.createCloneProxy(identity.address)).to.emit(factory, "ProxyCreated");
    });
  });

  describe("createCloneProxyWithOwner", () => {
    it("can create a clone with the correct owner", async () => {
      // Deploy new proxy
      const receipt = await (
        await factory.createCloneProxyWithOwner(identity.address, noMoney.address)
      ).wait();
      const createEvent = factory.interface.parseLog(
        receipt.logs.filter(({ address }) => address === factory.address)[0]
      );
      // Use proxy as an identity
      const proxyAsIdentity = Identity.attach(createEvent.args.addr);

      // See if the proxy is used and owned by noMoney
      expect(
        await proxyAsIdentity.isAuthorizedTo(noMoney.address, DelegationRole.OWNER, 0x1)
      ).to.equal(true);

      // See if the proxy is NOT owned by signer
      expect(
        await proxyAsIdentity.isAuthorizedTo(signer.address, DelegationRole.OWNER, 0x1)
      ).to.equal(false);

      // Make sure it is initialized
      await expect(proxyAsIdentity.initialize("0x0000000000000000000000000000000000000000")).to.be
        .reverted;
    });

    it("emits ProxyCreated", async () => {
      await expect(factory.createCloneProxyWithOwner(identity.address, noMoney.address)).to.emit(
        factory,
        "ProxyCreated"
      );
    });
  });
});
