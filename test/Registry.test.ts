import { ethers } from "hardhat";
import chai from "chai";
const { expect } = chai;
import { generateHexString } from "@unfinishedlabs/test-generators"

describe("Registry", () => {
  let registry;

  beforeEach(async () => {
    const Registry = await ethers.getContractFactory("Registry");
    registry = await Registry.deploy();
    await registry.deployed();
  });

  describe("register", () => {
    const handle = "flarp";
    const address1 = ethers.utils.getAddress(generateHexString(40));
    const address2 = ethers.utils.getAddress(generateHexString(40));
    const address3 = ethers.utils.getAddress(generateHexString(40));

    it("emits an update event", async () => {
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
});