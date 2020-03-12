import { Client, ClientConfig } from 'pg'
import SECRET from './SECRET';
import { Gender, User } from './User';
import { Relationship, RelationshipType } from './Relationship';
import * as fs from "fs"

let client: Client;

const numberSqlRegex = /[1-9][0-9]*\.sql/.compile()

export function getMaxMigrationFiles(dir: string[]) {
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

export async function setupSchema(dbClient = client) {
    let [currentVersion, maxMigrations] = await Promise.all([
        (async () => {

            let result = (await dbClient.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'info'"));
            let val = -1
            if (result.rows[0].count !== "0") {
                val = (await dbClient.query("select schema_version from info")).rows[0].schema_version as number
            }
            return val


        })(),
        fs.promises.readdir("migrations").then(x => getMaxMigrationFiles(x))
    ])
    if (currentVersion >= maxMigrations) {
        return;
    }
    for (let i = currentVersion + 1; i <= maxMigrations; i++) {
        await dbClient.query((await fs.promises.readFile("migrations/" + i + ".sql")).toString())
    }
    await dbClient.query("INSERT INTO public.info (schema_version) values ($1)", [maxMigrations])
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
    return client
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

export const users = {
    add: async (user: User) => {
        try {
            await client.query("INSERT INTO users (guild_id, username, discord_id, gender, system_id) VALUES (?, ?, ?, ?, ?)", [user.guildId, user.name, user.discordId, genderStringToInt[user.gender], user.systemId])
            return true
        }
        catch (e) {
            return false
        }
    },
    getByDiscordId: async (id: string) => {
        let result = await client.query("SELECT username, gender, id, system_id FROM users WHERE discord_id = $1", [id])
        if (result.rows.length === 0) {
            return null
        }
        return new User(result.rows[0].username, genderIntToString[result.rows[0].gender], null, id, result.rows[0].id, result.rows[0].system_id)
    },
    getByUsername(username: string, guildId: string, discordIds: string[]) {
        return client.query("SELECT id, guild_id, discord_id, gender, system_id FROM users WHERE " + generateNullableEvaluation("guild_id", 1) + " AND discord_id = ANY($2) AND username = $3", [guildId, discordIds, username])
            .then(y => y.rows.map(x => new User(username, genderIntToString[x.gender], x.guild_id, x.discord_id, x.id, x.system_id)))
    },
    getMembers: async (user: User) => {
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
        user.members = users
        return users
    },
    delete: async (userOrId: User | number) => {
        let id: number
        if (typeof userOrId === "number") {
            id = userOrId
        }
        else {
            id = userOrId.id!
        }
        try {
            await client.query(`with id_of_deleted as (
            DELETE FROM users WHERE id = $1
            returning id
            )
            DELETE FROM relationships
            WHERE (left_user_id = (SELECT id FROM id_of_deleted) OR right_user_id = (SELECT id FROM id_of_deleted))`, [id])
            return true;
        }
        catch (e) {
            return false
        }
    },
    deleteByDiscord: async (discordId: string) =>{
        try {
            await client.query(`with id_of_deleted as (
            DELETE FROM users WHERE discord_id = $1
            returning id
            )
            DELETE FROM relationships
            WHERE (left_user_id = (SELECT id FROM id_of_deleted) OR right_user_id = (SELECT id FROM id_of_deleted))`, [discordId])
            return true;
        }
        catch (e) {
            return false
        }
    },
    update: async (user: User) => {
        try {
            await client.query("UPDATE users SET guild_id = $1, username = $2, discord_id = $3, gender = $4, system_id = $5 WHERE id = $6",
                [user.guildId, user.name, user.discordId, genderStringToInt[user.gender], user.systemId, user.id])
            return true
        }
        catch (e) {
            return false;
        }
    }
}

export const relationships = {
    add: async (relationship: Relationship) => {
        try {
            await client.query("INSERT INTO relationships (relationship_type, left_user_id, right_user_id, guild_id) VALUES ($1, $2, $3, $4)", [relationshipStringToInt[relationship.type], relationship.leftUserId, relationship.rightUserId, relationship.guildId])
            return true
        }
        catch (e) {
            return false
        }
    },
    delete: async (relationship: Relationship) => {
        try {
            await client.query("DELETE FROM relationships WHERE " + generateNullableEvaluation("guild_id", 1) + " AND (left_user_id = $2 AND right_user_id = $3) OR (right_user_id = $2 AND left_user_id = $3)", [relationship.guildId, relationship.rightUserId, relationship.leftUserId])
            return true;
        }
        catch (e) {
            return false;
        }
    },
    getByUsers: async (users: User[]) => {
        let relationshipResults = await client.query("SELECT relationship_type, left_user_id, right_user_id, guild_id FROM relationships WHERE left_user_id = ANY($1) OR right_user_id = ANY($1)", [users.map(x => x.id)])
        let userMap = new Map<number, User>()
        users.forEach(x => {
            userMap.set(x.id!, x)
        })
        return relationshipResults.rows.map(relationship =>
            new Relationship(relationshipIntToString[relationship.relationship_type], userMap.get(relationship.left_user_id)!, userMap.get(relationship.right_username)!, relationship.guild_id));
    }
}

//TODO, fix plz
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