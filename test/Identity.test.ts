import hre, { ethers } from "hardhat";
import chai from "chai";
import { describe } from "mocha";
import { DelegationPermission, DelegationRole } from "./helpers/DSNPEnums";
import { signEIP712 } from "./helpers/EIP712";
import { Contract, ContractFactory } from "ethers";
const { expect } = chai;

describe("Identity", () => {
  let signer, authOwner, announcerOnly, notAuthorized, neverAuthorized;
  let identity;
  let Identity: ContractFactory;
  let identityDomain;

  const getIdentityDomain = async (contract: Contract) => ({
    name: "Identity",
    version: "1",
    chainId: (await ethers.provider.getNetwork()).chainId,
    verifyingContract: contract.address,
    salt: "0xa0bec69846cdcc8c1ba1eb93be1c5728385a9e26062a73e238b1beda189ac4c9",
  });

  beforeEach(async () => {
    [signer, authOwner, announcerOnly, notAuthorized, neverAuthorized] = await ethers.getSigners();

    Identity = await ethers.getContractFactory("Identity");
    identity = await Identity.deploy(signer.address);
    await identity.deployed();

    await identity.delegate(authOwner.address, 0x1);
    await identity.delegate(announcerOnly.address, 0x2);

    identityDomain = await getIdentityDomain(identity);
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
        it(`Permission ${DelegationPermission[tc.p]} should return ${tc.x}`, async () => {
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

      // MINE up to block 0x100
      const blockNumber = await ethers.provider.getBlockNumber();
      const numberToMine = 0x100 - blockNumber;
      await hre.network.provider.send("hardhat_mine", ["0x" + numberToMine.toString(16)]);
      identity.delegateRemove(announcerOnly.address);

      tests.forEach((tc) => {
        it(`Permission ${DelegationPermission[tc.p]} should return ${tc.x} block ${
          tc.b
        }`, async () => {
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

      const priorBlockNumber = await ethers.provider.getBlockNumber();
      // Remove permission
      await expect(identity.connect(announcerOnly).delegateRemove(addr)).to.not.be.reverted;

      // Test before endBlock
      expect(await identity.isAuthorizedTo(addr, DelegationPermission.ANNOUNCE, priorBlockNumber))
        .to.be.true;
      // Test after endBlock
      expect(
        await identity.isAuthorizedTo(addr, DelegationPermission.ANNOUNCE, priorBlockNumber + 2)
      ).to.be.false;
    });

    it("emits DSNPRemoveDelegate on success", async () => {
      await expect(identity.connect(announcerOnly).delegateRemove(announcerOnly.address))
        .to.emit(identity, "DSNPRemoveDelegate")
        .withArgs(announcerOnly.address);
    });

    it("success with DELEGATE_REMOVE", async () => {
      await expect(identity.connect(authOwner).delegateRemove(announcerOnly.address))
        .to.emit(identity, "DSNPRemoveDelegate")
        .withArgs(announcerOnly.address).and.to.not.be.reverted;

      expect(
        await identity.isAuthorizedTo(announcerOnly.address, DelegationPermission.ANNOUNCE, 0x0)
      ).to.be.false;
    });

    it("rejects without DELEGATE_REMOVE", async () => {
      await expect(identity.connect(announcerOnly).delegateRemove(authOwner.address)).to.be
        .reverted;
    });

    it("rejects removing a non-authorized address when approved", async () => {
      await expect(
        identity.connect(authOwner).delegateRemove(neverAuthorized.address)
      ).to.be.revertedWith("Never authorized");
    });

    it("rejects removing a non-authorized address", async () => {
      await expect(
        identity.connect(authOwner).delegateRemove(neverAuthorized.address)
      ).to.be.revertedWith("Never authorized");
    });

    it("rejects self-removing a non-authorized address", async () => {
      await expect(
        identity.connect(neverAuthorized).delegateRemove(neverAuthorized.address)
      ).to.be.revertedWith("Never authorized");
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

  describe("delegateByEIP712Sig", () => {
    const delegateAddChangeTypes = {
      DelegateAdd: [
        { name: "nonce", type: "uint32" },
        { name: "delegateAddr", type: "address" },
        { name: "role", type: "uint8" },
      ],
    };

    it("success with DELEGATE_ADD ", async () => {
      const message = {
        nonce: 0,
        delegateAddr: notAuthorized.address,
        role: DelegationRole.ANNOUNCER,
      };
      const { v, r, s } = await signEIP712(
        authOwner,
        identityDomain,
        delegateAddChangeTypes,
        message
      );

      await expect(identity.connect(neverAuthorized).delegateByEIP712Sig(v, r, s, message)).to.not
        .be.reverted;

      expect(
        await identity.isAuthorizedTo(notAuthorized.address, DelegationPermission.ANNOUNCE, 0x0)
      ).to.be.true;
    });

    it("emits a DSNPAddDelegate event", async () => {
      const message = {
        nonce: 0,
        delegateAddr: notAuthorized.address,
        role: DelegationRole.ANNOUNCER,
      };
      const { v, r, s } = await signEIP712(
        authOwner,
        identityDomain,
        delegateAddChangeTypes,
        message
      );

      await expect(identity.connect(neverAuthorized).delegateByEIP712Sig(v, r, s, message))
        .to.emit(identity, "DSNPAddDelegate")
        .withArgs(notAuthorized.address, DelegationRole.ANNOUNCER);
    });

    it("updates nonce", async () => {
      const message = {
        nonce: 0,
        delegateAddr: notAuthorized.address,
        role: DelegationRole.ANNOUNCER,
      };
      const { v, r, s } = await signEIP712(
        authOwner,
        identityDomain,
        delegateAddChangeTypes,
        message
      );

      await identity.connect(neverAuthorized).delegateByEIP712Sig(v, r, s, message);

      expect(await identity.getNonceForDelegate(notAuthorized.address)).to.equal(1);
    });

    it("rejects when nonce is too high", async () => {
      const message = {
        nonce: 1,
        delegateAddr: notAuthorized.address,
        role: DelegationRole.ANNOUNCER,
      };
      const { v, r, s } = await signEIP712(
        authOwner,
        identityDomain,
        delegateAddChangeTypes,
        message
      );

      await expect(
        identity.connect(neverAuthorized).delegateByEIP712Sig(v, r, s, message)
      ).to.be.revertedWith("Nonces do not match");
    });

    it("prevents replay", async () => {
      // First change to update nonce to 1
      const message = {
        nonce: 0,
        delegateAddr: notAuthorized.address,
        role: DelegationRole.ANNOUNCER,
      };
      const { v, r, s } = await signEIP712(
        authOwner,
        identityDomain,
        delegateAddChangeTypes,
        message
      );

      // Success
      await identity.connect(neverAuthorized).delegateByEIP712Sig(v, r, s, message);

      // Replay Fail
      await expect(
        identity.connect(neverAuthorized).delegateByEIP712Sig(v, r, s, message)
      ).to.be.revertedWith("Nonces do not match");
    });

    it("reverts when sender is not authorized", async () => {
      const message = { nonce: 0, delegateAddr: announcerOnly.address, role: DelegationRole.OWNER };

      const { v, r, s } = await signEIP712(
        notAuthorized,
        identityDomain,
        delegateAddChangeTypes,
        message
      );

      await expect(
        identity.connect(neverAuthorized).delegateByEIP712Sig(v, r, s, message)
      ).to.be.revertedWith("Signer does not have the DELEGATE_ADD permission");
    });

    it("rejects for the NONE role", async () => {
      const message = { nonce: 0, delegateAddr: announcerOnly.address, role: DelegationRole.NONE };
      const { v, r, s } = await signEIP712(
        authOwner,
        identityDomain,
        delegateAddChangeTypes,
        message
      );

      await expect(
        identity.connect(neverAuthorized).delegateByEIP712Sig(v, r, s, message)
      ).to.be.revertedWith("Role.NONE not allowed. Use delegateRemove.");
    });

    it("rejects setting to a non-existing role", async () => {
      const message = { nonce: 0, delegateAddr: announcerOnly.address, role: 0x10 };
      const { v, r, s } = await signEIP712(
        authOwner,
        identityDomain,
        delegateAddChangeTypes,
        message
      );

      await expect(identity.connect(neverAuthorized).delegateByEIP712Sig(v, r, s, message)).to.be
        .reverted;
    });
  });

  describe("delegateRemoveByEIP712Sig", () => {
    const delegateRemoveChangeTypes = {
      DelegateRemove: [
        { name: "nonce", type: "uint32" },
        { name: "delegateAddr", type: "address" },
      ],
    };

    it("success with DELEGATE_REMOVE ", async () => {
      const message = {
        nonce: 1,
        delegateAddr: announcerOnly.address,
      };
      const { v, r, s } = await signEIP712(
        authOwner,
        identityDomain,
        delegateRemoveChangeTypes,
        message
      );

      await expect(identity.connect(neverAuthorized).delegateRemoveByEIP712Sig(v, r, s, message)).to
        .not.be.reverted;

      expect(
        await identity.isAuthorizedTo(announcerOnly.address, DelegationPermission.ANNOUNCE, 0x0)
      ).to.be.false;
    });

    it("emits a DSNPRemoveDelegate event", async () => {
      const message = {
        nonce: 1,
        delegateAddr: announcerOnly.address,
      };
      const { v, r, s } = await signEIP712(
        authOwner,
        identityDomain,
        delegateRemoveChangeTypes,
        message
      );

      await expect(identity.connect(neverAuthorized).delegateRemoveByEIP712Sig(v, r, s, message))
        .to.emit(identity, "DSNPRemoveDelegate")
        .withArgs(announcerOnly.address);
    });

    it("success for self removal ", async () => {
      const message = {
        nonce: 1,
        delegateAddr: announcerOnly.address,
      };
      const { v, r, s } = await signEIP712(
        announcerOnly,
        identityDomain,
        delegateRemoveChangeTypes,
        message
      );

      await expect(identity.connect(neverAuthorized).delegateRemoveByEIP712Sig(v, r, s, message)).to
        .not.be.reverted;

      expect(
        await identity.isAuthorizedTo(announcerOnly.address, DelegationPermission.ANNOUNCE, 0x0)
      ).to.be.false;
    });

    it("reverts replay", async () => {
      const message = {
        nonce: 1,
        delegateAddr: announcerOnly.address,
      };
      const { v, r, s } = await signEIP712(
        authOwner,
        identityDomain,
        delegateRemoveChangeTypes,
        message
      );

      await identity.connect(neverAuthorized).delegateRemoveByEIP712Sig(v, r, s, message);

      expect(await identity.getNonceForDelegate(announcerOnly.address)).to.equal(2);

      await expect(
        identity.connect(neverAuthorized).delegateRemoveByEIP712Sig(v, r, s, message)
      ).to.be.revertedWith("Nonces do not match");
    });

    it("rejects when nonce is too high", async () => {
      const message = {
        nonce: 2,
        delegateAddr: announcerOnly.address,
      };
      const { v, r, s } = await signEIP712(
        authOwner,
        identityDomain,
        delegateRemoveChangeTypes,
        message
      );

      await expect(
        identity.connect(neverAuthorized).delegateRemoveByEIP712Sig(v, r, s, message)
      ).to.be.revertedWith("Nonces do not match");
    });

    it("rejects when nonce is too low", async () => {
      const message = {
        nonce: 0,
        delegateAddr: announcerOnly.address,
      };
      const { v, r, s } = await signEIP712(
        authOwner,
        identityDomain,
        delegateRemoveChangeTypes,
        message
      );

      await expect(
        identity.connect(neverAuthorized).delegateRemoveByEIP712Sig(v, r, s, message)
      ).to.be.revertedWith("Nonces do not match");
    });

    it("reverts when sender is not authorized", async () => {
      const message = {
        nonce: 1,
        delegateAddr: announcerOnly.address,
      };
      const { v, r, s } = await signEIP712(
        notAuthorized,
        identityDomain,
        delegateRemoveChangeTypes,
        message
      );

      await expect(
        identity.connect(neverAuthorized).delegateRemoveByEIP712Sig(v, r, s, message)
      ).to.be.revertedWith("Signer does not have the DELEGATE_REMOVE permission");
    });

    it("rejects removing a non-authorized address when authorized", async () => {
      const message = {
        nonce: 0,
        delegateAddr: notAuthorized.address,
      };
      const { v, r, s } = await signEIP712(
        authOwner,
        identityDomain,
        delegateRemoveChangeTypes,
        message
      );

      await expect(
        identity.connect(neverAuthorized).delegateRemoveByEIP712Sig(v, r, s, message)
      ).to.be.revertedWith("Never authorized");
    });

    it("rejects when signed by a non-authorized address", async () => {
      const message = { nonce: 1, delegateAddr: announcerOnly.address };
      const { v, r, s } = await signEIP712(
        notAuthorized,
        identityDomain,
        delegateRemoveChangeTypes,
        message
      );

      await expect(
        identity.connect(neverAuthorized).delegateRemoveByEIP712Sig(v, r, s, message)
      ).to.be.revertedWith("Signer does not have the DELEGATE_REMOVE permission");
    });

    it("rejects self-removing a non-authorized address", async () => {
      const message = { nonce: 0, delegateAddr: notAuthorized.address };
      const { v, r, s } = await signEIP712(
        notAuthorized,
        identityDomain,
        delegateRemoveChangeTypes,
        message
      );

      await expect(
        identity.connect(neverAuthorized).delegateRemoveByEIP712Sig(v, r, s, message)
      ).to.be.revertedWith("Never authorized");
    });
  });
});
