FROM node:16.6-alpine

ENV LOCAL_PRIVATE_KEY "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

WORKDIR /app

RUN apk --update add bash curl jq tini && \
    rm -rf /var/lib/apt/lists/* && \
    rm /var/cache/apk/*

COPY package.json package-lock.json /app/

RUN npm ci

COPY tsconfig.json hardhat.config.ts /app/
COPY scripts /app/scripts
COPY contracts /app/contracts

RUN npx hardhat compile

COPY ./docker/hardhat-entrypoint.sh /app

HEALTHCHECK --start-period=5s \
  CMD curl -s -X POST --data '{"id":1,"jsonrpc":"2.0","method":"eth_blockNumber","params":[]}' http://localhost:8545 | jq 'if .result >= "0xe" then . else halt_error(1) end'

RUN chmod +x "/app/hardhat-entrypoint.sh"
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/app/hardhat-entrypoint.sh"]
