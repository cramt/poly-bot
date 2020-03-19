import chaiAsPromised from 'chai-as-promised';
import * as chai from 'chai';
import { Client } from 'pg';
import SECRET from '../../src/SECRET';
import { relationships, openDB, users } from '../../src/db';
import { GuildUser, DiscordUser, User } from '../../src/User';
import { Relationship } from '../../src/Relationship';

chai.use(chaiAsPromised)
const assert = chai.assert;

let dbClient: Client


describe('Relationships', () => {
    before(async() =>{
        dbClient = await openDB()
        await users.add(new GuildUser("Lucca", "FEMME", null, null, "1"))
        await users.add(new GuildUser("Zoe", "FEMME", null, null, "1"))
        await users.add(new DiscordUser("Alexandra", "FEMME", null, null, "11111111"))
        await users.add(new DiscordUser("Zoe", "NEUTRAL", null, null, "222222"))
    })

    it('can form a relationship between two valid users', async() => {
        let user1 = await users.getByUsername("Lucca", "1", []).then(x => x[0])
        let user2 = await users.getByUsername("Alexandra", "1", ["11111111"]).then(x => x[0])
        let relationship = new Relationship("SEXUAL", user1, user2, "1")
        relationships.add(relationship)
        let foundRelationship = await relationships.getByUsers([user1, user2]).then(x => x[0])
        assert.deepEqual(foundRelationship, relationship)
    })

    afterEach(() => {
        dbClient.query("DELETE FROM public.relationships")
        dbClient.query("DELETE FROM public.users")
    })
})