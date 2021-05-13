import { ethers } from "hardhat";
import chai from "chai";
import { describe } from "mocha";
import { ContractFactory } from "@ethersproject/contracts";
import { DelegationPermission, DelegationRole } from "./DSNPEnums";
const { expect } = chai;

describe("Identity", () => {
  let signer, authOwner, announcerOnly, notAuthorized;
  let identity;
  let Identity: ContractFactory;

  beforeEach(async () => {
    [signer, authOwner, announcerOnly, notAuthorized] = await ethers.getSigners();

    Identity = await ethers.getContractFactory("Identity");
    identity = await Identity.deploy(signer.address);
    await identity.deployed();

    await identity.delegate(authOwner.address, 0x1);
    await identity.delegate(announcerOnly.address, 0x2);
  });

  describe("isAuthorizedTo", () => {
    describe("owner", async () => {
      // permission, result
      const tests = [
        { p: DelegationPermission.NONE, x: false },
        { p: DelegationPermission.ANNOUNCE, x: true },
        { p: DelegationPermission.OWNERSHIP_TRANSFER, x: true },
        { p: DelegationPermission.DELEGATE_ADD, x: true },
        { p: DelegationPermission.DELEGATE_REMOVE, x: true },
      ];
      tests.forEach((tc) => {
        it(`Permission ${DelegationPermission[tc.p]} should ${
          tc.x ? "" : "not"
        } be allowed`, async () => {
          const result = await identity.isAuthorizedTo(authOwner.address, tc.p, 0x1);
          expect(result).to.equal(tc.x);
        });
      });
    });

    it("announcer only", async () => {
      // permission, result
      const tests = [
        { p: DelegationPermission.NONE, x: false },
        { p: DelegationPermission.ANNOUNCE, x: true },
        { p: DelegationPermission.OWNERSHIP_TRANSFER, x: false },
        { p: DelegationPermission.DELEGATE_ADD, x: false },
        { p: DelegationPermission.DELEGATE_REMOVE, x: false },
      ];
      tests.forEach((tc) => {
        it(`Permission ${DelegationPermission[tc.p]} should ${
          tc.x ? "" : "not"
        } be allowed`, async () => {
          const result = await identity.isAuthorizedTo(announcerOnly.address, tc.p, 0x1);
          expect(result).to.equal(tc.x);
        });
      });
    });

    describe("notAuthorized", async () => {
      // permission, result
      const tests = [
        { p: DelegationPermission.NONE, x: false },
        { p: DelegationPermission.ANNOUNCE, x: false },
        { p: DelegationPermission.OWNERSHIP_TRANSFER, x: false },
        { p: DelegationPermission.DELEGATE_ADD, x: false },
        { p: DelegationPermission.DELEGATE_REMOVE, x: false },
      ];
      tests.forEach((tc) => {
        it(`Permission ${DelegationPermission[tc.p]}ationPermission[tc.p]} should ${
          tc.x ? "" : "not"
        } be allowed`, async () => {
          const result = await identity.isAuthorizedTo(notAuthorized.address, tc.p, 0x1);
          expect(result).to.equal(tc.x);
        });
      });
    });

    describe("previously authorized", async () => {
      // permission, result
      const tests = [
        { p: DelegationPermission.NONE, x: false, b: 99 },
        { p: DelegationPermission.ANNOUNCE, x: false, b: 101 },
      ];
      tests.forEach((tc) => {
        it(`Permission ${DelegationPermission[tc.p]} should ${
          tc.x ? "" : "not"
        } be allowed`, async () => {
          identity.delegateRemove(announcerOnly.address, 0x100);
          const result = await identity.isAuthorizedTo(announcerOnly.address, tc.p, tc.b);
          expect(result).to.equal(tc.x);
        });
      });
    });
  });

  describe("Checks permissions", () => {
    describe("bitwise", async () => {
      // role, permission, result
      const tests = [
        { r: DelegationRole.NONE, p: DelegationPermission.NONE, x: false },
        { r: DelegationRole.OWNER, p: DelegationPermission.NONE, x: false },
        { r: DelegationRole.OWNER, p: DelegationPermission.ANNOUNCE, x: true },
        { r: DelegationRole.OWNER, p: DelegationPermission.OWNERSHIP_TRANSFER, x: true },
        { r: DelegationRole.OWNER, p: DelegationPermission.DELEGATE_ADD, x: true },
        { r: DelegationRole.OWNER, p: DelegationPermission.DELEGATE_REMOVE, x: true },
        { r: DelegationRole.ANNOUNCER, p: DelegationPermission.NONE, x: false },
        { r: DelegationRole.ANNOUNCER, p: DelegationPermission.ANNOUNCE, x: true },
        { r: DelegationRole.ANNOUNCER, p: DelegationPermission.OWNERSHIP_TRANSFER, x: false },
        { r: DelegationRole.ANNOUNCER, p: DelegationPermission.DELEGATE_ADD, x: false },
        { r: DelegationRole.ANNOUNCER, p: DelegationPermission.DELEGATE_REMOVE, x: false },
      ];
      tests.forEach((tc) => {
        it(`Role ${DelegationPermission[tc.r]} -> Permission ${DelegationPermission[tc.p]} should ${
          tc.x ? "" : "not"
        } be allowed`, async () => {
          const result = await identity.doesRoleHavePermission(tc.r, tc.p);
          expect(result).to.equal(tc.x);
        });
      });
    });
  });

  describe("delegate", () => {
    it("success with DELEGATE_ADD", async () => {
      await expect(identity.connect(signer).delegate(notAuthorized.address, DelegationRole.ANNOUNCER)).to
        .not.be.reverted;
      expect(
        await identity.isAuthorizedTo(
          notAuthorized.address,
          DelegationPermission.ANNOUNCE,
          0x0
        )
      ).to.be.true;
    });
    it("rejects without DELEGATE_ADD", () => {
      expect(
        identity.connect(announcerOnly).delegate(notAuthorized.address, DelegationRole.ANNOUNCER)
      ).to.be.reverted;
    });
    it("set different role", async () => {
      await expect(identity.connect(authOwner).delegate(announcerOnly.address, DelegationRole.OWNER)).to
        .not.be.reverted;
      expect(
        await identity.isAuthorizedTo(
          announcerOnly.address,
          DelegationPermission.OWNERSHIP_TRANSFER,
          0x0
        )
      ).to.be.true;
    });
    it("rejects for the NONE role", async () => {
      await expect(
        identity.connect(authOwner).delegate(notAuthorized.address, DelegationRole.NONE)
      ).to.be.revertedWith("Role.NONE not allowed. Use delegateRemove.");
    });
    it("rejects setting to a non-existing role", async () => {
      await expect(
        identity.connect(authOwner).delegate(notAuthorized.address, 0x3)
      ).to.be.reverted;
    });
  });

  describe("initialization", () => {
    it("cannot initialize when constructed", async () => {
      await expect(identity.initialize(notAuthorized.address)).to.be.revertedWith(
        "Already initialized"
      );
    });

    it("can initialize when accessed as logic via a proxy", async () => {
      const MockCloneFactory = await ethers.getContractFactory("MockCloneFactory");
      const factory = await MockCloneFactory.deploy();
      await factory.deployed();

      // Deploy new proxy
      const receipt = await (await factory.createCloneProxy(identity.address)).wait();
      const createEvent = factory.interface.parseLog(
        receipt.logs.filter(({ address }) => address === factory.address)[0]
      );
      // Use proxy as an identity
      const proxyAsIdentity = Identity.attach(createEvent.args.addr);

      await expect(proxyAsIdentity.initialize(notAuthorized.address)).to.not.be.reverted;
    });

    it("cannot be initialized more than once", async () => {
      const MockCloneFactory = await ethers.getContractFactory("MockCloneFactory");
      const factory = await MockCloneFactory.deploy();
      await factory.deployed();

      // Deploy new proxy
      const receipt = await (await factory.createCloneProxy(identity.address)).wait();
      const createEvent = factory.interface.parseLog(
        receipt.logs.filter(({ address }) => address === factory.address)[0]
      );
      // Use proxy as an identity
      const proxyAsIdentity = Identity.attach(createEvent.args.addr);

      await proxyAsIdentity.initialize(notAuthorized.address);

      await expect(identity.initialize(notAuthorized.address)).to.be.revertedWith(
        "Already initialized"
      );
    });
  });
});
