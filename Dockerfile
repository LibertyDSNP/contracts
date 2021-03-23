FROM openethereum/openethereum:v3.1.1

USER root
RUN apk update
RUN apk add --no-cache jq bash

WORKDIR /home/openethereum

COPY ./docker/entrypoint.sh /home/openethereum/
COPY ./docker/liberty-testnet-spec.json /home/openethereum/

EXPOSE 80 8545 8546 30303

RUN chmod +x "/home/openethereum/entrypoint.sh"
ENTRYPOINT ["sh", "-c", "/home/openethereum/entrypoint.sh" ]
