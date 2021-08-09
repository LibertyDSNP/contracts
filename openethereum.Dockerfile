FROM openethereum/openethereum:v3.3.0-rc.6
ARG DEPLOY_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

WORKDIR /contracts

USER root

RUN apk --update add curl jq && \
    rm -rf /var/lib/apt/lists/* && \
    rm /var/cache/apk/*

USER openethereum

COPY package.json package-lock.json /contracts/
COPY tsconfig.json hardhat.config.ts /contracts/
COPY scripts /contracts/scripts
COPY contracts /contracts/contracts
COPY /docker/dev-spec.json /home/openethereum/dev-spec.json

USER root

# Run all this in one layer so that we can remove all npm files at the end shrinking the image by ~540mb
RUN apk --update add nodejs npm &&\
 su -c "npm ci" openethereum && \
 nohup su -c "/home/openethereum/openethereum  --chain=/home/openethereum/dev-spec.json --jsonrpc-cors="all" --jsonrpc-hosts=\"all\" --jsonrpc-interface=\"all\" --jsonrpc-apis=\"all\" --jsonrpc-port=8545 -l sync=debug,rpc=trace &" openethereum && \
 sleep 5 && \
 su -c "LOCAL_PRIVATE_KEY=${DEPLOY_PRIVATE_KEY} npm run deploy:localhost" openethereum && \
 rm -Rf /contracts ~/.npm ~/.cache ~/.config ~/.local &&\
 apk del nodejs npm &&\
 rm -rf /var/lib/apt/lists/* && \
 rm /var/cache/apk/*

USER openethereum

WORKDIR /app

HEALTHCHECK --start-period=500s \
  CMD curl -s -H "Content-Type: application/json" -X POST --data '{"id":1,"jsonrpc":"2.0","method":"eth_blockNumber","params":[]}' http://localhost:8545 | jq 'if .result >= "0xe" then . else halt_error(1) end'

ENTRYPOINT ["/home/openethereum/openethereum",  "--chain=/home/openethereum/dev-spec.json", "--jsonrpc-cors=all", "--jsonrpc-hosts=all", "--jsonrpc-interface=all", "--jsonrpc-apis=all", "--jsonrpc-port=8545", "-l sync=debug,rpc=trace"]
