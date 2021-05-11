import { ethers } from "hardhat";
import chai from "chai";
const { expect } = chai;

describe("Identity", () => {
  let signer;
  let identity;
  beforeEach(async () => {
    const signers = await ethers.getSigners();
    signer = signers[0];
    const Identity = await ethers.getContractFactory("Identity");
    identity = await Identity.deploy();
    await identity.deployed();
  });
  describe("is authorized", () => {
    it("returns true if permission is Announce", async () => {
      const isAuthorized = await identity.isAuthorizedTo(signer.address, 0x1, 0);
      expect(isAuthorized).to.equal(true);
    });
  });

  describe("bitwise", () => {
    describe("Checks permissions", async () => {
      // role, permission, result
      const tests = [
        { r: 0x0, p: 0x0, x: false, d: "NONE" },
        { r: 0x1, p: 0x0, x: false, d: "OWNER -> NONE" },
        { r: 0x1, p: 0x1, x: true, d: "OWNER -> ANNOUNCE" },
        { r: 0x1, p: 0x2, x: true, d: "OWNER -> OWNERSHIP_TRANSFER" },
        { r: 0x1, p: 0x3, x: true, d: "OWNER -> DELEGATE_ADD" },
        { r: 0x1, p: 0x4, x: true, d: "OWNER -> DELEGATE_REMOVE" },
        { r: 0x2, p: 0x0, x: false, d: "ANNOUNCER -> NONE" },
        { r: 0x2, p: 0x1, x: true, d: "ANNOUNCER -> ANNOUNCE" },
        { r: 0x2, p: 0x2, x: false, d: "ANNOUNCER -> OWNERSHIP_TRANSFER" },
        { r: 0x2, p: 0x3, x: false, d: "ANNOUNCER -> DELEGATE_ADD" },
        { r: 0x2, p: 0x4, x: false, d: "ANNOUNCER -> DELEGATE_REMOVE" },
      ];
      await Promise.all(
        tests.map((tc) => {
          it(tc.d, async () => {
            const result = await identity.doesRoleHavePermission(tc.r, tc.p);
            expect(result).to.equal(tc.x);
          });
        })
      );
    });

    it("returns true if permission is Announce and the role is ANNOUNCER", async () => {
      // role, permission
      const result = await identity.doesRoleHavePermission(0x1, 0x1);
      expect(result).to.equal(true);
    });
  });
});
