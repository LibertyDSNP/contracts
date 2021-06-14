require("dotenv").config();
import { HardhatUserConfig } from "hardhat/src/types/config";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "hardhat-gas-reporter";

const getAccounts = (network: string) => {
  const accounts = {
    localhost: process.env.LOCAL_PRIVATE_KEY ? [process.env.LOCAL_PRIVATE_KEY] : [],
    stagenet: process.env.STAGENET_PRIVATE_KEY ? [process.env.STAGENET_PRIVATE_KEY] : [],
  };

  if (!accounts[network]) {
    throw new Error(`Your account environment variables for ${network} are not set`);
  }

  return accounts[network];
};

//We have multiple environments that we are using the hardhat config for
// localhost refers to the network hardhat is using to spin up a node
// devnet refers to the network we are using to connect to running our POA nodes locally
// stagenet refers to the network running our POA nodes on AWS

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [{ version: "0.8.4", settings: {} }],
  },
  networks: {
    hardhat: {},
    localhost: {
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 1,
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: getAccounts("localhost"),
    },
    devnet: {
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 1,
      url: "http://127.0.0.1:8545",
      chainId: 1883,
      accounts: getAccounts("localhost"),
    },
    stagenet: {
      gas: "auto",
      gasPrice: "auto",
      gasMultiplier: 1,
      url: `${process.env.STAGENET_CHAIN_URL}`,
      chainId: 1884,
      accounts: getAccounts("stagenet"),
    },
  },
};

export default config;
