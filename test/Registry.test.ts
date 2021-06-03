import { ethers } from "hardhat";
import chai from "chai";
const { expect } = chai;
import { generateHexString } from "@dsnp/test-generators";
import { signEIP712 } from "./helpers/EIP712";

describe("Registry", () => {
  const handle = "flarp";
  const newHandle = "flarpenator";
  let signer1, signer2, signer3;
  let delegate1, delegate2, delegate3, newDelegate1, nonDelegate;

  let registry, registryDomain;

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

    const Registry = await ethers.getContractFactory("Registry");
    registry = await Registry.deploy();
    await registry.deployed();

    const TestDelegate = await ethers.getContractFactory("TestDelegate");
    delegate1 = await TestDelegate.deploy(signer1.address);
    await delegate1.deployed();

    newDelegate1 = await TestDelegate.deploy(signer1.address);
    await newDelegate1.deployed();

    delegate2 = await TestDelegate.deploy(signer2.address);
    await delegate2.deployed();

    delegate3 = await TestDelegate.deploy(signer3.address);
    await delegate3.deployed();

    const TestERC165 = await ethers.getContractFactory("TestERC165");
    nonDelegate = await TestERC165.deploy();
    await nonDelegate.deployed();

    registryDomain = {
      name: "Registry",
      version: "1",
      chainId: (await ethers.provider.getNetwork()).chainId,
      verifyingContract: registry.address,
      salt: "0x01597239a39b73c524db27009bfe992afd78e195ca64846a6fa0ce65ce37b2df",
    };
  });

  describe("register", () => {
    it("emits a DSNPRegistryUpdate event", async () => {
      await expect(registry.connect(signer1).register(delegate1.address, handle))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(firstId, delegate1.address, handle);
    });

    it("reverts when addr is not a delegation contract", async () => {
      await expect(
        registry.connect(signer2).register(nonDelegate.address, handle)
      ).to.be.revertedWith("contract does not support IDelegation interface");
    });

    it("reverts when contract does not exist", async () => {
      const bogusContract = ethers.utils.getAddress(generateHexString(40));
      await expect(registry.connect(signer2).register(bogusContract, handle)).to.be.revertedWith(
        "function call to a non-contract account"
      );
    });

    it("reverts when handle already exists", async () => {
      await registry.connect(signer1).register(delegate1.address, handle);
      await expect(registry.register(delegate1.address, handle)).to.be.revertedWith(
        "Handle already exists"
      );
    });

    it("increments id for each registration", async () => {
      await expect(registry.connect(signer1).register(delegate1.address, "foo"))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(firstId, delegate1.address, "foo");
      await expect(registry.connect(signer2).register(delegate2.address, "bar"))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(firstId + 1, delegate2.address, "bar");
      await expect(registry.connect(signer3).register(delegate3.address, "baz"))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(firstId + 2, delegate3.address, "baz");
    });

    it("stores correct id and address", async () => {
      await registry.connect(signer1).register(delegate1.address, handle);
      const result = await registry.resolveRegistration(handle);
      expect(result[0]).to.equal(1000);
      expect(result[1]).to.equal(delegate1.address);
    });
  });

  describe("change address", async () => {
    // create registration to change
    beforeEach(async () => {
      await registry.connect(signer1).register(delegate1.address, handle);
    });

    it("updates stored address", async () => {
      await registry.connect(signer1).changeAddress(newDelegate1.address, handle);

      const result = await registry.resolveRegistration(handle);
      expect(result[1]).to.equal(newDelegate1.address);
    });

    it("emits a DSNPRegistryUpdate event", async () => {
      await expect(registry.connect(signer1).changeAddress(newDelegate1.address, handle))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(firstId, newDelegate1.address, handle);
    });

    it("reverts when handle does not exist", async () => {
      await expect(
        registry.connect(signer1).changeAddress(newDelegate1.address, newHandle)
      ).to.be.revertedWith("Handle does not exist");
    });

    it("reverts when sender is not authorized in old contract", async () => {
      await expect(
        registry.connect(signer2).changeAddress(delegate2.address, handle)
      ).to.be.revertedWith("Access denied");
    });

    it("reverts when new contract is not a delegation contract", async () => {
      await expect(
        registry.connect(signer1).changeAddress(nonDelegate.address, handle)
      ).to.be.revertedWith("contract does not support IDelegation interface");
    });

    it("reverts when new contract does not exist", async () => {
      const bogusContract = ethers.utils.getAddress(generateHexString(40));
      await expect(
        registry.connect(signer1).changeAddress(bogusContract, handle)
      ).to.be.revertedWith("function call to a non-contract account");
    });
  });

  describe("changeAddressByEIP712Sig", () => {
    // create registration to change
    beforeEach(async () => {
      await registry.connect(signer1).register(delegate1.address, handle);
    });

    it("updates stored address", async () => {
      const message = { nonce: 0, addr: newDelegate1.address, handle: handle };
      const { v, r, s } = await signEIP712(signer1, registryDomain, addressChangeTypes, message);
      await registry.connect(signer2).changeAddressByEIP712Sig(v, r, s, message);
      const result = await registry.resolveRegistration(handle);
      expect(result[1]).to.equal(newDelegate1.address);
    });

    it("updates nonce", async () => {
      const message = { nonce: 0, addr: newDelegate1.address, handle: handle };
      const { v, r, s } = await signEIP712(signer1, registryDomain, addressChangeTypes, message);
      await registry.connect(signer2).changeAddressByEIP712Sig(v, r, s, message);

      expect(await registry.resolveHandleToNonce(handle)).to.equal(1);
    });

    it("emits a DSNPRegistryUpdate event", async () => {
      const message = { nonce: 0, addr: newDelegate1.address, handle: handle };
      const { v, r, s } = await signEIP712(signer1, registryDomain, addressChangeTypes, message);

      await expect(registry.connect(signer2).changeAddressByEIP712Sig(v, r, s, message))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(firstId, newDelegate1.address, handle);
    });

    it("reverts when nonce is too high", async () => {
      const message = { nonce: 1, addr: newDelegate1.address, handle: handle };
      const { v, r, s } = await signEIP712(signer1, registryDomain, addressChangeTypes, message);

      await expect(
        registry.connect(signer2).changeAddressByEIP712Sig(v, r, s, message)
      ).to.be.revertedWith("Nonces do not match");
    });

    it("reverts when nonce is too low", async () => {
      const message = { nonce: 0, addr: newDelegate1.address, handle: handle };
      const { v, r, s } = await signEIP712(signer1, registryDomain, addressChangeTypes, message);
      await registry.connect(signer2).changeAddressByEIP712Sig(v, r, s, message);

      const message2 = { nonce: 0, addr: delegate1.address, handle: handle };
      const sig2 = await signEIP712(signer1, registryDomain, addressChangeTypes, message2);

      await expect(
        registry.connect(signer2).changeAddressByEIP712Sig(sig2.v, sig2.r, sig2.s, message2)
      ).to.be.revertedWith("Nonces do not match");
    });

    it("reverts when handle does not exist", async () => {
      const message = { nonce: 0, addr: newDelegate1.address, handle: newHandle };
      const { v, r, s } = await signEIP712(signer1, registryDomain, addressChangeTypes, message);

      await expect(
        registry.connect(signer2).changeAddressByEIP712Sig(v, r, s, message)
      ).to.be.revertedWith("Handle does not exist");
    });

    it("reverts when sender is not authorized in old contract", async () => {
      const message = { nonce: 0, addr: newDelegate1.address, handle: handle };
      const { v, r, s } = await signEIP712(signer2, registryDomain, addressChangeTypes, message);

      await expect(
        registry.connect(signer2).changeAddressByEIP712Sig(v, r, s, message)
      ).to.be.revertedWith("Access denied");
    });

    it("reverts when new contract is not a delegation contract", async () => {
      const message = { nonce: 0, addr: nonDelegate.address, handle: handle };
      const { v, r, s } = await signEIP712(signer1, registryDomain, addressChangeTypes, message);

      await expect(
        registry.connect(signer2).changeAddressByEIP712Sig(v, r, s, message)
      ).to.be.revertedWith("contract does not support IDelegation interface");
    });

    it("reverts when new contract does not exist", async () => {
      const bogusContract = ethers.utils.getAddress(generateHexString(40));
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
      await registry.connect(signer1).register(delegate1.address, handle);
    });

    it("stores address and id under new handle", async () => {
      await registry.connect(signer1).changeHandle(handle, newHandle);

      const [id, addr] = await registry.resolveRegistration(newHandle);
      expect(addr).to.equal(delegate1.address);
      expect(id).to.equal(firstId);
    });

    it("emits a DSNPRegistryUpdate event", async () => {
      await expect(registry.connect(signer1).changeHandle(handle, newHandle))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(firstId, delegate1.address, newHandle);
    });

    it("clears old handle and frees it for registration", async () => {
      await registry.connect(signer1).changeHandle(handle, newHandle);

      await expect(registry.resolveRegistration(handle)).to.be.revertedWith(
        "Handle does not exist"
      );

      await expect(registry.connect(signer2).register(delegate2.address, handle))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(firstId + 1, delegate2.address, handle);
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
      await registry.connect(signer2).register(delegate2.address, newHandle);

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
      await registry.connect(signer1).register(delegate1.address, handle);
    });

    it("stores address and id under new handle", async () => {
      const message = { nonce: 0, oldHandle: handle, newHandle: newHandle };
      const { v, r, s } = await signEIP712(signer1, registryDomain, handleChangeTypes, message);
      await registry.connect(signer2).changeHandleByEIP712Sig(v, r, s, message);
      const [id, addr] = await registry.resolveRegistration(newHandle);
      expect(addr).to.equal(delegate1.address);
      expect(id).to.equal(firstId);
    });

    it("emits a DSNPRegistryUpdate event", async () => {
      const message = { nonce: 0, oldHandle: handle, newHandle: newHandle };
      const { v, r, s } = await signEIP712(signer1, registryDomain, handleChangeTypes, message);

      await expect(registry.connect(signer2).changeHandleByEIP712Sig(v, r, s, message))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(firstId, delegate1.address, newHandle);
    });

    it("clears old handle and frees it for registration", async () => {
      const message = { nonce: 0, oldHandle: handle, newHandle: newHandle };
      const { v, r, s } = await signEIP712(signer1, registryDomain, handleChangeTypes, message);
      await registry.connect(signer2).changeHandleByEIP712Sig(v, r, s, message);

      await expect(registry.resolveRegistration(handle)).to.be.revertedWith(
        "Handle does not exist"
      );

      await expect(registry.connect(signer2).register(delegate2.address, handle))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(firstId + 1, delegate2.address, handle);
    });

    it("updates nonce for old handle", async () => {
      const message = { nonce: 0, oldHandle: handle, newHandle: newHandle };
      const { v, r, s } = await signEIP712(signer1, registryDomain, handleChangeTypes, message);
      await registry.connect(signer2).changeHandleByEIP712Sig(v, r, s, message);

      // we must register handle again to retrieve its nonce
      await registry.connect(signer2).register(delegate2.address, handle);

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
      await registry.connect(signer2).register(delegate2.address, handle);

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
      await registry.connect(signer2).register(delegate2.address, newHandle);

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
