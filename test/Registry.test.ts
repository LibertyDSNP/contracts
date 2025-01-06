import { ethers } from "hardhat";
import chai from "chai";
import { generateHexString } from "@dsnp/test-generators";
import { signEIP712 } from "./helpers/EIP712";

import { ContractTransactionResponse, Signer } from "ethers";
import { Registry } from "../typechain-types";

const { expect } = chai;

describe("Registry", () => {
  const handle = "flarp";
  const newHandle = "flarpenator";

  let signer1: Signer;
  let signer2: Signer;
  let signer3: Signer;
  let [delegate1Address, delegate2Address, delegate3Address, newDelegate1Address, nonDelegateAddress,
    registryAddress] = "";

  let registry: Registry & { deploymentTransaction(): ContractTransactionResponse; };
  let registryDomain: Record<string, any>;

  const firstId = 1000;

  const addressChangeTypes = {
    AddressChange: [
      { name: "nonce", type: "uint32" },
      { name: "addr", type: "address" },
      { name: "handle", type: "string" },
    ],
  };

  const handleChangeTypes = {
    HandleChange: [
      { name: "nonce", type: "uint32" },
      { name: "oldHandle", type: "string" },
      { name: "newHandle", type: "string" },
    ],
  };

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    signer1 = signers[0];
    signer2 = signers[1];
    signer3 = signers[2];

    const signer1Address = await signer1.getAddress();
    const signer2Address = await signer2.getAddress();
    const signer3Address = await signer3.getAddress();

    const Registry = await ethers.getContractFactory("Registry");
    registry = await Registry.deploy();
    registryAddress = await registry.getAddress();

    const TestDelegate = await ethers.getContractFactory("TestDelegate");
    const delegate1 = await TestDelegate.deploy(signer1Address);
    delegate1Address = await delegate1.getAddress();

    const newDelegate1 = await TestDelegate.deploy(signer1Address);
    newDelegate1Address = await newDelegate1.getAddress();

    const delegate2 = await TestDelegate.deploy(signer2Address);
    delegate2Address = await delegate2.getAddress();

    const delegate3 = await TestDelegate.deploy(signer3Address);
    delegate3Address = await delegate3.getAddress();

    const TestERC165 = await ethers.getContractFactory("TestERC165");
    const nonDelegate = await TestERC165.deploy();
    nonDelegateAddress = await nonDelegate.getAddress();

    registryDomain = {
      name: "Registry",
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: registryAddress,
      salt: "0x01597239a39b73c524db27009bfe992afd78e195ca64846a6fa0ce65ce37b2df",
    };
  });

  describe("register", () => {
    it("emits a DSNPRegistryUpdate event", async () => {
      await expect(registry.connect(signer1).register(delegate1Address, handle))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(firstId, delegate1Address, handle);
    });

    it("reverts when addr is not a delegation contract", async () => {
      await expect(
        registry.connect(signer2).register(nonDelegateAddress, handle)
      ).to.be.revertedWith("contract does not support IDelegation interface");
    });

    it("reverts when contract does not exist", async () => {
      const bogusContract = ethers.getAddress(generateHexString(40));
      await expect(registry.connect(signer2).register(bogusContract, handle)).to.be.revertedWith(
        "function call to a non-contract account"
      );
    });

    it("reverts when handle already exists", async () => {
      await registry.connect(signer1).register(delegate1Address, handle);
      await expect(registry.register(delegate1Address, handle)).to.be.revertedWith(
        "Handle already exists"
      );
    });

    it("increments id for each registration", async () => {
      await expect(registry.connect(signer1).register(delegate1Address, "foo"))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(firstId, delegate1Address, "foo");
      await expect(registry.connect(signer2).register(delegate2Address, "bar"))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(firstId + 1, delegate2Address, "bar");
      await expect(registry.connect(signer3).register(delegate3Address, "baz"))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(firstId + 2, delegate3Address, "baz");
    });

    it("stores correct id and address", async () => {
      await registry.connect(signer1).register(delegate1Address, handle);
      const result = await registry.resolveRegistration(handle);
      expect(result[0]).to.equal(1000);
      expect(result[1]).to.equal(delegate1Address);
    });
  });

  describe("change address", async () => {
    // create registration to change
    beforeEach(async () => {
      await registry.connect(signer1).register(delegate1Address, handle);
    });

    it("updates stored address", async () => {
      await registry.connect(signer1).changeAddress(newDelegate1Address, handle);

      const result = await registry.resolveRegistration(handle);
      expect(result[1]).to.equal(newDelegate1Address);
    });

    it("emits a DSNPRegistryUpdate event", async () => {
      await expect(registry.connect(signer1).changeAddress(newDelegate1Address, handle))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(firstId, newDelegate1Address, handle);
    });

    it("reverts when handle does not exist", async () => {
      await expect(
        registry.connect(signer1).changeAddress(newDelegate1Address, newHandle)
      ).to.be.revertedWith("Handle does not exist");
    });

    it("reverts when sender is not authorized in old contract", async () => {
      await expect(
        registry.connect(signer2).changeAddress(delegate2Address, handle)
      ).to.be.revertedWith("Access denied");
    });

    it("reverts when new contract is not a delegation contract", async () => {
      await expect(
        registry.connect(signer1).changeAddress(nonDelegateAddress, handle)
      ).to.be.revertedWith("contract does not support IDelegation interface");
    });

    it("reverts when new contract does not exist", async () => {
      const bogusContract = ethers.getAddress(generateHexString(40));
      await expect(
        registry.connect(signer1).changeAddress(bogusContract, handle)
      ).to.be.revertedWith("function call to a non-contract account");
    });
  });

  describe("changeAddressByEIP712Sig", () => {
    // create registration to change
    beforeEach(async () => {
      await registry.connect(signer1).register(delegate1Address, handle);
    });

    it("updates stored address", async () => {
      const message = { nonce: 0, addr: newDelegate1Address, handle: handle };
      const { v, r, s } = await signEIP712(signer1, registryDomain, addressChangeTypes, message);
      await registry.connect(signer2).changeAddressByEIP712Sig(v, r, s, message);
      const result = await registry.resolveRegistration(handle);
      expect(result[1]).to.equal(newDelegate1Address);
    });

    it("updates nonce", async () => {
      const message = { nonce: 0, addr: newDelegate1Address, handle: handle };
      const { v, r, s } = await signEIP712(signer1, registryDomain, addressChangeTypes, message);
      await registry.connect(signer2).changeAddressByEIP712Sig(v, r, s, message);

      expect(await registry.resolveHandleToNonce(handle)).to.equal(1);
    });

    it("emits a DSNPRegistryUpdate event", async () => {
      const message = { nonce: 0, addr: newDelegate1Address, handle: handle };
      const { v, r, s } = await signEIP712(signer1, registryDomain, addressChangeTypes, message);

      await expect(registry.connect(signer2).changeAddressByEIP712Sig(v, r, s, message))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(firstId, newDelegate1Address, handle);
    });

    it("reverts when nonce is too high", async () => {
      const message = { nonce: 1, addr: newDelegate1Address, handle: handle };
      const { v, r, s } = await signEIP712(signer1, registryDomain, addressChangeTypes, message);

      await expect(
        registry.connect(signer2).changeAddressByEIP712Sig(v, r, s, message)
      ).to.be.revertedWith("Nonces do not match");
    });

    it("reverts when nonce is too low", async () => {
      const message = { nonce: 0, addr: newDelegate1Address, handle: handle };
      const { v, r, s } = await signEIP712(signer1, registryDomain, addressChangeTypes, message);
      await registry.connect(signer2).changeAddressByEIP712Sig(v, r, s, message);

      const message2 = { nonce: 0, addr: delegate1Address, handle: handle };
      const sig2 = await signEIP712(signer1, registryDomain, addressChangeTypes, message2);

      await expect(
        registry.connect(signer2).changeAddressByEIP712Sig(sig2.v, sig2.r, sig2.s, message2)
      ).to.be.revertedWith("Nonces do not match");
    });

    it("reverts when handle does not exist", async () => {
      const message = { nonce: 0, addr: newDelegate1Address, handle: newHandle };
      const { v, r, s } = await signEIP712(signer1, registryDomain, addressChangeTypes, message);

      await expect(
        registry.connect(signer2).changeAddressByEIP712Sig(v, r, s, message)
      ).to.be.revertedWith("Handle does not exist");
    });

    it("reverts when sender is not authorized in old contract", async () => {
      const message = { nonce: 0, addr: newDelegate1Address, handle: handle };
      const { v, r, s } = await signEIP712(signer2, registryDomain, addressChangeTypes, message);

      await expect(
        registry.connect(signer2).changeAddressByEIP712Sig(v, r, s, message)
      ).to.be.revertedWith("Access denied");
    });

    it("reverts when new contract is not a delegation contract", async () => {
      const message = { nonce: 0, addr: nonDelegateAddress, handle: handle };
      const { v, r, s } = await signEIP712(signer1, registryDomain, addressChangeTypes, message);

      await expect(
        registry.connect(signer2).changeAddressByEIP712Sig(v, r, s, message)
      ).to.be.revertedWith("contract does not support IDelegation interface");
    });

    it("reverts when new contract does not exist", async () => {
      const bogusContract = ethers.getAddress(generateHexString(40));
      const message = { nonce: 0, addr: bogusContract, handle: handle };
      const { v, r, s } = await signEIP712(signer1, registryDomain, addressChangeTypes, message);

      await expect(
        registry.connect(signer2).changeAddressByEIP712Sig(v, r, s, message)
      ).to.be.revertedWith("function call to a non-contract account");
    });
  });

  describe("changeHandle", async () => {
    // create registration to change
    beforeEach(async () => {
      await registry.connect(signer1).register(delegate1Address, handle);
    });

    it("stores address and id under new handle", async () => {
      await registry.connect(signer1).changeHandle(handle, newHandle);

      const [id, addr] = await registry.resolveRegistration(newHandle);
      expect(addr).to.equal(delegate1Address);
      expect(id).to.equal(firstId);
    });

    it("emits a DSNPRegistryUpdate event", async () => {
      await expect(registry.connect(signer1).changeHandle(handle, newHandle))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(firstId, delegate1Address, newHandle);
    });

    it("clears old handle and frees it for registration", async () => {
      await registry.connect(signer1).changeHandle(handle, newHandle);
      const [id, addr] = await registry.resolveRegistration(handle);
      expect(addr).to.equal("0x0000000000000000000000000000000000000000");
      expect(id).to.equal("0x00");

      await expect(registry.connect(signer2).register(delegate2Address, handle))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(firstId + 1, delegate2Address, handle);
    });

    it("reverts when sender is not authorized", async () => {
      await expect(registry.connect(signer2).changeHandle(handle, newHandle)).to.be.revertedWith(
        "Access denied"
      );
    });

    it("reverts when handle does not exist", async () => {
      await expect(
        registry.connect(signer1).changeHandle("notahandle", newHandle)
      ).to.be.revertedWith("Old handle does not exist");
    });

    it("reverts when new handle already exists", async () => {
      await registry.connect(signer2).register(delegate2Address, newHandle);

      await expect(registry.connect(signer1).changeHandle(handle, newHandle)).to.be.revertedWith(
        "New handle already exists"
      );
    });

    it("reverts when new handle and old handle are same", async () => {
      await expect(registry.connect(signer1).changeHandle(handle, handle)).to.be.revertedWith(
        "New handle already exists"
      );
    });
  });

  describe("changeHandleByEIP712Sig", () => {
    beforeEach(async () => {
      await registry.connect(signer1).register(delegate1Address, handle);
    });

    it("stores address and id under new handle", async () => {
      const message = { nonce: 0, oldHandle: handle, newHandle: newHandle };
      const { v, r, s } = await signEIP712(signer1, registryDomain, handleChangeTypes, message);
      await registry.connect(signer2).changeHandleByEIP712Sig(v, r, s, message);
      const [id, addr] = await registry.resolveRegistration(newHandle);
      expect(addr).to.equal(delegate1Address);
      expect(id).to.equal(firstId);
    });

    it("emits a DSNPRegistryUpdate event", async () => {
      const message = { nonce: 0, oldHandle: handle, newHandle: newHandle };
      const { v, r, s } = await signEIP712(signer1, registryDomain, handleChangeTypes, message);

      await expect(registry.connect(signer2).changeHandleByEIP712Sig(v, r, s, message))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(firstId, delegate1Address, newHandle);
    });

    it("clears old handle and frees it for registration", async () => {
      const message = { nonce: 0, oldHandle: handle, newHandle: newHandle };
      const { v, r, s } = await signEIP712(signer1, registryDomain, handleChangeTypes, message);
      await registry.connect(signer2).changeHandleByEIP712Sig(v, r, s, message);

      const [id, addr] = await registry.resolveRegistration(handle);
      expect(addr).to.equal("0x0000000000000000000000000000000000000000");
      expect(id).to.equal("0x00");

      await expect(registry.connect(signer2).register(delegate2Address, handle))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(firstId + 1, delegate2Address, handle);
    });

    it("updates nonce for old handle", async () => {
      const message = { nonce: 0, oldHandle: handle, newHandle: newHandle };
      const { v, r, s } = await signEIP712(signer1, registryDomain, handleChangeTypes, message);
      await registry.connect(signer2).changeHandleByEIP712Sig(v, r, s, message);

      // we must register handle again to retrieve its nonce
      await registry.connect(signer2).register(delegate2Address, handle);

      expect(await registry.resolveHandleToNonce(handle)).to.equal(1);
    });

    it("rejects when nonce is too high", async () => {
      const message = { nonce: 1, oldHandle: handle, newHandle: newHandle };
      const { v, r, s } = await signEIP712(signer1, registryDomain, handleChangeTypes, message);

      await expect(
        registry.connect(signer2).changeHandleByEIP712Sig(v, r, s, message)
      ).to.be.revertedWith("Nonces do not match");
    });

    it("rejects when nonce is too low", async () => {
      // change handle with EIP 712 message to update nonce for old handle
      const message = { nonce: 0, oldHandle: handle, newHandle: newHandle };
      const { v, r, s } = await signEIP712(signer1, registryDomain, handleChangeTypes, message);
      await registry.connect(signer2).changeHandleByEIP712Sig(v, r, s, message);

      // we must register handle again before we update it
      await registry.connect(signer2).register(delegate2Address, handle);

      // create an EIP 712 handle change that should fail with nonce=0
      const message2 = { nonce: 0, oldHandle: handle, newHandle: "yetanotherhandle" };
      const sig2 = await signEIP712(signer2, registryDomain, handleChangeTypes, message2);

      await expect(
        registry.connect(signer3).changeHandleByEIP712Sig(sig2.v, sig2.r, sig2.s, message2)
      ).to.be.revertedWith("Nonces do not match");
    });

    it("reverts when sender is not authorized", async () => {
      const message = { nonce: 0, oldHandle: handle, newHandle: newHandle };
      const { v, r, s } = await signEIP712(signer2, registryDomain, handleChangeTypes, message);

      await expect(
        registry.connect(signer2).changeHandleByEIP712Sig(v, r, s, message)
      ).to.be.revertedWith("Access denied");
    });

    it("reverts when handle does not exist", async () => {
      const message = { nonce: 0, oldHandle: "notahandle", newHandle: newHandle };
      const { v, r, s } = await signEIP712(signer2, registryDomain, handleChangeTypes, message);

      await expect(
        registry.connect(signer2).changeHandleByEIP712Sig(v, r, s, message)
      ).to.be.revertedWith("Old handle does not exist");
    });

    it("reverts when new handle already exists", async () => {
      await registry.connect(signer2).register(delegate2Address, newHandle);

      const message = { nonce: 0, oldHandle: handle, newHandle: newHandle };
      const { v, r, s } = await signEIP712(signer2, registryDomain, handleChangeTypes, message);

      await expect(
        registry.connect(signer2).changeHandleByEIP712Sig(v, r, s, message)
      ).to.be.revertedWith("New handle already exists");
    });

    it("reverts when new handle and old handle are same", async () => {
      const message = { nonce: 0, oldHandle: handle, newHandle: handle };
      const { v, r, s } = await signEIP712(signer2, registryDomain, handleChangeTypes, message);

      await expect(
        registry.connect(signer2).changeHandleByEIP712Sig(v, r, s, message)
      ).to.be.revertedWith("New handle already exists");
    });
  });
});
