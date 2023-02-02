FROM mhart/alpine-node:16
LABEL author="internxt"

WORKDIR /

# Add useful packages
RUN apk add git curl

RUN ls ../../
# COPY ../../../photos-server /
COPY ./photos-server-copy/ /
COPY ./ /bin/delete-photos/
RUN rm -rfv /bin/delete-photos/photos-server-copy

WORKDIR /
RUN cp /bin/delete-photos/.npmrc /
RUN yarn && yarn build && yarn --production && yarn cache clean

WORKDIR /bin/delete-photos/

# Install deps
RUN yarn && yarn build && yarn --production && yarn cache clean
RUN npm install axios

# Run command
CMD node /dist/bin/delete-photos/index.js