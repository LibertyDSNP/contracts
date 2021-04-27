// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("provider", ethers.provider);
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const Migrations = await ethers.getContractFactory("Migrations", {});
  const contract1 = await Migrations.deploy();
  await contract1.deployed();
  console.log("migrations deployed to:", contract1.address);

  // Emit DSNP migration event for the Migrations contract
  await contract1.upgraded(contract1.address, "Migrations")

  // Deploy the Announcer Contract
  const Announcer = await ethers.getContractFactory("Announcer");
  const announcer = await Announcer.deploy();
  const contract = await announcer.deployed();
  console.log("announcer deployed to:", contract.address);

  // Emit DSNP migration event for the Announcer contract
  await contract1.upgraded(contract.address, "Announcer")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
