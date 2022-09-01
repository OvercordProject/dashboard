# Overcord

[![MIT License](https://img.shields.io/apm/l/atomic-design-ui.svg?)](LICENSE)

Overcord is a discord server project based on the famous game Overwatch.

## Self host

Clone this repo

```shell
npm install
```
or
```shell
pnpm install
```

```sh
npm run dev
```
## Environment Variables

Edit .env.example => .env with your credentials

To run this project, you will need to add the following environment variables to your .env file

DEBUG=`debug env variable (can be overcord:*, see: https://github.com/debug-js/debug#environment-variables)`

NODE_ENV=`can be development, test or production`

PORT=`port to run the dashboard`

BASE_URL=`ex: http:localhost:8080`

DISCORD_BOT_TOKEN=`your discord bot token`

DISCORD_SERVER_ID=`your discord server id (developer tools enabled on discord)`

SESSION_SECRET=`random string for express session`

DISCORD_CLIENT_ID=`your discord client id (in discord app dashboard)`

DISCORD_CLIENT_SECRET=`your discord client secret`

DISCORD_REDIRECT_URI=/auth/discord/callback `default redirect url for discord auth`

BATTLENET_CLIENT_ID=`your battlenet app id`

BATTLENET_CLIENT_SECRET=`your battlenet app secret`

BATTLENET_REDIRECT_URI=/auth/battlenet/callback `default redirect url for battlenet auth`

DB_PATH=`path to sqlite db file`

DB_FILE=`name of sqlite db file`

## License

[MIT](LICENSE) © X3ne
