// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

export async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("provider connection", ethers.provider.connection);
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const Migrations = await ethers.getContractFactory("Migrations", {});
  const contract1 = await Migrations.deploy();
  await contract1.deployed();
  console.log("migrations deployed to:", contract1.address);

  // Emit DSNP migration event for the Migrations contract
  await contract1.upgraded(contract1.address, "Migrations");

  // Deploy the Announcer Contract
  const Announcer = await ethers.getContractFactory("Announcer");
  const announcer = await Announcer.deploy();
  await announcer.deployed();
  console.log("announcer deployed to:", announcer.address);

  // Emit DSNP migration event for the Announcer contract
  await contract1.upgraded(announcer.address, "Announcer");

  // Deploy the Identity Logic Contract
  const Identity = await ethers.getContractFactory("Identity");
  const identityLogic = await Identity.deploy("0x0000000000000000000000000000000000000000");
  await identityLogic.deployed();
  console.log("identity logic deployed to:", identityLogic.address);

  // Emit DSNP migration event for the Identity contract
  await contract1.upgraded(identityLogic.address, "Identity");

  // Deploy the Identity Proxy Clone Factory Contract
  const IdentityCloneFactory = await ethers.getContractFactory("IdentityCloneFactory");
  const cloneFactory = await IdentityCloneFactory.deploy();
  await cloneFactory.deployed();
  console.log("identity clone factory logic deployed to:", cloneFactory.address);

  // Emit DSNP migration event for the IdentityCloneFactory contract
  await contract1.upgraded(cloneFactory.address, "IdentityCloneFactory");
}
