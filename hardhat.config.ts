require('dotenv').config()
import { HardhatUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-waffle";
import "hardhat-typechain";

const TESTNET_CHAIN_URL = process.env.TESTNET_CHAIN_URL;
const LOCAL_NETWORK_ACCOUNT_PRIVATE_KEY = process.env.LOCAL_NETWORK_ACCOUNT_PRIVATE_KEY;
const TESTNET_ACCOUNT_PRIVATE_KEY = process.env.TESTNET_ACCOUNT_PRIVATE_KEY;

const hasENVS= [
  TESTNET_CHAIN_URL,
  LOCAL_NETWORK_ACCOUNT_PRIVATE_KEY,
  TESTNET_ACCOUNT_PRIVATE_KEY
].filter(Boolean).length !== 0;

if (!hasENVS) {
  throw new Error("Ensure your environment variables are set");
}

const config: HardhatUserConfig =  {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [{ version: "0.7.3", settings: {} }],
  },
  networks: {
    hardhat: {},
    localhost: {
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 1,
      url: "http://127.0.0.1:8545",
      chainId: 1776,
      accounts: [`${LOCAL_NETWORK_ACCOUNT_PRIVATE_KEY}`]
    },
    testnet: {
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 1,
      url: `${TESTNET_CHAIN_URL}`,
      chainId: 1776,
      accounts: [`${TESTNET_ACCOUNT_PRIVATE_KEY }`]
    },
  },
};

export default config;
