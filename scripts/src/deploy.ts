// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre from "hardhat";

const ethers = hre.ethers;

export async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("provider connection", ethers.provider.connection);
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const Migrations = await ethers.getContractFactory("Migrations", {});
  const contract1 = await Migrations.deploy();

  const contract1Address: string = await contract1.getAddress();

  console.log("migrations deployed to:", contract1Address);

  // Emit DSNP migration event for the Migrations contract
  await contract1.upgraded(contract1Address, "Migrations");

  // Deploy the Publisher Contract
  const Publisher = await ethers.getContractFactory("Publisher");
  const publisher = await Publisher.deploy();

  // Emit DSNP migration event for the Publisher contract
  const publisherAddress = await publisher.getAddress();
  await contract1.upgraded(publisherAddress, "Publisher");

  // Deploy the Identity Logic Contract
  const Identity = await ethers.getContractFactory("Identity");
  const identityLogic = await Identity.deploy("0x0000000000000000000000000000000000000000");

  const identityLogicAddress: string = await identityLogic.getAddress();
  console.log("identity logic deployed to: ", identityLogicAddress);

  // Emit DSNP migration event for the Identity contract
  await contract1.upgraded(identityLogicAddress, "Identity");

  // Deploy the Registry Contract
  const Registry = await ethers.getContractFactory("Registry");
  const registry = await Registry.deploy();
  const registryAddress: string = await registry.getAddress()
  console.log("registry deployed to:", registryAddress);

  // Emit DSNP Migration event for the Registry
  await contract1.upgraded(registryAddress, "Registry");

  // Deploy the Identity Proxy Clone Factory Contract
  const IdentityCloneFactory = await ethers.getContractFactory("IdentityCloneFactory");
  const cloneFactory = await IdentityCloneFactory.deploy();
  const cloneFactoryAddress = await cloneFactory.getAddress();
  console.log("identity clone factory logic deployed to:", cloneFactoryAddress);

  // Emit DSNP migration event for the IdentityCloneFactory contract
  await contract1.upgraded(cloneFactoryAddress, "IdentityCloneFactory");

  // Deploy the Beacon and Factory Contract
  const Beacon = await ethers.getContractFactory("Beacon");
  const beacon = await Beacon.deploy(identityLogicAddress, deployer.address);
  const beaconAddress: string = await beacon.getAddress();
  console.log("beacon deployed to:", beaconAddress);

  const IdentityBeaconFactory = await ethers.getContractFactory("BeaconFactory");
  const beaconFactory = await IdentityBeaconFactory.deploy(beaconAddress, registryAddress);
  const beaconFactoryAddress: string = await beaconFactory.getAddress();
  console.log("identity beacon factory logic deployed to:", beaconFactoryAddress);

  // Emit DSNP migration event for the Beacon and factory contract
  await contract1.upgraded(beaconAddress, "Beacon");
  await contract1.upgraded(beaconFactoryAddress, "BeaconFactory");
}
