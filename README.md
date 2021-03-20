# Social Identity Contracts

This repo will allow us to create and deploy contracts to our POA network. We are using [hardhat](https://hardhat.org/) to 
compile and deploy the contracts
 
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
| VALIDATOR1 | Public key of validator running on liberty-chain |
| VALIDATOR2 | Public key of validator running on Liberty chain
| BOOTNODE | enode address of the node our node would like to connect to |
    
## Accounts

## Deployments

## Ports

## ABI Files
Download ABI files [here](http://unknown.tbd)

## Development
* This repo uses [Hardhat](https://hardhat.org/getting-started/) + [ethers](https://docs.ethers.io/v5/) for interfacing with Ethereum,
* [Waffle](https://ethereum-waffle.readthedocs.io/en/latest/index.html) for testing,
* And [Truffle](https://www.trufflesuite.com/docs/truffle/getting-started/running-migrations) or truffle-style for contract migration.

