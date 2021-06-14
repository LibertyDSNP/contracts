#!/usr/bin/env bash
set -m

npx hardhat node &

npm run deploy:localhost

fg %1
