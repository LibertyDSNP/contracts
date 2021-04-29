import { ethers } from "hardhat";
import chai from "chai";
const { expect } = chai;
import { generateHexString } from "@unfinishedlabs/test-generators"

describe("Registry", () => {
  const handle = "flarp";
  let signer1, signer2, signer3;
  let delegate1, delegate2, delegate3, newDelegate1;

  let registry;

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
  });

  describe("register", () => {

    it("emits a DSNPRegistryUpdate event", async () => {
      await expect(registry.connect(signer1).register(delegate1.address, handle))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(1, delegate1.address, handle);
    });

    it("reverts when sender is not authorized", async () => {
      await expect(registry.connect(signer2).register(delegate1.address, handle))
        .to.be.revertedWith("Access denied");
    })

    it("reverts when contract does not exist", async () => {
      const bogusContract = ethers.utils.getAddress(generateHexString(40))
      await expect(registry.connect(signer2).register(bogusContract, handle))
        .to.be.revertedWith("function call to a non-contract account");
    })

    it("reverts when handle already exists", async () => {
      await registry.connect(signer1).register(delegate1.address, handle)
      await expect(registry.register(delegate1.address, handle))
        .to.be.revertedWith("Handle already exists")
    });

    it("increments id for each registration", async () => {      
      await expect(registry.connect(signer1).register(delegate1.address, 'foo'))
        .to.emit(registry, "DSNPRegistryUpdate").withArgs(1, delegate1.address, 'foo');
      await expect(registry.connect(signer2).register(delegate2.address, 'bar'))
        .to.emit(registry, "DSNPRegistryUpdate").withArgs(2, delegate2.address, 'bar');
      await expect(registry.connect(signer3).register(delegate3.address, 'baz'))
        .to.emit(registry, "DSNPRegistryUpdate").withArgs(3, delegate3.address, 'baz');
    });

    it("stores correct id", async () => {      
      await registry.connect(signer1).register(delegate1.address, handle);
      const result = await registry.resolveHandleToId(handle)
      expect(result).to.equal(1);
    });

    it("stores correct address", async () => {      
      await registry.connect(signer1).register(delegate1.address, handle);
      const result = await registry.resolveHandleToAddress(handle)
      expect(result).to.equal(delegate1.address);
    });
  });

  describe("change address", async () => {
    it("updates stored address", async () => {
      await registry.connect(signer1).register(delegate1.address, handle)

      // now change address to signer2
      await registry.connect(signer1).changeAddress(newDelegate1.address, handle)

      const result = await registry.resolveHandleToAddress(handle)
      expect(result).to.equal(newDelegate1.address);
    });

    it("emits a DSNPRegistryUpdate event", async () => {
      await registry.connect(signer1).register(newDelegate1.address, handle)
      await expect(registry.connect(signer1).changeAddress(newDelegate1.address, handle))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(1, newDelegate1.address, handle);
    });

    it("reverts when handle does not exist", async () => {
      await expect(registry.connect(signer1).changeAddress(newDelegate1.address, handle))
        .to.be.revertedWith("Handle does not exist")
    });

    it("reverts when sender is not authorized in old contract", async () => {
      await registry.connect(signer1).register(delegate1.address, handle)

      await expect(registry.connect(signer2).changeAddress(delegate2.address, handle))
        .to.be.revertedWith("Access denied");
    })

    it("reverts when sender is not authorized in new contract", async () => {
      await registry.connect(signer1).register(delegate1.address, handle)

      await expect(registry.connect(signer1).changeAddress(delegate2.address, handle))
        .to.be.revertedWith("Access denied");
    })

    it("reverts when new contract does not exist", async () => {
      await registry.connect(signer1).register(delegate1.address, handle)

      const bogusContract = ethers.utils.getAddress(generateHexString(40))
      await expect(registry.connect(signer1).changeAddress(bogusContract, handle))
        .to.be.revertedWith("function call to a non-contract account");
    })
  });

  describe("change handle", async () => {
    const newHandle = "flarpenator";
    it("stores address and id under new handle", async () => {
      await registry.connect(signer1).register(delegate1.address, handle)

      await registry.connect(signer1).changeHandle(handle, newHandle)

      const addr = await registry.resolveHandleToAddress(newHandle)
      expect(addr).to.equal(delegate1.address);

      const id = await registry.resolveHandleToId(newHandle)
      expect(id).to.equal(1);
    });

    it("emits a DSNPRegistryUpdate event", async () => {
      await registry.connect(signer1).register(delegate1.address, handle)

      await expect(registry.connect(signer1).changeHandle(handle, newHandle))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(1, delegate1.address, newHandle);
    });

    it("clears old handle and frees it for registration", async () => {
      await registry.connect(signer1).register(delegate1.address, handle)
      await registry.connect(signer1).changeHandle(handle, newHandle)

      await expect(registry.resolveHandleToAddress(handle))
        .to.be.revertedWith("Handle does not exist")

      await expect(registry.resolveHandleToId(handle))
        .to.be.revertedWith("Handle does not exist")

      await expect(registry.connect(signer2).register(delegate2.address, handle))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(2, delegate2.address, handle);
    });

    it("reverts when sender is not authorized", async () => {
      await registry.connect(signer1).register(delegate1.address, handle)
      await expect(registry.connect(signer2).changeHandle(handle, newHandle))
        .to.be.revertedWith("Access denied");
    })

    it("reverts when handle does not exist", async () => {
      await expect(registry.connect(signer1).changeHandle(handle, newHandle))
        .to.be.revertedWith("Old handle does not exist")
    });

    it("reverts when new handle already exists", async () => {
      await registry.connect(signer1).register(delegate1.address, handle)
      await registry.connect(signer2).register(delegate2.address, newHandle)

      await expect(registry.connect(signer1).changeHandle(handle, newHandle))
        .to.be.revertedWith("New handle already exists")
    });

    it("reverts when new handle and old handle are same", async () => {
      await registry.connect(signer1).register(delegate1.address, handle)

      await expect(registry.connect(signer1).changeHandle(handle, handle))
        .to.be.revertedWith("New handle already exists")
    });
  });
});