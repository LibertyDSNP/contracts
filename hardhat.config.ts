require("dotenv").config();
import { HardhatUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "hardhat-typechain";

const getAccounts = (network: string) => {
  if (process.env.NODE_ENV === "test") return [];

  const accounts = {
    localhost: [process.env.LOCAL_NETWORK_ACCOUNT_PRIVATE_KEY],
    testnet: [process.env.TESTNET_ACCOUNT_PRIVATE_KEY],
  };

  if (!accounts[network]) {
    throw new Error(`Your account environment variables for ${network} are not set`);
  }

  return accounts[network];
};

const config: HardhatUserConfig = {
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
      accounts: getAccounts("localhost"),
    },
    testnet: {
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 1,
      url: `${process.env.TESTNET_CHAIN_URL}`,
      chainId: 1776,
      accounts: getAccounts("testnet"),
    },
  },
};

export default config;
