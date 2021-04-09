### Testnet Node

#### Env variables
Environment Variables
1. create a `.env` file in the `docker/` directory and set values for all variables in `.env.sample`

|Env Variable Name      | Description |     
|-----------------------|-------------|
| VALIDATOR1 | hex prefixed address for validator running on node called liberty-chain |
| VALIDATOR2 | hex prefixed address for validator running on node called liberty-chain1 |
| BOOTNODE | enode address of the node to connect to (make sure the enode address ends with the appropriate IP) |

#### Setup
1. To spin up a node - add environment variables listed above to a `.env` file in the docker directory
1. From the root directory of the project run `npm run docker:reset`
1. When looking at logs in docker container - there should be a log that says `1/25 peers`. 
This means the node is syncing.

#### For local setup 
1. If you would like to run a node locally - run the following command:

    ```bash
        openethereum --chain=./docker/liberty-testnet-spec.json --jsonrpc-cors="all" --jsonrpc-hosts="all" \
        --jsonrpc-interface="all" --jsonrpc-apis="all" --jsonrpc-port=8549 --port=3500 -l sync=debug,rpc=trace
    ```

1. You can pass the `--bootnode=enode://{address_of_node_to connect to}` flag to the `openethereuem` command above in order to allow the node to connect when it spins up.

1. To connect nodes manually run the following two commands from the command line:
    - Retrieve enode address from node: 
    
        ```
            curl --data '{"jsonrpc":"2.0","method":"parity_enode","params":[],"id":0}' 
            -H "Content-Type: application/json" -X POST {address of node you want to query}
        ```      
    
    - Use enode address to sync with local node:
     
        ```
            curl --data '{"method":"parity_addReservedPeer","params":["{ENODE ADDRESS}"],"id":1,"jsonrpc":"2.0"}' \
            -H "Content-Type: application/json" -X POST {IP:PORT that local node is running on - ex: http://localhost:8545}
        ```      

### Debugging ethereum node logs
To add logging to the docker container running the ethereum node - add a `logging=debug` flag to the `openethereum` command
in the `./entrypoint.sh` file. Currently the logs are set to `-l sync=debug,rpc=trace`. 

More information on logging can be found [here](https://openethereum.github.io/FAQ.html#how-can-i-make-openethereum-write-logs)

When added it should look like this:
   
        /home/openethereum/openethereum  --chain=/home/openethereum/liberty-testnet-spec.json --bootnodes=$BOOTNODE \
        --jsonrpc-cors="all" --jsonrpc-hosts="all" --jsonrpc-interface="all" --jsonrpc-apis="all" --jsonrpc-port=8545 --logging={error|warn|info|debug|trace}
        


### Open ethereuem file storage
1. Open ethereuem stores files related to cache and database in the following directories
    ```
        Windows: %UserProfile%\AppData\Roaming\OpenEthereum\
        Linux: ~/.local/share/openethereum/
        macOS: $HOME/Library/Application Support/OpenEthereum/
    ```
1. Openethereum stores the cache for the node here:
 `$HOME/Library/Application Support/OpenEthereum/chains/{Name of chain spec}/network/nodes.json`
 
    - If you are running locally and seeing errors connecting to nodes that no longer exist - you may want to delete
    the `nodes.json` file to clear the cache. Openethereum will regenerate it once you restart a node.

