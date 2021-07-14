# BitScreen Client

The bitscreen client helps node operators manage and share lists of blocked CIDs among themselves in order to filter the content they store for the Filecoin network.

## Development

### Setup

1. Clone the project locally

- with ssh: `git clone git@github.com:Murmuration-Labs/bitscreen-client.git`
- with https: `git clone https://github.com/Murmuration-Labs/bitscreen-client.git`

2. `yarn install`

### Linting

To check for any linting errors, you can call the `yarn lint` command.

To also fix the errors (that are automatically fixable), you can call `yarn lint-fix`

Easiest way to deal with this if you are using VSCode is to add the Prettier extension via the VSCode's extension interface. Afterwards add these options in your .vscode/settings.json file:

```
"editor.defaultFormatter": "esbenp.prettier-vscode",
"editor.formatOnSave": true,
"editor.formatOnPaste": false
```

## Server

### Starting the server (from local)

Call in the root of the project: `yarn server`
Server will be available, by default, at [`http://localhost:3030`](http://localhost:3030)

### Starting the server (from Dockerhub image)

Call in the root of the project `docker-compose up`

### Building a new Docker image

1. navigate to root of project
2. Build with: `docker build -t keykoio/bitscreen-client:<tag> .`
3. Push to Dockerhub: `docker push keykoio/bitscreen-client:<tag>`

### Endpoints

`GET /config` - returns the configuration of the bitscreen client

`PUT /config` - updates the configuration. The payload is not required to contain all configs, it allow partial updates

`GET /filters` - returns all existing filter lists

`POST /filters` - creates a new filters list

`PUT /filters` - updates one or more filters lists

`GET /filter/search?q=:search_term` - returns all filters lists that have either a partial match between `search_term` and the filter list name, or an exact match between `search_term` and one of the CIDs on the filter list

`GET /filters/:id` - returns the filter with the matching `:id`

` GET /filters/shared/:_cryptId` - returns the filter with the matching `_cryptId`, but all CIDs will be hashed for security reasons

### Config structure

```
{
  "bitscreen": boolean,
  "share": boolean,
  "advanced": {
    "enabled": boolean,
    "list": string[]
  },
  "filters": {
    "internal": boolean,
    "external": boolean
  }
}
```

### Filter structure

```
{
  "_id": integer,
  "_cryptId": string,
  "cids": string[],
  "name": string,
  "enabled": boolean,
  "visibility": integer
}
```

## Web app

Call in the root of your project `yarn start`

The app will be available, by default, at [`http://localhost:3000`](http://localhost:3000) or on your local network at `http://your_ip:3000`

The app is also deployed at https://green-frost-6805.on.fleek.co/ and updates on `master` branch changes.

## Remote server

Remote server is available at [https://bxn.keyko.rocks/](https://bxn.keyko.rocks/)
