# DSNP Contracts

The official DSNP interface and implementations.

## Overview

### Installation

```console
$ npm install @unfinishedlabs/contracts
```

### JavaScript ABI Usage

```javascript
const announcer = require("@unfinishedlabs/contracts/abi/Announcer.json");
const annoucerABI = announcer.abi;

```
### TypeScript ABI Usage

```typescript
// Requires "resolveJsonModule": true in [tsconfig](https://www.typescriptlang.org/tsconfig#resolveJsonModule)
import { abi as announcerABI } from "@unfinishedlabs/contracts/abi/Announcer.json";
```

#### TypeScript Contract Types

To maintain types, it is suggested to use [TypeChain](https://github.com/ethereum-ts/Typechain).

1. Follow the [install directions](https://github.com/ethereum-ts/Typechain#installation) and add the correct package for your toolset.
2. Add a postinstall or other step to run typechain:
  - `"postinstall": "typechain --target=(ethers-v5|web3-v1|other...) node_modules/@unfinishedlabs/contracts/**/*.json --outDir ./types/typechain"`
  - `"build:web3types": "typechain --target=web3-v1 node_modules/@unfinishedlabs/contracts/**/*.json --outDir ./types/typechain"`
3. Make sure your `--outDir` is in [tsconfig typeRoots](https://www.typescriptlang.org/tsconfig#typeRoots).
4. Use the types:
```typescript
// web3 example
import web3 from "web3";
import { Announcer } from "./types/typechain/Announcer";
import { abi as announcerABI } from "@unfinishedlabs/contracts/abi/Announcer.json";

const getAnnouncerContract = (contractAddress: string) => {
  // web3 requires the type cast
  return new web3.eth.Contract(announcerABI, contractAddress) as Announcer;
}
```

```typescript
// ethersjsv5 example
import { Provider } from "@ethersproject/providers";
import { Announcer } from "./types/typechain/Announcer";

const getAnnouncerContract = (contractAddress: string, provider: Provider) => {
  // TypeChain for Ethers provides factories
  return Announcer__factory.connect(contractAddress, provider);
}
```

### Contract Usage

Once installed, you can use the contracts in the library by importing them:

```solidity
pragma solidity ^0.8.0;

import "@unfinishedlabs/contracts/IAnnounce.sol";

contract MyAnnouncer is IAnnounce {
    // ...
}
```

## Development

We are using [hardhat](https://hardhat.org/) to compile and deploy the contracts
 
## Key Commands and Tasks
Basic Command List:
- `npm install`
- `npm run clean` - clears the cache and deletes all artifacts
- `npm run compile` - compiles the entire project, building all artifacts
- `npm run console` - opens a hardhat console
- `npm run test` - runs mocha tests
- `npm run lint` - to run the linter
- `npm run format` - to trigger formatting 
- `npm run deploy:testnet` - deploys our `deploy.ts` script to our POA testnet defined in the `hardhat.config.ts`

Environment Variables
1. create a `.env` file and set values for all variables in `.env.sample`

|Env Variable Name      | Description | 
| ------------- | -----------  | 
| LOCAL_NETWORK_PRIVATE_KEY         | private key for an account we have on our local network that has eth.         | 
| TESTNET_ACCOUNT_PRIVATE_KEY       | private key for an account we have on our test network that has eth.         |
| TESTNET_CHAIN_URL     | Url to connect to tesnet        |     
| VALIDATOR1 | hex prefixed address for validator running on node called liberty-chain |
| VALIDATOR2 | hex prefixed address for validator running on node called liberty-chain1
| BOOTNODE | enode address of the node our node would like to connect to |
    
## Accounts

## Deployments

## Ports

## Development
* This repo uses [Hardhat](https://hardhat.org/getting-started/) + [ethers](https://docs.ethers.io/v5/) for interfacing with Ethereum,
* [Waffle](https://ethereum-waffle.readthedocs.io/en/latest/index.html) for testing,
* And [Truffle](https://www.trufflesuite.com/docs/truffle/getting-started/running-migrations) or truffle-style for contract migration.
