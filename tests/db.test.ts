import chaiAsPromised from 'chai-as-promised';
import * as chai from 'chai';
import { Client } from 'pg';
import SECRET from '../src/SECRET';
import { openDB, setupSchema } from '../src/db';
import * as fs from "fs"

chai.use(chaiAsPromised)
const assert = chai.assert

const dbConfig = {
    host: SECRET.DB_HOST,
    user: SECRET.DB_USER,
    password: SECRET.DB_PASSWORD,
    port: parseInt(SECRET.DB_PORT) || 5432,
    database: SECRET.DB_NAME
}

describe('Database setup', () => {
    let client: Client
    it('Open connection', async () => {
        client = new Client(dbConfig)
        await client.connect();
    })

    it("Test connection", async () => {
        const string = Math.random().toString(36).substring(4);
        assert.eventually.equal(client.query("SELECT $1", [string]).then(x => x.rows[0]["?column?"]), string)
    })

    it('Reset database', async () => {
        try {
            await client.query(`SELECT pid, pg_terminate_backend(pid) 
            FROM pg_stat_activity 
            WHERE datname = current_database() AND pid <> pg_backend_pid();`)
            if (await (await client.query("SELECT 1 FROM pg_database WHERE datname = '_'")).rowCount === 0) {
                await client.query("CREATE DATABASE _");
            }
            await client.end();
            const thisDbConfig = JSON.parse(JSON.stringify(dbConfig)) as typeof dbConfig
            thisDbConfig.database = "_"
            client = new Client(thisDbConfig)
            await client.connect();

            await client.query("REVOKE CONNECT ON DATABASE " + SECRET.DB_NAME + " FROM public");
            await client.query("SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '" + SECRET.DB_NAME + "';");
            await client.query("DROP DATABASE IF EXISTS " + SECRET.DB_NAME)
            await client.query("CREATE DATABASE " + SECRET.DB_NAME)
            await client.end()
            client = new Client(dbConfig)
            await client.connect()
            await client.query("DROP DATABASE IF EXISTS _")
        }
        catch (e) { console.log(e) }

        assert.eventually.deepEqual(client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'").then(x => x.rows), [])
    })

    it("Schema setup", async () => {
        await setupSchema(client)
        assert.eventually.equal(client.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'info'").then(x => x.rows[0].count), "1")
    })
})

after(() => process.exit(0))