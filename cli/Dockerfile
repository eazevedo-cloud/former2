FROM ts-node:14.18.3-buster-slim

WORKDIR /former2

RUN apt-get update && \
    npm -g install former2

ENTRYPOINT ["former2"]
