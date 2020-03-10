import { Client, ClientConfig } from 'pg'
import SECRET from './SECRET';
import { Gender, User } from './User';
import { Relationship, RelationshipType } from './Relationship';
import * as fs from "fs"

let client: Client;

const numberSqlRegex = /\d*\.sql/.compile()

function getMaxMigrationFiles(dir: string[]) {
    let ids = dir.filter(x => numberSqlRegex.test(x)).map(x => parseInt(x.split(".")[0])).sort().reverse();
    ids.forEach((x, i) => {
        if (x !== i) {
            throw new Error("there is no " + x + ".sql migration, even thou higher numbers of migrations exists")
        }
    })
    if (ids.length === 0) {
        return -1;
    }
    return ids[0];
}

async function setupSchema() {
    let [currentVersion, maxMigrations] = await Promise.all([
        (async () => {
            try {
                return (await client.query("select schema_version from info")).rows[0].schema_version as number
            }
            catch (e) {
                return -1;
            }
        })(),
        fs.promises.readdir("migrations").then(x => getMaxMigrationFiles(x))
    ])
    if (currentVersion >= maxMigrations) {
        return;
    }
    for (let i = currentVersion + 1; i <= maxMigrations; i++) {
        await client.query((await fs.promises.readFile("migrations/" + i + ".sql")).toString())
    }
}

export async function openDB(config: ClientConfig = {
    host: SECRET.DB_HOST,
    user: SECRET.DB_USER,
    password: SECRET.DB_PASSWORD,
    port: parseInt(SECRET.DB_PORT) || 5432,
    database: SECRET.DB_NAME
}) {
    client = new Client(config);
    await client.connect();
    await setupSchema();
}

export const genderStringToInt: {
    [P in Gender]: number
} = {
    "FEMME": 0,
    "MASC": 1,
    "NEUTER": 2,
    "SYSTEM": 3,
}

export const genderIntToString: {
    [key: number]: Gender
} = Object.getOwnPropertyNames(genderStringToInt).reduce((curr, acc) => {
    (curr as any)[genderStringToInt[acc as Gender]] = acc
    return curr;
}, {})

export const relationshipStringToInt: {
    [P in RelationshipType]: number
} = {
    "ROMANTIC": 0,
    "SEXUAL": 1,
    "FRIEND": 2,
    "LIVES WITH": 3,
    "IN SYSTEM WITH": 4,
    "CUDDLES WITH": 5,
    "QUEERPLATONIC": 6
}

export const relationshipIntToString: {
    [key: number]: RelationshipType
} = Object.getOwnPropertyNames(relationshipStringToInt).reduce((curr, acc) => {
    (curr as any)[relationshipStringToInt[acc as RelationshipType]] = acc
    return curr
}, {})

function generatePreparedKeys(rows: number, colums: number): string {
    let index = 1;
    return new Array(colums).fill(null).map(() => "(" + new Array(rows).fill(null).map(() => "$" + (index++)).join(", ") + ")").join(", ")
}

function generateNullableEvaluation(field: string, number: number) {
    return "(" + field + " = $" + number + " OR (" + field + " IS NULL AND $" + number + " IS NULL))"
}

export async function createNewUser(user: User): Promise<boolean> {
    try {
        await client.query("INSERT INTO users (guild_id, username, discord_id, gender, system_id) VALUES (?, ?, ?, ?, ?)", [user.guildId, user.name, user.discordId, genderStringToInt[user.gender], user.systemId])
        return true
    }
    catch (e) {
        return false
    }
}

export async function createNewRelationship(relationship: Relationship): Promise<boolean> {
    try {
        await client.query("INSERT INTO relationships (relationship_type, left_user_id, right_user_id, guild_id) VALUES ($1, $2, $3, $4)", [relationshipStringToInt[relationship.type], relationship.leftUserId, relationship.rightUserId, relationship.guildId])
        return true
    }
    catch (e) {
        return false
    }
}

export async function removeRelationship(guildId: string, rightId: number, leftId: number): Promise<void> {
    await client.query("DELETE FROM relationships WHERE guild_id = $1 AND (left_user_id = $2 AND right_user_id = $3) OR (right_user_id = $2 AND left_user_id = $3)", [guildId, leftId, rightId])
}


export async function getUserByDiscordId(discordId: string): Promise<User | null> {
    let result = await client.query("SELECT username, gender, id, system_id FROM users WHERE discord_id = $1", [discordId])
    if (result.rows.length === 0) {
        return null
    }
    return new User(result.rows[0].username, genderIntToString[result.rows[0].gender], null, discordId, result.rows[0].id, result.rows[0].system_id)
}

export async function getUserByUsername(guildId: string | null, username: string): Promise<User | null> {
    let result = await client.query("SELECT gender, discord_id, id, system_id FROM users WHERE username = $1 AND " + generateNullableEvaluation("guild_id", 2), [username, guildId])
    if (result.rows.length === 0) {
        return null
    }
    return new User(username, genderIntToString[result.rows[0].gender], guildId, result.rows[0].discord_id, result.rows[0].id, result.rows[0].system_id)
}

export async function getRelationshipsByUsers(users: User[]): Promise<Relationship[]> {
    let relationshipResults = await client.query("SELECT relationship_type, left_user_id, right_user_id, guild_id FROM relationships WHERE left_user_id = ANY($1) OR right_user_id = ANY($1)", [users.map(x => x.id)])
    let userMap = new Map<number, User>()
    users.forEach(x => {
        userMap.set(x.id!, x)
    })
    return relationshipResults.rows.map(relationship =>
        new Relationship(relationshipIntToString[relationship.relationship_type], userMap.get(relationship.left_user_id)!, userMap.get(relationship.right_username)!, relationship.guild_id));
}

export async function getAllInGuild(guildId: string, discordIds: string[]): Promise<{ relationships: Relationship[], users: User[] }> {
    let [relationshipResults, userResults] = await Promise.all([
        client.query("SELECT relationship_type, left_user_id, right_user_id FROM relationships WHERE guild_id = $1 OR (SELECT discord_id FROM users WHERE id = left_user_id) = ANY($2) OR (SELECT discord_id FROM users WHERE id = right_user_id) = ANY($2)", [guildId, discordIds]),
        client.query("SELECT username, discord_id, gender, id, system_id FROM users WHERE guild_id = $1 OR (SELECT discord_id FROM users WHERE id = left_user_id) = ANY($2) OR (SELECT discord_id FROM users WHERE id = right_user_id) = ANY($2)", [guildId, discordIds])])
    let users = userResults.rows.map(user => new User(user.username, genderIntToString[user.gender], guildId, user.discord_id, user.id, user.system_id))
    let userMap = new Map<number, User>()
    users.forEach(x => {
        userMap.set(x.id!, x)
    })
    let relationships = relationshipResults.rows.map(relationship =>
        new Relationship(relationshipIntToString[relationship.relationship_type], userMap.get(relationship.left_user_id)!, userMap.get(relationship.right_username)!, guildId));
    return {
        relationships: relationships,
        users: users
    }
}


export async function getAllMembers(user: User): Promise<User[]> {
    let userResults = await client.query(`
        WITH RECURSIVE members AS (
            SELECT username, discord_id, gender, system_id, id, guild_id FROM users
            WHERE system_id = $1
            UNION 
                SELECT u.username, u.discord_id, u.gender, u.system_id, u.id, u.guild_id FROM users u
                INNER JOIN members m ON m.id = u.system_id
        ) SELECT username, discord_id, gender, system_id, id FROM members
    `, [user.id])
    let users = userResults.rows.map(user => new User(user.username, genderIntToString[user.gender], user.guild_id, user.discord_id, user.id, user.system_id))
    return users
}

export async function removeUserAndTheirRelationshipsByDiscordId(guildId: string, discordId: string) {
    await client.query(`with username_of_deleted as (
        DELETE FROM users WHERE guild_id = $1 AND discord_id = $2
        returning username
    )
    DELETE FROM relationships WHERE guild_id = $11
     AND (left_username = (SELECT username FROM username_of_deleted) OR right_username = (SELECT username FROM username_of_deleted))`, [guildId, discordId])
}

export async function removeSystemMemberAndTheirRelationshipsByDiscordId(guildId: string, discordId: string, username: string) {
    await client.query(`with username_of_deleted as (
        DELETE FROM users WHERE guild_id = $1 AND username = $3 AND position('.' in username) > 0 AND substring(username from 0 for position('.' in username)) = (SELECT username FROM users WHERE discord_id = $2)
        returning username
    )
    DELETE FROM relationships WHERE guild_id = $1
     AND (left_username = (SELECT username FROM username_of_deleted) OR right_username = (SELECT username FROM username_of_deleted))`, [guildId, discordId, username])
}

export async function removeUserAndTheirRelationshipsByUsername(guildId: string, username: string) {
    await client.query(`with username_of_deleted as (
        DELETE FROM users WHERE guild_id = $1 AND username = $2
        returning username
    )
    DELETE FROM relationships WHERE guild_id = $1
     AND (left_username = (SELECT username FROM username_of_deleted) OR right_username = (SELECT username FROM username_of_deleted))`, [guildId, username])
}

export async function setDiscordIdForUser(user: User) {
    await client.query("UPDATE users SET discord_id = $2 WHERE guild_id = NULL AND username = $1", [user.name, user.discordId])
}