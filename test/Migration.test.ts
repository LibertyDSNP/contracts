import { ethers, waffle } from "hardhat";
import chai from "chai";
import * as fs from "fs";
import { Contract, Event, EventFilter } from "ethers";
const { expect } = chai;
import { keccak256 as keccak256Sha3 } from "js-sha3";

const keccak256 = data => "0x" + keccak256Sha3(data);
const topic = keccak256("DSNPMigration(uint256 lastCompleted, address contractAddr, string contractName, string abi)");

const parsedABI = (abiPath) => {
  expect(fs.existsSync(abiPath)).to.eq(true)
  const fileContent = fs.readFileSync(abiPath);
  const parsed = JSON.parse(fileContent.toString())
  return parsed.abi
}

async function setup()  {
  const Contract = await ethers.getContractFactory("Migrations",{});
  const contract = await Contract.deploy();
  await contract.deployed();
  return contract
}

describe("Migrate", function () {
  it("upgrade emits a migration log event", async function () {
    const contractName = "Doesnotmatter"
    const lastCompleted = 1; // contract version uint256
    const contract = await setup();

    await contract.setCompleted(lastCompleted);

    const abiPath = "./artifacts/contracts/Migrations.sol/Migrations.json";
    let parsedabi = parsedABI(abiPath);

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

    expect(await contract.lastCompletedMigration())
      .to
      .eq(lastCompleted);
  })

  it("is able to get the contract address and abi, and call contract function", async function() {
    const contractName = "Migrations"
    const contract = await setup();
    const lastCompleted = 0

    const abiPath = "./artifacts/contracts/Migrations.sol/Migrations.json";
    let parsedabi = parsedABI(abiPath);
    const abiJSONStr = JSON.stringify(parsedabi)
    expect(abiJSONStr).not.to.eq('{}')
    expect(await contract.upgraded(contract.address, contractName, abiJSONStr))
      .to
      .emit(contract, "DSNPMigration")
      .withArgs(lastCompleted, contract.address, contractName, abiJSONStr)

    const filter:EventFilter = {topics: []}

    const events = await contract.queryFilter(filter);
    expect(events).not.to.eq(undefined)
    expect(events.length).to.eq(1);

    const evt = events[0] || {}
    // @ts-ignore
    const { abi, contractAddr } = evt.decode(evt.data, evt.topics[topic]);

    // there's a bug in Hardhat's getContractAt that doesn't let us instantiate a
    // contract through their mockProvider/signer test framework, using the ABI:
    // https://github.com/nomiclabs/hardhat/issues/1340
    // So here we just check that we really instantiated the right contract. We can't call
    // the methods because there's no way (well, certainly no easy enough way)
    // to deploy this contract to the mock network through the bare ethers interface.
    const contract2 = new Contract(contractAddr, abi);
    expect(contract2.functions).to.respondTo('lastCompletedMigration')
    expect(contract2.functions).to.respondTo('setCompleted')
    expect(contract2.functions).to.respondTo('upgraded')
  })
});
