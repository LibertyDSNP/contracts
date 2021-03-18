import { ethers } from "hardhat";
import chai from "chai";
import * as fs from "fs";
import { Event, EventFilter } from "ethers";
const { expect } = chai;
import { keccak256 as keccak256Sha3 } from "js-sha3";
import { bufferToRpcData } from "hardhat/internal/hardhat-network/provider/output";

const keccak256 = data => "0x" + keccak256Sha3(data);
const topic = keccak256("DSNPMigration(uint256 lastCompleted, address contractAddr, string contractName, string abi)");

const parsedABI = (abiPath) => {
  expect(fs.existsSync(abiPath)).to.eq(true)
  const fileContent = fs.readFileSync(abiPath);
  const parsed = JSON.parse(fileContent.toString())
  return parsed.abi
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
    const contractName = "SomeContract"
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
    await ethers.getContractAt(abi, contractAddr);
    // expect(await contract2.lastCompletedMigration()).to.eq(0);
    //
    // const signer = ethers.getSigners()[0];
    // const newContractAtNewAddr = await contract2.connect(signer);
    // expect(await newContractAtNewAddr.setLastCompleted(3333)).not.to.throw();
    // expect(await newContractAtNewAddr.lastCompletedMigration()).to.eq(333);

  })

  async function setup()  {
    const Contract = await ethers.getContractFactory("Migrations");
    const contract = await Contract.deploy();
    await contract.deployed();
    return contract
  }

});
