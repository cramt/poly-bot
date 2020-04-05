import chaiAsPromised from 'chai-as-promised';
import * as chai from 'chai';
import {Client} from 'pg';
import {openDB, setupSchema, users} from '../../src/db';
import * as fs from "fs"
import {User} from '../../src/User';
import secret from "../../src/secret";

chai.use(chaiAsPromised);
const assert = chai.assert;

const dbConfig = {
    host: secret.DB.HOST,
    user: secret.DB.USER,
    password: secret.DB.PASSWORD,
    port: secret.DB.PORT,
    database: secret.DB.NAME
};

describe('Database setup', () => {
    let client: Client;
    it('can open connection', async () => {
        client = new Client(dbConfig);
        return client.connect()
            .catch((e) => {
                console.error(e);
                assert.fail()
            });
    });

    it("can test the connection", async () => {
        const string = Math.random().toString(36).substring(4);
        return client.query("SELECT $1", [string]).then(x => x.rows[0]["?column?"])
            .then((x) => {
                assert.equal(x, string)
            })
            .catch((e) => {
                console.error(e);
                assert.fail()
            })
    });

    it("can reset the database", async () => {
        await client.query(`SELECT pid, pg_terminate_backend(pid)
                            FROM pg_stat_activity
                            WHERE datname = current_database()
                              AND pid <> pg_backend_pid();`);
        if ((await client.query("SELECT 1 FROM pg_database WHERE datname = '_'")).rowCount === 0) {
            await client.query("CREATE DATABASE _");
        }
        await client.end();
        const thisDbConfig = JSON.parse(JSON.stringify(dbConfig)) as typeof dbConfig;
        thisDbConfig.database = "_";
        client = new Client(thisDbConfig);
        await client.connect()
            .catch((e) => console.error(e));

        await client.query("REVOKE CONNECT ON DATABASE " + secret.DB.NAME + " FROM public");
        await client.query("SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '" + secret.DB.NAME + "';");
        await client.query("DROP DATABASE IF EXISTS " + secret.DB.NAME);
        await client.query("CREATE DATABASE " + secret.DB.NAME);
        await client.end();
        client = new Client(dbConfig);
        await client.connect();
        await client.query("DROP DATABASE IF EXISTS _");

        return client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'").then(x => {
            assert.deepEqual(x.rows, [])
        })
            .catch((e) => {
                console.error(e);
                assert.fail()
            });
    });

    it("can setup the schema for an empty database", async () => {
        await setupSchema(client)
            .catch((e) => {
                console.error(e);
                assert.fail()
            });

        return client.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'info'").then((x) => {
            assert.equal(x.rows[0].count, "1")
        })
            .catch((e) => {
                console.error(e);
                assert.fail()
            });
    });

    after(async () => {
        await client.end()
    })
});
