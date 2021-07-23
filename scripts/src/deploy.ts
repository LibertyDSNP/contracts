// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// import { ethers } from "hardhat";
import hre from "hardhat"
const ethers = hre.ethers
export async function main() {

  const [deployer] = await ethers.getSigners();

  console.log("provider connection", ethers.provider.connection);
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const Migrations = await ethers.getContractFactory("Migrations", {});
  const contract1 = await Migrations.deploy();
  await hre.ethernal.push({
    name: "Migrations",
    address: contract1.address
  })

  await contract1.deployed();
  console.log("migrations deployed to:", contract1.address);

  // Emit DSNP migration event for the Migrations contract
  await contract1.upgraded(contract1.address, "Migrations");

  // Deploy the Publisher Contract
  const Publisher = await ethers.getContractFactory("Publisher");
  const publisher = await Publisher.deploy();
  await publisher.deployed();
  console.log("publisher deployed to:", publisher.address);
  // await setupEthernalFor("Publisher", publisher)

  // Emit DSNP migration event for the Publisher contract
  await contract1.upgraded(publisher.address, "Publisher");

  // Deploy the Identity Logic Contract
  const Identity = await ethers.getContractFactory("Identity");
  const identityLogic = await Identity.deploy("0x0000000000000000000000000000000000000000");
  await identityLogic.deployed();
  console.log("identity logic deployed to:", identityLogic.address);
  // await setupEthernalFor("Identity", identityLogic)

  // Emit DSNP migration event for the Identity contract
  await contract1.upgraded(identityLogic.address, "Identity");

  // Deploy the Registry Contract
  const Registry = await ethers.getContractFactory("Registry");
  const registry = await Registry.deploy();
  await registry.deployed();
  console.log("registry deployed to:", registry.address);
  // await setupEthernalFor("Registry", registry)

  // Emit DSNP Migration event for the Registry
  await contract1.upgraded(registry.address, "Registry");

  // Deploy the Identity Proxy Clone Factory Contract
  const IdentityCloneFactory = await ethers.getContractFactory("IdentityCloneFactory");
  const cloneFactory = await IdentityCloneFactory.deploy();
  await cloneFactory.deployed();
  console.log("identity clone factory logic deployed to:", cloneFactory.address);
  // await setupEthernalFor("IdentityCloneFactory", cloneFactory)

  // Emit DSNP migration event for the IdentityCloneFactory contract
  await contract1.upgraded(cloneFactory.address, "IdentityCloneFactory");

  // Deploy the Beacon and Factory Contract
  const Beacon = await ethers.getContractFactory("Beacon");
  const beacon = await Beacon.deploy(identityLogic.address);
  await beacon.deployed();
  console.log("beacon deployed to:", beacon.address);
  // await setupEthernalFor("Beacon", beacon)

  const IdentityBeaconFactory = await ethers.getContractFactory("BeaconFactory");
  const beaconFactory = await IdentityBeaconFactory.deploy(beacon.address, registry.address);
  await beaconFactory.deployed();
  console.log("identity beacon factory logic deployed to:", beaconFactory.address);
  // await setupEthernalFor("BeaconFactory", beaconFactory)

  // Emit DSNP migration event for the Beacon and factory contract
  await contract1.upgraded(beacon.address, "Beacon");
  await contract1.upgraded(beaconFactory.address, "BeaconFactory");
}
