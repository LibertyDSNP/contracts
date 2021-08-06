# DSNP Contracts

The official DSNP interface and implementations.

## Overview

**Target DSNP Spec Version**: v0.9.1

### Installation
To install this package in your repo:
```console
$ npm install @dsnp/contracts
```
 ---
## Usage
### JavaScript ABI

```javascript
const publisher = require("@dsnp/contracts/abi/Publisher.json");
const publisherABI = publisher.abi;

```
### TypeScript ABI

```typescript
// Requires "resolveJsonModule": true in [tsconfig](https://www.typescriptlang.org/tsconfig#resolveJsonModule)
import { abi as publisherABI } from "@dsnp/contracts/abi/Publisher.json";
```

#### TypeScript Contract Types

To maintain types, it is suggested to use [TypeChain](https://github.com/ethereum-ts/Typechain).

1. Follow the [install directions](https://github.com/ethereum-ts/Typechain#installation) and add the correct package for your toolset.
2. Add a postinstall or other step to run typechain:
  - `"postinstall": "typechain --target=(ethers-v5|web3-v1|other...) ./node_modules/@dsnp/contracts/**/*.json --outDir ./types/typechain"`
  - `"build:web3types": "typechain --target=web3-v1 ./node_modules/@dsnp/contracts/**/*.json --outDir ./types/typechain"`
3. Make sure your `--outDir` is in [tsconfig typeRoots](https://www.typescriptlang.org/tsconfig#typeRoots).
4. Use the types:
```typescript
// web3 example
import web3 from "web3";
import { Publisher } from "./types/typechain/Publisher";
import { abi as publisherABI } from "@dsnp/contracts/abi/Publisher.json";

const getPublisherContract = (contractAddress: string) => {
  // web3 requires the type casts
  return (new web3.eth.Contract(publisherABI, contractAddress) as any) as Publisher;
}
```

```typescript
// ethersjsv5 example
import { Provider } from "@ethersproject/providers";
import { Publisher } from "./types/typechain/Publisher";

const getPublisherContract = (contractAddress: string, provider: Provider) => {
  // TypeChain for Ethers provides factories
  return Publisher__factory.connect(contractAddress, provider);
}
```

### Contracts

Once installed, you can use the contracts in the library by importing them:

```solidity
pragma solidity ^0.8.0;

import "@dsnp/contracts/IPublish.sol";

contract MyPublisher is IPublish {
    // ...
}
```
---
## Development
We are using [hardhat](https://hardhat.org/) to compile and deploy the contracts.

To develop for or with these contracts, you will need to be able to launch one or more test nodes. For all types of test nodes, first run:

```console
npm install               # installs packages listed in package.json
npm run hardhat:compile   # builds the contracts
cp .env.sample .env       # to edit once you have launched a node
```

### To deploy a local Hardhat node with contracts
The simplest way to launch a test node is to run a local hardhat node.
                
Spin up a node with:
```console
npx hardhat node
```
This will output a list of initialized test accounts and their private keys. 
1. Choose and copy an account private key
1. Edit `.env` and set LOCAL_PRIVATE_KEY to the key you just copied:
```shell
LOCAL_PRIVATE_KEY=0xabcd1234567890
```
From another terminal, run:
`npm run deploy:localhost`

### Key Commands and Tasks
Basic Command List:
- `npm install`
- `npm run clean` - clears the cache and deletes all artifacts
- `npm run build` - cleans and compiles the project
- `npm run console` - opens a hardhat console
- `npm run test` - runs mocha tests
- `npm run lint` - to run the linter
- `npm run format` - to trigger formatting
- `npm run deploy:testnet` - deploys our `deploy.ts` script to our POA testnet defined in the `hardhat.config.ts`
- `npm run deploy:localhost` - deploys our `deploy.ts` script to our hardhat network defined in the `hardhat.config.ts`

### Running Test Chains in Docker

Version matching may matter when working with the the contracts package or the SDK package.
Docker images are tagged in the same way as the npm package, so you can match the npm package version to the image version.
To find out what version of the contracts package you are using:

```bash
$ npm ls --all | grep "@dsnp/contracts"
```

There are multiple images you can use for different purposes.
See [docker/README.md](./docker/README.md) for more details. 

### evm_snapshot/evm_revert

Both Hardhat and Ganache test chains support snapshot and revert. Learn more in the [ganache docs](https://github.com/trufflesuite/ganache-cli/#custom-methods).

Remember:
> A snapshot can only be used once. After a successful evm_revert, the same snapshot id cannot be used again.
> Consider creating a new snapshot after each evm_revert if you need to revert to the same point multiple times.

## Development
* This repo uses [Hardhat](https://hardhat.org/getting-started/) + [ethers](https://docs.ethers.io/v5/) for interfacing with Ethereum,
* [Waffle](https://ethereum-waffle.readthedocs.io/en/latest/index.html) for testing

## Troubleshooting
* **`ELIFECYCLE` eror when deploying contracts** - if you see the following:
```hardhat:core:hre Creating provider for network localhost +113ms
provider connection { url: 'http://localhost:8545' }
TypeError: Cannot read property 'address' of undefined
    at Object.<anonymous> (/home/allison/projects/git/ots/dsnp/contracts/scripts/src/deploy.ts:12:65)
    at step (/home/allison/projects/git/ots/dsnp/contracts/scripts/src/deploy.ts:33:23)
    at Object.next (/home/allison/projects/git/ots/dsnp/contracts/scripts/src/deploy.ts:14:53)
    at fulfilled (/home/allison/projects/git/ots/dsnp/contracts/scripts/src/deploy.ts:5:58)
    at processTicksAndRejections (internal/process/task_queues.js:95:5)
  hardhat:core:scripts-runner Script ./scripts/deploy.ts exited with status code 1 +2s
  hardhat:core:cli Killing Hardhat after successfully running task run +0ms
npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! contracts@1.0.0 deploy:localhost: `hardhat run ./scripts/deploy.ts --network localhost --verbose`
npm ERR! Exit status 1
```
You probably did not create or did not correctly create a `.env` file. Make sure this file exists at the top of the repo and that has the correct values.  See `.env.sample` and the [Environment Variables](#environment-variables) table.
