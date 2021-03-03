require('dotenv').config()
import "@nomiclabs/hardhat-web3";
import { HardhatUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-waffle";
import "hardhat-typechain";
import { task } from "hardhat/config";

// task action function receives the Hardhat Runtime Environment as second argument
task("accounts", "Prints accounts", async (_, { web3 }) => {
  console.log(await web3.eth.getAccounts());
});



const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [{ version: "0.7.3", settings: {} }],
  },
  networks: {
    hardhat: {
    },
    testnet: {
      url: "http://127.0.0.1:8545",
      chainId: 1776,
      accounts: [`0x${process.env.TESTNETWORK_PRIVATE_KEY}`]
    },
  },
};

export default config;
