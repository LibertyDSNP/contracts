require('dotenv').config()
import { HardhatUserConfig, HttpNetworkUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-waffle";
import "hardhat-typechain";

const config: HardhatUserConfig | HttpNetworkUserConfig = {
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
      accounts: [`${process.env.LOCAL_NETWORK_PRIVATE_KEY}`]
    },
    testnet: {
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 1,
      url: `${process.env.TESTNET_CHAIN_URL}`,
      chainId: 1776,
      accounts: [`${process.env.TESTNET_PRIVATE_KEY}`]
    },
  },
};

export default config;
