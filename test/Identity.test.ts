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

    describe("previously authorized endBlock 0x100", async () => {
      // permission, result
      const tests = [
        { p: DelegationPermission.ANNOUNCE, x: false, b: 0x0 },
        { p: DelegationPermission.ANNOUNCE, x: true, b: 0x99 },
        { p: DelegationPermission.ANNOUNCE, x: false, b: 0x100 },
        { p: DelegationPermission.ANNOUNCE, x: false, b: 0x101 },
      ];
      tests.forEach((tc) => {
        it(`Permission ${DelegationPermission[tc.p]} should ${
          tc.x ? "" : "not"
        } be allowed for block ${tc.b}`, async () => {
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
      await expect(
        identity.connect(signer).delegate(notAuthorized.address, DelegationRole.ANNOUNCER)
      ).to.not.be.reverted;
      expect(
        await identity.isAuthorizedTo(notAuthorized.address, DelegationPermission.ANNOUNCE, 0x0)
      ).to.be.true;
    });

    it("emits DSNPAddDelegate on success", async () => {
      await expect(
        identity.connect(signer).delegate(notAuthorized.address, DelegationRole.ANNOUNCER)
      )
        .to.emit(identity, "DSNPAddDelegate")
        .withArgs(notAuthorized.address, DelegationRole.ANNOUNCER);
    });

    it("rejects without DELEGATE_ADD", () => {
      expect(
        identity.connect(announcerOnly).delegate(notAuthorized.address, DelegationRole.ANNOUNCER)
      ).to.be.reverted;
    });

    it("set different role", async () => {
      await expect(
        identity.connect(authOwner).delegate(announcerOnly.address, DelegationRole.OWNER)
      ).to.not.be.reverted;
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
      await expect(identity.connect(authOwner).delegate(notAuthorized.address, 0x3)).to.be.reverted;
    });
  });

  describe("delegateRemove", () => {
    it("allows an address to remove themselves without DELEGATE_REMOVE", async () => {
      const addr = announcerOnly.address;
      // Has permission now
      expect(await identity.isAuthorizedTo(addr, DelegationPermission.ANNOUNCE, 0x0)).to.be.true;

      // Does not have the remove permission
      expect(await identity.isAuthorizedTo(addr, DelegationPermission.DELEGATE_REMOVE, 0x0)).to.be
        .false;

      // Remove permission
      await expect(identity.connect(announcerOnly).delegateRemove(addr, 0x5)).to.not.be.reverted;

      // Test before endBlock
      expect(await identity.isAuthorizedTo(addr, DelegationPermission.ANNOUNCE, 0x6)).to.be.false;
      // Test after endBlock
      expect(await identity.isAuthorizedTo(addr, DelegationPermission.ANNOUNCE, 0x4)).to.be.true;
    });

    it("emits DSNPRemoveDelegate on success", async () => {
      await expect(identity.connect(announcerOnly).delegateRemove(announcerOnly.address, 0x5))
        .to.emit(identity, "DSNPRemoveDelegate")
        .withArgs(announcerOnly.address, 0x5);
    });

    it("success with DELEGATE_REMOVE", async () => {
      await expect(identity.connect(authOwner).delegateRemove(announcerOnly.address, 0x1))
        .to.emit(identity, "DSNPRemoveDelegate")
        .withArgs(announcerOnly.address, 0x1).and.to.not.be.reverted;

      expect(
        await identity.isAuthorizedTo(announcerOnly.address, DelegationPermission.ANNOUNCE, 0x0)
      ).to.be.false;
    });

    it("rejects without DELEGATE_REMOVE", () => {
      expect(identity.connect(announcerOnly).delegateRemove(authOwner.address, 0x1)).to.be.reverted;
    });

    it("rejects block 0x0", () => {
      expect(
        identity.connect(authOwner).delegateRemove(announcerOnly.address, 0x0)
      ).to.be.revertedWith("endBlock 0x0 reserved for endless permissions");
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
