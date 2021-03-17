import { ethers } from "hardhat";
import chai from "chai";
import * as fs from "fs";
import { EventFilter } from "ethers";
import { keccak256 } from "ethers/lib/utils";
const { expect } = chai;


describe("Migrate", function () {
  it("upgrade emits a migration log event", async function () {
    const contractName = "Doesnotmatter"
    const lastCompleted = 1; // contract version uint256
    const contract = await setup();

    let parsedabi: any = {}
    const abiPath = "./artifacts/contracts/Migrations.sol/Migrations.json"
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

  it("sets lastCompleted", async function() {
    const lastCompleted = 99; // contract version uint256
    const contract = await setup();
    await contract.setCompleted(lastCompleted);

    expect(await contract.lastCompletedMigration)
      .to
      .eq(lastCompleted);
  })

  it("is able to get the contract address and abi", async function() {
    const contract = await setup();

    const evtStr = keccak256("DSNPMigration");

    const filter:EventFilter = {topics: [evtStr]}

    const events = await contract.queryFilter(filter);
    console.log(events);
  })

  async function setup()  {
    const Contract = await ethers.getContractFactory("Migrations");
    const contract = await Contract.deploy();
    await contract.deployed();
    return contract
  }
});
