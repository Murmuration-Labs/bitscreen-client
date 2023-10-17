FROM node:18-alpine AS build

RUN apk add --no-cache --update \
  make \
  g++ \
  git \
  bash \
  curl

WORKDIR /bitscreen-build

COPY package*.json yarn.lock /bitscreen-build/

RUN yarn

COPY . /bitscreen-build

RUN yarn build


FROM node:16-alpine AS deploy

# Expose listen port
EXPOSE 3000

WORKDIR /static

COPY --from=build /bitscreen-build/build ./build

RUN yarn global add npm serve

ENTRYPOINT ["serve", "-s", "build"]
