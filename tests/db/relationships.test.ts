import chaiAsPromised from 'chai-as-promised';
import * as chai from 'chai';
import { Client } from 'pg';
import { relationships, openDB, users } from '../../src/db';
import { GuildUser, DiscordUser, User } from '../../src/User';
import { Relationship } from '../../src/Relationship';

chai.use(chaiAsPromised)
const assert = chai.assert;

let dbClient: Client

before(async() => {
    dbClient = await openDB()
    //TODO: clear database of users and relationships without making it hang
    //await dbClient.query("DELETE FROM relationships")
    //await dbClient.query("DELETE FROM users")
})

describe('Relationships', () => {
    before(async() =>{
        await users.add(new GuildUser("Lucca", "FEMME", null, null, "1"))
        await users.add(new GuildUser("Zoe", "FEMME", null, null, "1"))
        await users.add(new DiscordUser("Alexandra", "FEMME", null, null, "11111111"))
        await users.add(new DiscordUser("Zoe", "NEUTRAL", null, null, "222222"))
    })

    it('can form a relationship between two valid users', async() => {
        let user1 = await users.getByUsername("Lucca", "1", []).then(x => x[0])
        let user2 = await users.getByUsername("Alexandra", "1", ["11111111"]).then(x => x[0])
        let relationship = new Relationship("SEXUAL", user1, user2, "1")
        await relationships.add(relationship)
        let foundRelationships = await relationships.getByUsers([user1])
            .then(x => x.filter(y => y.leftUser?.id == user2.id || y.rightUser?.id == user2.id))
        assert.equal(foundRelationships.length, 1)
    })

    it('can form relationships between two discord users', async() => {
        let user1 = await users.getByDiscordId("11111111")
        let user2 = await users.getByDiscordId("222222")
        let relationship = new Relationship("ROMANTIC", user1!, user2!, "1")
        await relationships.add(relationship)
        let foundRelationships = await relationships.getByUsers([user1!])
            .then(x => x.filter(y => y.leftUser?.id == user2?.id || y.rightUserId == user2?.id))
        assert.equal(foundRelationships.length, 1)
    })

    it('can form relationships between a discord user and a user', async() => {
        let user1 = await users.getByDiscordId("11111111")
        let user2 = await users.getByUsername("Zoe", "1", ["11111111, 222222"]).then(x => x[0])
        let relationship = new Relationship("ROMANTIC", user1!, user2, "1")
        await relationships.add(relationship)
        let foundRelationships = await relationships.getByUsers([user1!])
            .then(x => x.filter(y => y.leftUserId == user2.id || y.rightUserId == user2.id))
        assert.equal(foundRelationships.length, 1)
    })

    it('can form multiple relationships of different types between the same two users', () => {
        //TODO
        assert.fail()
    })

    it('can reject relationships between users that already exist', () => {
        //TODO
        assert.fail()
    })
})

after(async() => {
    await dbClient.end()
})