FROM openethereum/openethereum:v3.1.1

USER root
RUN apk update && apk add bash
RUN apk add --no-cache jq

WORKDIR /home/openethereum

COPY ./docker /home/openethereum/

EXPOSE 80 8545 8546 30303

RUN chmod +x "/home/openethereum/entrypoint.sh"
ENTRYPOINT ["sh", "-c", "/home/openethereum/entrypoint.sh" ]
