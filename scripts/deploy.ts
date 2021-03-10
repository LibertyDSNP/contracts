// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { run, ethers, web3 } from "hardhat";
import Web3 from "web3";
import { AbiInput, AbiItem, AbiOutput, AbiType, StateMutabilityType } from "web3-utils";
// const Contract = require('web3-eth-contract');
// Contract.setProvider('http://localhost:8545');

async function main() {
  // const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  // const abi: AbiItem[] = [
  //   {
  //     "inputs": [
  //       {
  //         "internalType": "string",
  //         "name": "_greeting",
  //         "type": "string"
  //       }
  //     ],
  //     "stateMutability": "nonpayable",
  //     "type": "constructor"
  //   },
  //   {
  //     "inputs": [],
  //     "name": "greet",
  //     "outputs": [
  //       {
  //         "internalType": "string",
  //         "name": "",
  //         "type": "string"
  //       }
  //     ],
  //     "stateMutability": "view",
  //     "type": "function"
  //   }
  // ]
  //
  //
  // const Greeter = new web3.eth.Contract(abi)
  // const greeterBytes = "0x608060405234801561001057600080fd5b506040516103423803806103428339818101604052602081101561003357600080fd5b810190808051604051939291908464010000000082111561005357600080fd5b8382019150602082018581111561006957600080fd5b825186600182028301116401000000008211171561008657600080fd5b8083526020830192505050908051906020019080838360005b838110156100ba57808201518184015260208101905061009f565b50505050905090810190601f1680156100e75780820380516001836020036101000a031916815260200191505b50604052505050806000908051906020019061010492919061010b565b50506101a8565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061014c57805160ff191683800117855561017a565b8280016001018555821561017a579182015b8281111561017957825182559160200191906001019061015e565b5b509050610187919061018b565b5090565b5b808211156101a457600081600090555060010161018c565b5090565b61018b806101b76000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063cfae321714610030575b600080fd5b6100386100b3565b6040518080602001828103825283818151815260200191508051906020019080838360005b8381101561007857808201518184015260208101905061005d565b50505050905090810190601f1680156100a55780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b606060008054600181600116156101000203166002900480601f01602080910402602001604051908101604052809291908181526020018280546001816001161561010002031660029004801561014b5780601f106101205761010080835404028352916020019161014b565b820191906000526020600020905b81548152906001019060200180831161012e57829003601f168201915b505050505090509056fea2646970667358221220ffbcacb3a1e48a3539cd4a5e0023c99b82a803ba2648eea497ba3107c2c1e47564736f6c63430007030033"
  // let helloInstance = {}
  // const deployed = Greeter.deploy(
  //   {data: greeterBytes, arguments: ["hello"]}).send({
  //   from: '0x20f2478FecAbD3D9aA7e13e1D961ED53c9161574',
  //   gas: 1500000,
  //   gasPrice: '30000000000000'
  // })
  // .then((instance) => {
  //   console.log("Contract mined at " + instance.options.address);
  //   helloInstance = instance;
  // });


  // console.log("hello instance address", helloInstance)
  const abi = [
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_greeting",
          "type": "string"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "greet",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]

  const [deployer] = await ethers.getSigners();

  console.log("provider", ethers.provider)
  console.log(
    "Deploying contracts with the account:",
    deployer.address
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  // We get the contract to deploy
  const Greeter = await ethers.getContractFactory("Greeter");

  console.log("Greeter", Greeter)
  const greeter = await Greeter.deploy("test");

  await greeter.deployed();
  console.log("Greeter deployed to:", greeter.address);


  const contract =  new ethers.Contract(greeter.address, abi, ethers.provider);
  console.log("contract", contract)
  const message = await contract.greet()
  console.log("greet: ", message);

}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});
