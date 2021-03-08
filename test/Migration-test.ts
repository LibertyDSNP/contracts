import { ethers } from "hardhat";
import chai from "chai";
const { expect } = chai;

describe("Migrate", function () {
  it("emits a migration log event", async function () {
    const Contract = await ethers.getContractFactory("Migrations");
    const contract = await Contract.deploy();
    await contract.deployed();

    expect(await contract.setCompleted(123444)).to.emit(contract, "DSNPMigration")
  });
});
