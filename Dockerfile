FROM node:12-alpine
RUN apk add --no-cache --update \
  python \
  make \
  g++ \
  git \
  bash \
  curl

# Create app directory
WORKDIR /server
# Install app dependencies
COPY package*.json ./
RUN yarn
# Bundle app source
COPY . /server
# Build server
RUN yarn build
# Expose listen port
EXPOSE 3030

ENTRYPOINT ["yarn", "server"]
