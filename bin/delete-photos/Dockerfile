FROM mhart/alpine-node:16
LABEL author="internxt"

WORKDIR /

# Add useful packages
RUN apk add git curl

RUN ls ../../
# COPY ../../../photos-server /
COPY ./photos-server-copy/photos-server /photos-server
RUN ls ./
RUN ls ./photos-server -la
WORKDIR /photos-server

# Install deps
RUN yarn && yarn build && yarn --production && yarn cache clean

# Run command
CMD node /dist/bin/delete-photos/index.js
