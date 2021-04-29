import { ethers } from "hardhat";
import chai from "chai";
const { expect } = chai;
import { generateHexString } from "@unfinishedlabs/test-generators"

describe("Registry", () => {
  const handle = "flarp";
  const address1 = ethers.utils.getAddress(generateHexString(40));
  const address2 = ethers.utils.getAddress(generateHexString(40));
  const address3 = ethers.utils.getAddress(generateHexString(40));

  let registry;

  beforeEach(async () => {
    const Registry = await ethers.getContractFactory("Registry");
    registry = await Registry.deploy();
    await registry.deployed();
  });

  describe("register", () => {

    it("emits a DSNPRegistryUpdate event", async () => {
      await expect(registry.register(address1, handle))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(1, address1, handle);
    });

    // stores correct id
    // stores correct address

    it("fails when handle already exists", async () => {
      await registry.register(address1, handle)
      await expect(registry.register(address1, handle))
        .to.be.revertedWith("Handle already exists")
    });

    it("increments id for each registration", async () => {      
      await expect(registry.register(address1, 'foo'))
        .to.emit(registry, "DSNPRegistryUpdate").withArgs(1, address1, 'foo');
      await expect(registry.register(address2, 'bar'))
        .to.emit(registry, "DSNPRegistryUpdate").withArgs(2, address2, 'bar');
      await expect(registry.register(address3, 'baz'))
        .to.emit(registry, "DSNPRegistryUpdate").withArgs(3, address3, 'baz');
    });

    it("stores correct id", async () => {      
      await registry.register(address1, handle);
      const result = await registry.resolveHandleToId(handle)
      expect(result).to.equal(1);
    });

    it("stores correct address", async () => {      
      await registry.register(address1, handle);
      const result = await registry.resolveHandleToAddress(handle)
      expect(result).to.equal(address1);
    });
  });

  describe("change address", async () => {
    it("updates stored address", async () => {
      await registry.register(address1, handle)

      // now change address to address2
      await registry.changeAddress(address2, handle)

      const result = await registry.resolveHandleToAddress(handle)
      expect(result).to.equal(address2);
    });

    it("emits a DSNPRegistryUpdate event", async () => {
      await registry.register(address1, handle)
      await expect(registry.changeAddress(address2, handle))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(1, address2, handle);
    });

    it("reverts when handle does not exist", async () => {
      await expect(registry.changeAddress(address1, handle))
        .to.be.revertedWith("Handle does not exist")
    });
  });

  describe("change handle", async () => {
    const newHandle = "flarpenator";
    it("stores address and id under new handle", async () => {
      await registry.register(address1, handle)

      await registry.changeHandle(handle, newHandle)

      const addr = await registry.resolveHandleToAddress(newHandle)
      expect(addr).to.equal(address1);

      const id = await registry.resolveHandleToId(newHandle)
      expect(id).to.equal(1);
    });

    it("emits a DSNPRegistryUpdate event", async () => {
      await registry.register(address1, handle)

      await expect(registry.changeHandle(handle, newHandle))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(1, address1, newHandle);
    });

    it("clears old handle and frees it for registration", async () => {
      await registry.register(address1, handle)
      await registry.changeHandle(handle, newHandle)

      await expect(registry.resolveHandleToAddress(handle))
        .to.be.revertedWith("Handle does not exist")

      await expect(registry.resolveHandleToId(handle))
        .to.be.revertedWith("Handle does not exist")

      await expect(registry.register(address2, handle))
        .to.emit(registry, "DSNPRegistryUpdate")
        .withArgs(2, address2, handle);
    });

    it("reverts when handle does not exist", async () => {
      await expect(registry.changeHandle(handle, newHandle))
        .to.be.revertedWith("Old handle does not exist")
    });

    it("reverts when new handle already exists", async () => {
      await registry.register(address1, handle)
      await registry.register(address2, newHandle)

      await expect(registry.changeHandle(handle, newHandle))
        .to.be.revertedWith("New handle already exists")
    });

    it("reverts when new handle and old handle are same", async () => {
      await registry.register(address1, handle)

      await expect(registry.changeHandle(handle, handle))
        .to.be.revertedWith("New handle already exists")
    });
  });
});