import { ethers } from "hardhat";
import chai from "chai";
import { describe } from "mocha";
import { Contract, ContractFactory } from "ethers";
import { DelegationPermission, DelegationRole } from "./helpers/DSNPEnums";

const { expect } = chai;

describe("New Identity", () => {
  let signer, signer2,delegate, delegate2;
  let identity, identity2;
  let Identity: ContractFactory;
  let identityDomain;

  const getIdentityDomain = async (contract: Contract) => ({
    name: "Identity",
    version: "1",
    chainId: (await ethers.provider.getNetwork()).chainId,
    verifyingContract: contract.address,
    salt: "0xa0bec69846cdcc8c1ba1eb93be1c5728385a9e26062a73e238b1beda189ac4c9"
  });

  beforeEach(async () => {
    [signer, signer2, delegate, delegate2] = await ethers.getSigners();

    Identity = await ethers.getContractFactory("Identity");
    identity = await Identity.deploy(signer.address);
    await identity.deployed();

    identity2 = await Identity.deploy(signer2.address);

    identityDomain = await getIdentityDomain(identity);
  });

  describe("delegate with different signers", () => {
    it("success with DELEGATE_ADD", async () => {
      await expect(
        identity.connect(signer).delegate(delegate.address, DelegationRole.ANNOUNCER)
      ).to.not.be.reverted;
      expect(
        await identity.isAuthorizedTo(delegate.address, DelegationPermission.ANNOUNCE, 0x0)
      ).to.be.true;

      await expect(identity2.connect(signer2).delegate(delegate2.address, DelegationRole.ANNOUNCER)
      ).to.not.be.reverted;

      expect(
        await identity.isAuthorizedTo(delegate2.address, DelegationPermission.ANNOUNCE, 0x0)
      ).to.be.false;
      expect(
        await identity2.isAuthorizedTo(delegate.address, DelegationPermission.ANNOUNCE, 0x0)
      ).to.be.false;
    });
  });

});
