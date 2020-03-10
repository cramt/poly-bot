import chaiAsPromised from 'chai-as-promised';
import * as chai from 'chai';
import { Client } from 'pg';
import SECRET from '../src/SECRET';
import { openDB } from '../src/db';
import { resolve } from 'dns';

chai.use(chaiAsPromised)
const assert = chai.assert
const client = new Client({
    host: SECRET.DB_HOST,
    user: SECRET.DB_USER,
    password: SECRET.DB_PASSWORD,
    port: parseInt(SECRET.DB_PORT) || 5432,
    database: SECRET.DB_NAME
})

before(async () => {
    await client.connect()
})

describe('Database setup', () => {
    it('Open connection', async () => {
        let testConnectionClient = new Client({
            host: SECRET.DB_HOST,
            user: SECRET.DB_USER,
            password: SECRET.DB_PASSWORD,
            port: parseInt(SECRET.DB_PORT) || 5432,
            database: SECRET.DB_NAME
        })
        assert.isFulfilled(testConnectionClient.connect())
        testConnectionClient.end()
    })
    
    it('Setup schema', async () => {
        await client.query("DROP DATABASE IF EXISTS $1", [SECRET.DB_NAME])
        await client.query("CREATE DATABASE $1", [SECRET.DB_NAME])
        await openDB()
        assert.eventually.equal((await client.query("select schema_version from info")).rows[0].schema_version as number, 0)
    })
})

after(() => process.exit(0))