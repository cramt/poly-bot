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
    GRAPHVIZ_LOCATION: "D:\\path\\to\\graphvis\\bin",
    PREFIX: "/poly "
}
```

## database
the bot uses a postgresql database

## TODO
- add alias' to commands
- add caching for polymap generation
- fix the database stuff
- less wide 2 electric boogaloo
- better way to do variable number of arguments

## TODO but kinda irrelevant
- adding custom discord emoji as stuff in to generate