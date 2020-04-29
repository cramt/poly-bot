import * as fs from "fs"

export interface SecretDB {
    HOST: string
    NAME: string
    PORT: number
    PASSWORD: string
    USER: string
}

export interface Secret {
    DISCORD_TOKEN: string
    GRAPHVIZ_LOCATION: string
    PREFIX: string
    HTTP_PORT: number
    GITHUB_SECRET: string
    DB: SecretDB

}

let secret = JSON.parse(fs.readFileSync("SECRET.json").toString()) as Secret;

secret.HTTP_PORT = parseInt(secret.HTTP_PORT + "") || 80;
secret.DB.PORT = parseInt(secret.DB.PORT + "") || 5432;

export default secret;