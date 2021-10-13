# BitScreen Client

The BitScreen Client helps node operators manage and share lists of blocked CIDs among themselves in order to filter the content they store for the Filecoin network.

## Development

### Setup

1. Clone the project locally

- with ssh: `git clone git@github.com:Murmuration-Labs/bitscreen-client.git`
- with https: `git clone https://github.com/Murmuration-Labs/bitscreen-client.git`

2. `yarn install`

### Linting

To check for any linting errors, you can call the `yarn lint` command.

To also fix the errors (that are automatically fixable), you can call `yarn lint-fix`

The easiest way to deal with this if you are using VSCode is to add the Prettier extension via the VSCode's extension interface. Afterwards, add these options in your .vscode/settings.json file:

```
"editor.defaultFormatter": "esbenp.prettier-vscode",
"editor.formatOnSave": true,
"editor.formatOnPaste": false
```

## Web app

Call in the root of your project `yarn start`

The app will be available, by default, at [`http://localhost:3000`](http://localhost:3000) or on your local network at `http://your_ip:3000`

The app is also deployed at [https://bxn.mml-client.keyko.rocks/](https://bxn.mml-client.keyko.rocks/) and updates on `master` branch changes.

## Remote server

Remote server is available at [https://bxn.mml.keyko.rocks](https://bxn.mml.keyko.rocks)
