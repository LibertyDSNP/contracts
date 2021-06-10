FROM node:16.3-alpine
ENV MNEMONIC "test test test test test test test test test test test junk"
ENV DEPLOY_PRIVATE_KEY "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
ENV CHAINID "31337"
ENV LOCAL_PRIVATE_KEY ${DEPLOY_PRIVATE_KEY}

WORKDIR /app

RUN apk --update add bash && \
    rm -rf /var/lib/apt/lists/* && \
    rm /var/cache/apk/*

COPY package.json package-lock.json /app/

RUN npm ci

COPY tsconfig.json hardhat.config.ts /app/
COPY scripts /app/scripts
COPY contracts /app/contracts

COPY ./docker/hardhat-entrypoint.sh /app

RUN npx hardhat compile

RUN chmod +x "/app/hardhat-entrypoint.sh"
ENTRYPOINT ["sh", "-c", "/app/hardhat-entrypoint.sh" ]
