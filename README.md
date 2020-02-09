# poly-bot
this is a discord bot written in typescript to generate polycule maps over a discord server

## setup
first a config file with all the good secret stuff needs to be setup in src/SERCET.ts

```js
export default {
    DISCORD_TOKEN: "<discord token>",
    DB_HOST: "localhost or wherever",
    DB_NAME: "polybot or something else if you want to",
    DB_PORT: "5432 or anothing port you might like",
    DB_PASSWORD: "a super secure password",
    DB_USER: "a super cool username",
    GRAPHVIZ_LOCATION: "D:\\path\\to\\graphvis\\bin"
}
```

## database
the database that this bot runs on is postgresql

a script for how to setup the database schema can be found in polybot.sql