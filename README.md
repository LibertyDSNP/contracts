# DSNP Contracts

The official DSNP interface and implementations.

## Contract Deployments

### Rinkeby

| Contract | Version | Address |
| --- | --- | --- |
| Migrations | v1.0.1 | `0xF95Ecefa916EA32FE9e83266b3f8Bfb78c4De264` |
| Publisher | v1.0.1 | `0xeF7B5d418128fB8C1645Dd31270BE2cCAF9015e4` |
| Identity | v1.0.1 | `0xa067CEa2859d27CA83700c7E17414f111C1BF561` |
| Registry | v1.0.1 | `0x5d8266342aAfe19CB8EC25A6637f385893389A35` |
| Identity Clone Factory | v1.0.1 | `0xDf962f3C24863A0fb8fb77B3144E31fE2859b9B8` |
| Beacon | v1.0.1 | `0xe3B7Fb9c43F9E62910Ae2763AA64aec07ec8F308` |
| Beacon Factory | v1.0.1 | `0xC1F8593D46356B98c5DC7f7E8DF35247A68ED7D8` |

### Ropsten
| Contract | Version | Address |
| --- | --- | --- |
| Migrations | v1.0.1 | `0x9A8e553dEcBBD72c1a6584eD059Bd18b181e52fA` |
| Publisher | v1.0.1 | `0x9828b9c8E8863267508eB0235370Eb26914D6a78` |
| Identity | v1.0.1 | `0x33707b57CE4Af9f970fb04a4D6CFF15B8342D938` |
| Registry | v1.0.1 | `0xEBF48cE1EE0e727C2E23cb977799B93fD2EbFfda` |
| Identity Clone Factory | v1.0.1 | `0x61F57538a2621Dd2ba36E513e11cDe4f5936bCe9` |
| Beacon | v1.0.1 | `0x307748fF8c3547a6768B0CD37c1b0F35fFB0ca47` |
| Beacon Factory | v1.0.1 | `0x024a03CFE1e8EE563382C08C1aB359830c39Cf20` |

## Overview

**Target DSNP Spec Version**: v1.0.0

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

### Troubleshooting
If you run into an error when running `hardhat:compile` that looks like this:

```console
Invalid value for HardhatConfig.networks.localhost - Expected a value of type HttpNetworkConfig.
```

It means your `STAGENET_PRIVATE_KEY` and `STAGENET_CHAIN_URL` env variables are
not properly set. If you do not have values for these, you can use empy strings.

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

## Test Accounts

These are set up in the [hardhat.config.ts](https://hardhat.org/config/#hardhat-network) file.
If you need different accounts, please build a different image with a different mnemonic.  Set the chain ID to your choice.

If you wish to use a different seed phrase from what is in this repo, there are BIP39 tools to generate a valid one, such as [Ian Coleman's online tool](https://iancoleman.io/bip39/#english). Please note the below seed phrase is not valid and is only for illustration purposes.

```
MNEMONIC="your valid test seed phrase here test test test test test junk"
CHAINID="31337"
```

### evm_snapshot/evm_revert

Both Hardhat and Ganache test chains support snapshot and revert. Learn more in the [ganache docs](https://github.com/trufflesuite/ganache-cli/#custom-methods).

Remember:
> A snapshot can only be used once. After a successful evm_revert, the same snapshot id cannot be used again.
> Consider creating a new snapshot after each evm_revert if you need to revert to the same point multiple times.

## Accounts
When a node is started, test accounts will be created and their addresses + private keys are emitted to the console.
These can be used for testing, as environment variables, imported into Metamask for test logins, etc.
Note these accounts are not usable on any network but test networks using the test seed provided when you launched your node.

### Default Accounts

The first 10 accounts from the default mnemonic `test test test test test test test test test test test junk`:

| Ethereum Addresses                         | Private Key                                                        |
| --- | --- |
| 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 | 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 |
| 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 | 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d |
| 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC | 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a |
| 0x90F79bf6EB2c4f870365E785982E1f101E93b906 | 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6 |
| 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 | 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a |
| 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc | 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba |
| 0x976EA74026E726554dB657fA54763abd0C3a0aa9 | 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e |
| 0x14dC79964da2C08b23698B3D3cc7Ca32193d9955 | 0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356 |
| 0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f | 0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97 |
| 0xa0Ee7A142d267C1f36714E4a8F75612F20a79720 | 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6 |

## Ports
The default port is `:8545`

## Development
* This repo uses [Hardhat](https://hardhat.org/getting-started/) + [ethers](https://docs.ethers.io/v5/) for interfacing with Ethereum,
* [Waffle](https://ethereum-waffle.readthedocs.io/en/latest/index.html) for testing

## Troubleshooting
* **`ELIFECYCLE` error when deploying contracts** - if you see the following:
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
You probably did not create or did not correctly create a `.env` file. Make sure this file exists at the top of the repo and that has the correct values.  See `.env.sample` and the [development and deploy instructions](#development).
