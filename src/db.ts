import { Client, ClientConfig } from 'pg'
import SECRET from './SECRET';
import { Gender, User, constructUser, DiscordUser, GuildUser } from './User';
import { Relationship, RelationshipType } from './Relationship';
import * as fs from "fs"

let client: Client;

const numberSqlRegex = /[1-9][0-9]*\.sql/.compile()

export function getMaxMigrationFiles(dir: string[]) {
    let ids = dir.filter(x => numberSqlRegex.test(x)).map(x => parseInt(x.split(".")[0])).sort();
    ids.forEach((x, i) => {
        if (x !== i) {
            throw new Error("there is no " + x + ".sql migration, even thou higher numbers of migrations exists")
        }
    })
    if (ids.length === 0) {
        return -1;
    }
    return ids[ids.length - 1];
}

export async function setupSchema(dbClient = client) {
    let [currentVersion, maxMigrations] = await Promise.all([
        (async () => {

            let result = (await dbClient.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'info'"));
            let val = -1
            if (result.rows[0].count !== "0") {
                try {
                    val = (await dbClient.query("select schema_version from info")).rows[0].schema_version as number
                }
                catch (e) {

                }
            }
            return val


        })(),
        fs.promises.readdir("migrations").then(x => getMaxMigrationFiles(x))
    ])
    if (currentVersion >= maxMigrations) {
        return;
    }
    let q: Promise<string>[] = []
    for (let i = currentVersion + 1; i <= maxMigrations; i++) {
        q.push(fs.promises.readFile("migrations/" + i + ".sql").then(x => x.toString()))
    }
    await dbClient.query((await Promise.all(q)).join("\r\n\r\n"))
    if ((await dbClient.query("UPDATE public.info SET schema_version = $1 RETURNING *", [maxMigrations])).rows.length === 0) {
        await dbClient.query("INSERT INTO public.info (schema_version) values ($1)", [maxMigrations])
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
    return client
}

export const genderStringToInt: {
    [P in Gender]: number
} = {
    "FEMME": 0,
    "MASC": 1,
    "NEUTRAL": 2,
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
    get: async (id: number) => {
        let result = await client.query(`
        SELECT * FROM ((SELECT discord_id, guild_id FROM users WHERE id = get_topmost_system($1)) s
        CROSS JOIN
        (SELECT username, gender, system_id FROM users WHERE id = $1) m)`, [id])
        if (result.rows.length === 0) {
            return null
        }
        return constructUser(result.rows[0].username, genderIntToString[result.rows[0].gender], result.rows[0].guild_id, result.rows[0].discord_id, id, result.rows[0].system_id)
    },
    add: async (user: User) => {
        let toAdd: User[] = []
        function rec(user: User) {
            if (user.id !== null) {
                return;
            }
            toAdd.push(user)
            if (user.system !== null) {
                rec(user.system)
            }
        }
        rec(user)
        if (toAdd.length === 0) {
            return true
        }
        toAdd = toAdd.reverse();
        let props: any[] = []
        let index = 1;
        let query = toAdd.map((x, i, arr) => {
            let guildId: string | null = null
            let discordId: string | null = null
            if (x instanceof DiscordUser) {
                discordId = x.discordId
            }
            else if (x instanceof GuildUser) {
                guildId = x.guildId
            }
            if (x.systemId === null) {
                props.push(guildId)
                props.push(discordId)
            }
            else {
                props.push(null)
                props.push(null)
            }
            props.push(x.name)
            props.push(genderStringToInt[x.gender])
            let q = "INSERT INTO users (guild_id, discord_id, username, gender, system_id) VALUES ($" + (index++) + ", $" + (index++) + ", $" + (index++) + ", $" + (index++);
            if (i === 0) {
                q += ", $" + (index++) + ")"
                props.push(x.systemId)
            }
            else {
                q += ", (SELECT id FROM u" + i + "))"
            }
            q += " RETURNING id"
            i++;
            if (i !== arr.length) {
                q = "WITH u" + i + " as (" + q + ")"
            }
            return q
        }).join("\r\n\r\n")

        try {
            let result = await client.query(query, props)
            user.id = result.rows[0].id
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
        return constructUser(result.rows[0].username, genderIntToString[result.rows[0].gender], null, id, result.rows[0].id, result.rows[0].system_id)
    },
    getByUsername(username: string, guildId: string, discordIds: string[]) {
        return client.query("SELECT id, guild_id, discord_id, gender, system_id FROM users WHERE (" + generateNullableEvaluation("guild_id", 1) + " OR discord_id = ANY($2)) AND username = $3", [guildId, discordIds, username])
            .then(y => y.rows.map(x => constructUser(username, genderIntToString[x.gender], x.guild_id, x.discord_id, x.id, x.system_id)))
    },
    getMembers: async (user: User) => {
        let userResults = await client.query(`
        WITH RECURSIVE members AS (
            SELECT username, gender, system_id, id FROM users
            WHERE system_id = $1
            UNION 
                SELECT u.username, u.gender, u.system_id, u.id FROM users u
                INNER JOIN members m ON m.id = u.system_id
        ) SELECT username, gender, system_id, id FROM members 
    `, [user.id])
        let guildId: string | null = null;
        let discordId: string | null = null;
        if (user instanceof GuildUser) {
            guildId = user.guildId;
        }
        else if(user instanceof DiscordUser){
            discordId = user.discordId;
        }
        let users = userResults.rows.map(x => constructUser(x.username, genderIntToString[x.gender], guildId, discordId, x.id, x.system_id))
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
            await client.query(`DELETE FROM users WHERE id = $1`, [id])
            return true;
        }
        catch (e) {
            return false
        }
    },
    deleteByDiscord: async (discordId: string) => {
        try {
            await client.query(`DELETE FROM users WHERE discord_id = $1`, [discordId])
            return true;
        }
        catch (e) {
            return false
        }
    },
    update: async (user: User) => {
        let guildId: string | null = null
        let discordId: string | null = null
        if (user instanceof DiscordUser) {
            discordId = user.discordId
        }
        else if (user instanceof GuildUser) {
            guildId = user.guildId
        }
        try {
            await client.query("UPDATE users SET guild_id = $1, username = $2, discord_id = $3, gender = $4, system_id = $5 WHERE id = $6",
                [guildId, user.name, discordId, genderStringToInt[user.gender], user.systemId, user.id])
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
        let relationshipResults = await client.query(`SELECT relationships.relationship_type, relationships.left_user_id, relationships.right_user_id, relationships.guild_id as rel_guild_id,
        users.username, users.gender, users.discord_id, users.guild_id as u_guild_id, users.id as user_id, users.system_id FROM relationships
        LEFT JOIN users ON relationships.left_user_id = users.id OR relationships.right_user_id = users.id
        WHERE (relationships.left_user_id = ANY($1) OR relationships.right_user_id = ANY($1)) AND users.id != ANY($1)`, [users.map(x => x.id)])
        let userMap = new Map<number, User>()
        users.forEach(x => {
            userMap.set(x.id!, x)
        })
        relationshipResults.rows.forEach(x => {
            if (x.user_id !== null) {
                let u = constructUser(x.username, genderIntToString[x.gender], x.u_guild_id, x.discord_id, x.user_id, x.system_id)
                userMap.set(u.id!, u)
            }
        })
        return relationshipResults.rows.map(relationship =>
            new Relationship(relationshipIntToString[relationship.relationship_type], userMap.get(relationship.left_user_id)!, userMap.get(relationship.right_user_id)!, relationship.rel_guild_id));
    }
}

export const polymapCache = {
    get: async (guildId: string) => {
        let result = await client.query("SELECT data FROM polymap_cache WHERE guild_id = $1", [guildId])
        if (result.rows.length === 0) {
            return null;
        }
        return result.rows[0].data as Buffer
    },
    set: async (data: Buffer, discordIds: string[], guildId: string) => {
        try {
            await client.query("INSERT INTO polymap_cache (data, discord_ids, guild_id) VALUES ($1, $2, $3)", [data, discordIds, guildId])
            return true;
        }
        catch (e) {
            return false
        }
    },
    invalidate: async (guildId: string) => {
        try {
            await client.query("DELETE FROM polymap_cache WHERE guild_id = $1", [guildId])
            return true;
        }
        catch (e) {
            return false;
        }
    }
}

export async function getAllInGuild(guildId: string, discordIds: string[]): Promise<{ relationships: Relationship[], users: User[] }> {
    const result = await client.query(`SELECT 
    r.relationship_type, r.guild_id as rguild_id, 
    u1.username as username1, u2.username as username2,
    u1.id as id1, u2.id as id2,
    u1.gender as gender1, u2.gender as gender2,
    (SELECT guild_id FROM users WHERE id = get_topmost_system(u1.id)) as guild_id1,
    (SELECT guild_id FROM users WHERE id = get_topmost_system(u2.id)) as guild_id2,
    u1.system_id as system_id1, u2.system_id as system_id2,
    (SELECT discord_id FROM users WHERE id = get_topmost_system(u1.id)) as discord_id1,
    (SELECT discord_id FROM users WHERE id = get_topmost_system(u2.id)) as discord_id2,
    r.left_user_id, r.right_user_id
    
    FROM users u1
    INNER JOIN relationships r
    ON r.left_user_id = u1.id
    INNER JOIN users u2
    ON r.right_user_id = u2.id WHERE 
    (
        (SELECT discord_id FROM users WHERE id = get_topmost_system(u1.id)) = ANY($1)
        AND
        (SELECT discord_id FROM users WHERE id = get_topmost_system(u2.id)) = ANY($1)
    )
    OR
    (
        (SELECT discord_id FROM users WHERE id = get_topmost_system(u1.id)) = ANY($1)
        AND
        (SELECT guild_id FROM users WHERE id = get_topmost_system(u2.id)) = $2
    )
    OR
    (
        (SELECT guild_id FROM users WHERE id = get_topmost_system(u1.id)) = $2
        AND
        (SELECT guild_id FROM users WHERE id = get_topmost_system(u2.id)) = $2
    )
    OR
    (
        (SELECT guild_id FROM users WHERE id = get_topmost_system(u1.id)) = $2
        AND
        (SELECT discord_id FROM users WHERE id = get_topmost_system(u2.id)) = ANY($1)
    );`, [discordIds, guildId]);
    let userMap = new Map<number, User>();
    let relationships: Relationship[] = [];
    result.rows.forEach(x => {
        let left: User;
        if (userMap.has(x.id1)) {
            left = userMap.get(x.id1)!
        }
        else {
            left = constructUser(x.username1, genderIntToString[x.gender1], x.guild_id1, x.discord_id1, x.id1, x.system_id1)
            userMap.set(left.id!, left);
        }
        let right: User;
        if (userMap.has(x.id2)) {
            right = userMap.get(x.id2)!
        }
        else {
            right = constructUser(x.username2, genderIntToString[x.gender2], x.guild_id2, x.discord_id2, x.id2, x.system_id2)
            userMap.set(right.id!, right);
        }
        relationships.push(new Relationship(relationshipIntToString[x.relationship_type], left, right, x.rguild_id))
    })
    let users = Array.from(userMap.values())
    users.forEach(x => {
        if (x.systemId !== null) {
            let system = userMap.get(x.systemId);
            if (system) {
                x.system = system
            }
        }
    })
    return {
        users: users,
        relationships: relationships
    }
}