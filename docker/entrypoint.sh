#!/usr/bin/env bash
cat liberty-testnet-spec.json |  jq --arg v1 $VALIDATOR1 --arg v2 $VALIDATOR2 '.engine.authorityRound.params.validators.list = [$v1, $v2]' \
> liberty-testnet-spec-updated.json && cp liberty-testnet-spec-updated.json liberty-testnet-spec.json
rm liberty-testnet-spec-updated.json

echo $BOOTNODES

/home/openethereum/openethereum  --chain=/home/openethereum/liberty-testnet-spec.json --bootnodes=$BOOTNODES --jsonrpc-apis="all" --jsonrpc-cors="all" --jsonrpc-hosts="all" --logging=debug

