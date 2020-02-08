import { Client } from 'pg'
import SECRET from './SECRET';
import { Gender, User } from './User';
import { Relationship, RelationshipType } from './Relationship';

let client: Client;
export async function openDB() {
    client = new Client({
        host: SECRET.DB_HOST,
        user: SECRET.DB_USER,
        password: SECRET.DB_PASSWORD,
        port: parseInt(SECRET.DB_PORT),
        database: SECRET.DB_NAME
    });
    await client.connect()
}

const genderStringToInt: {
    [P in Gender]: number
} = {
    "FEMME": 0,
    "MASC": 1,
    "NEUTER": 2,
    "SYSTEM": 3,
}

const genderIntToString: {
    [key: number]: Gender
} = Object.getOwnPropertyNames(genderStringToInt).reduce((curr, acc) => {
    (curr as any)[genderStringToInt[acc as Gender]] = acc
    return curr;
}, {})

const relationshipStringToInt: {
    [P in RelationshipType]: number
} = {
    "ROMANTIC": 0,
    "SEXUAL": 1,
    "FRIEND": 2,
    "LIVES WITH": 3,
    "IN SYSTEM WITH": 4,
    "CUDDLES WITH": 5
}

const relationshipIntToString: {
    [key: number]: RelationshipType
} = Object.getOwnPropertyNames(relationshipStringToInt).reduce((curr, acc) => {
    (curr as any)[relationshipStringToInt[acc as RelationshipType]] = acc
    return curr
}, {})

export async function createNewUser(user: User): Promise<boolean> {
    try {
        await client.query("INSERT INTO users (guild_id, username, discord_id, gender) VALUES ($1, $2, $3, $4)", [user.guildId, user.name, user.discordId, genderStringToInt[user.gender]])
        return true
    }
    catch (e) {
        return false
    }
}

export async function createNewRelationship(relationship: Relationship): Promise<void> {
    await client.query("INSERT INTO relationships (relationship_type, left_username, right_username, guild_id) VALUES ($1, $2, $3, $4)", [relationshipStringToInt[relationship.type], relationship.leftUser.name, relationship.rightUser.name, relationship.guildId])
}

export async function removeRelationship(guildId: string, leftUsername: string, rightUsername: string): Promise<void> {
    await client.query("DELETE FROM relationships WHERE guild_id = $1 AND left_username = $2 AND right_username = $3", [guildId, leftUsername, rightUsername])
}



export async function getUserByDiscordId(guildId: string, discordId: string): Promise<User | null> {
    let result = await client.query("SELECT username, gender FROM users WHERE guild_id = $1 AND discord_id = $2", [guildId, discordId])
    if (result.rows.length === 0) {
        return null
    }
    return new User(result.rows[0].username, genderIntToString[result.rows[0].gender], guildId, discordId)
}

export async function getUserByUsername(guildId: string, username: string): Promise<User | null> {
    let result = await client.query("SELECT gender, discord_id FROM users WHERE guild_id = $1 AND LOWER(username) = LOWER($2)", [guildId, username])
    if (result.rows.length === 0) {
        return null
    }
    return new User(username, genderIntToString[result.rows[0].gender], guildId, result.rows[0].discord_id)
}


//probably doesnt work
export async function getRelationshipsByDiscordId(guildId: string, discordId: string): Promise<Relationship[]> {
    let result = await client.query(
        `SELECT type, left_username, right_username FROM relationship
        FULL OUTER JOIN users ON (relationship.left_username = users.username OR relationship.right_username = users.username)
        WHERE relationship.guild_id = $1 AND users.guild_id = $1
          (right_username = (SELECT username FROM users WHERE users.guild_id = $1 AND users.discord_id = $2) 
          OR left_username = (SELECT username FROM users WHERE users.guild_id = $1 AND users.discord_id = $2))`
        , [guildId, discordId])
    return []
}

export async function getAllInGuild(guildId: string): Promise<{ relationships: Relationship[], users: User[] }> {
    let [relationshipResults, userResults] = await Promise.all([
        client.query("SELECT relationship_type, left_username, right_username FROM relationships WHERE guild_id = $1", [guildId]),
        client.query("SELECT username, discord_id, gender FROM users WHERE guild_id = $1", [guildId])])
    let users = userResults.rows.map(user => new User(user.username, genderIntToString[user.gender], guildId, user.discord_id))
    let userMap = new Map<string, User>()
    users.forEach(x => {
        userMap.set(x.name, x)
    })
    let relationships = relationshipResults.rows.map(relationship =>
        new Relationship(relationshipIntToString[relationship.relationship_type], userMap.get(relationship.left_username)!, userMap.get(relationship.right_username)!, guildId));
    return {
        relationships: relationships,
        users: users
    }
}