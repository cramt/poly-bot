# poly-bot
this is a discord bot written in typescript to generate polycule maps over a discord server

## setup
first a config file with all the good secret stuff needs to be setup in SECERT.json in the root directory

```json
{
  "DISCORD_TOKEN": "DISCORD TOKEN",
  "GRAPHVIZ_LOCATION": "/path/to/graphviz",
  "PREFIX": "/poly ",
  "HTTP_PORT": 80,
  "GITHUB_SECRET": "123456789",
  "DB": {
    "HOST": "localhost",
    "NAME": "polybot",
    "PORT": 5432,
    "PASSWORD": "SUPER SECURE PASSWORD",
    "USER": "postgres"
  }
}
```

HTTP_PORT and GITHUB_SECRET is only relevant for auto updating in production, you can ignore it if you want to

## database
the bot uses a postgresql database

## TODO
- add command for reading log files
- add pluralkit import support
- add alias' to commands
- move generation of maps off main thread

## TODO but kinda irrelevant
- adding custom discord emoji as stuff in to generate