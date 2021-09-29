FROM node:12-alpine
RUN apk add --no-cache --update \
  python \
  make \
  g++ \
  git \
  bash \
  curl

WORKDIR /client
COPY . .
RUN yarn install
# Expose listen port
EXPOSE 3000

ENTRYPOINT ["yarn", "start-prod"]
