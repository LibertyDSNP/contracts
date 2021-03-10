// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("provider", ethers.provider)
  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  // We get the contract to deploy
  const Greeter = await ethers.getContractFactory("Greeter");

  const greeter = await Greeter.deploy("test");

  const contract = await greeter.deployed();

  console.log("Greeter deployed to:", greeter.address);
  const message = await contract.greet()
  console.log("greet: ", message);

}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});
