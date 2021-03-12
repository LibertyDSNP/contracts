import { ethers } from "hardhat";
import chai from "chai";
import * as fs from "fs";
const { expect } = chai;

describe("Migrate", function () {
  const contractName = "Greeter"
  const lastCompleted = 1234;

  it("upgrade emits a migration log event", async function () {
    const Contract = await ethers.getContractFactory("Migrations");
    const contract = await Contract.deploy();
    await contract.deployed();

    let parsedabi:any = {}
    const abiPath = "./artifacts/contracts/Greeter.sol/Greeter.json"
    fs.readFile(abiPath,{}, (err, buf) => {
      expect(err).to.eq(null);
      expect(buf).not.to.eq(undefined)
      parsedabi = JSON.parse(buf.toString()).abi
    });
    expect(parsedabi).not.to.eq({})
    const abiJSONStr = JSON.stringify(parsedabi)
    await contract.setCompleted(lastCompleted);


    expect(await contract.upgraded(contract.address, contractName, abiJSONStr))
      .to
      .emit(contract, "DSNPMigration")
      .withArgs(lastCompleted, contract.address, contractName, abiJSONStr)
  });
});
