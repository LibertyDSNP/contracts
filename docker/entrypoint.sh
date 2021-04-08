#!/usr/bin/env bash
cat liberty-testnet-spec.json |  jq --arg v1 $VALIDATOR1 --arg v2 $VALIDATOR2 '.engine.authorityRound.params.validators.list = [$v1, $v2]' \
> liberty-testnet-spec-updated.json && cp liberty-testnet-spec-updated.json liberty-testnet-spec.json
rm liberty-testnet-spec-updated.json

/home/openethereum/openethereum  --chain=/home/openethereum/liberty-testnet-spec.json --bootnodes=$BOOTNODE --jsonrpc-cors="all" --jsonrpc-hosts="all" --jsonrpc-interface="all" --jsonrpc-apis="all" --jsonrpc-port=8545 -l sync=debug,rpc=trace

