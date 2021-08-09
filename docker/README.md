# Local Testing Docker Containers

## Why are the different containers?

Different containers are for different use cases.

- OpenEthereum: As close as possible to real, a real OpenEthereum node using a spec very close to testnet and betanet. **Does NOT** support `evm_snapshot`/`evm_revert`.
- Hardhat: [Hardhat](https://hardhat.org/hardhat-network/) has great debugging and logging abilities
- Ganache: Ganache is the standard Ethereum test system, small and fast, but may not always process everything correctly.

## Default Setup

| Property | Value |
| --- | --- |
| Chain Id | 31337 (0x7A69) |
| RPC Port | 8545 |
| Mnemonic for funded accounts | `test test test test test test test test test test test junk` |

## Default Accounts

The first 10 accounts from mnemonic `test test test test test test test test test test test junk`:

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

## OpenEthereum

Uses OpenEthereum with instant sealing.
**Does NOT** support `evm_snapshot`/`evm_revert`.

### Accounts

Uses the default mnemonic (`test test test test test test test test test test test junk`), see [Default Accounts](#Default-Accounts).

## Hardhat

Uses the [Hardhat Network](https://hardhat.org/hardhat-network/) and runs using the hardhat.config.ts file.
Supports `evm_snapshot`/`evm_revert`.

### Accounts

When a node is started, test accounts will be created and their addresses + private keys are emitted to the console.
Uses the default mnemonic (`test test test test test test test test test test test junk`), see [Default Accounts](#Default-Accounts).

## Ganache

**Warning: Ganache current does NOT work with anything that requires EIP721 Signing until Ganache v7 is released**

Uses [Ganache](https://github.com/trufflesuite/ganache-cli/) for a super small docker container and fast spin up.
Supports `evm_snapshot`/`evm_revert`.

### Build Time Environment Variables

| Variable | Default Value |
| --- | --- |
| `MNEMONIC` | `test test test test test test test test test test test junk` |
| `CHAINID` | `31337` (0x7A69) |
| `DEPLOY_PRIVATE_KEY` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |

### Accounts

When a node is started, test accounts will be created and their addresses + private keys are emitted to the console.
With the default `MNEMONIC`, see [Default Accounts](#Default-Accounts).

## Building the Containers

Containers are built from the root of the repository.

| Version | Build | Image |
| --- | --- | --- |
| OpenEthereum | `docker build . -f openethereum.Dockerfile -t [tag here]` | [dsnp/openethereum](https://hub.docker.com/r/dsnp/openethereum) |
| Hardhat | `docker build . -f hardhat.Dockerfile -t [tag here]` | [dsnp/hardhat](https://hub.docker.com/r/dsnp/hardhat) |
| Ganache | `docker build . -f ganache.Dockerfile -t [tag here]` | [dsnp/ganache](https://hub.docker.com/r/dsnp/ganache) |

## Docker Hub Versions

| Tag | Meaning |
| --- | --- |
| latest | Latest released version of the contracts |
| next | Latest `main` branch version of the contracts |
