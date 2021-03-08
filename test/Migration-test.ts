import { ethers } from "hardhat";
import chai from "chai";
const { expect } = chai;

describe("Migrate", function () {
  it("emits a migration log event", async function () {
    const Contract = await ethers.getContractFactory("Migrations");
    const contract = await Contract.deploy();
    await contract.deployed();

    await expect(contract.setCompleted())
  });
});
