FROM trufflesuite/ganache-cli:v6.12.2
ARG MNEMONIC="test test test test test test test test test test test junk"
ARG DEPLOY_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
ARG CHAINID="31337"
ARG LOCAL_PRIVATE_KEY=${DEPLOY_PRIVATE_KEY}

WORKDIR /contracts

COPY package.json package-lock.json /contracts/
COPY tsconfig.json hardhat.config.ts /contracts/
COPY scripts /contracts/scripts
COPY contracts /contracts/contracts

# Run all this in one layer so that we can remove all npm files at the end shrinking the image by ~540mb
RUN npm i -g npm && \
 npm ci && \
 nohup sh -c "node /app/ganache-core.docker.cli.js --db /db --defaultBalanceEther 10000 --mnemonic \"$MNEMONIC\" --chainId $CHAINID &" && \
 sleep 5 && \
 npm run deploy:localhost && \
 rm -Rf /contracts ~/.npm ~/.cache ~/.config ~/.local

WORKDIR /app

ENTRYPOINT ["/bin/sh", "-c", "node /app/ganache-core.docker.cli.js --db /db --defaultBalanceEther 10000 --mnemonic \"$MNEMONIC\" --chainId $CHAINID"]
