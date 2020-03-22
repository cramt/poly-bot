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
    await dbClient.query("DELETE FROM public.users")
})

describe('Relationships', () => {

    let testUsers = [
        new GuildUser("Lucca", "FEMME", null, null, "1"),
        new GuildUser("Althea", "FEMME", null, null, "1"),
        new GuildUser("Saskia", "FEMME", null, null, "1"),
        new DiscordUser("Alexandra", "FEMME", null, null, "111111"),
        new DiscordUser("Zoe", "FEMME", null, null, "222222"),
        new DiscordUser("Alma", "FEMME", null, null, "333333")
    ]

    before(async() =>{
        for await (const user of testUsers) {
             users.add(user)
        }
    })

    it('can form a relationship between two valid users', async() => {
        let user1 = await users.getByUsername("Lucca", "1", []).then(x => x[0])
        let user2 = await users.getByUsername("Saskia", "1", []).then(x => x[0])
        let relationship = new Relationship("ROMANTIC", user1!, user2!, "1")
        await assert.isFulfilled(relationships.add(relationship))
        let foundRelationships = await relationships.getByUsers([user1!])
            .then(x => x.filter(y => y.leftUser?.id == user2!.id || y.rightUser?.id == user2!.id))
        assert.equal(foundRelationships.length, 1)
    })

    it('can form relationships between two discord users', async() => {
        let user1 = await users.getByDiscordId(
             (<DiscordUser>testUsers.find(x => x.name === "Alexandra")).discordId
        )
        let user2 = await users.getByDiscordId(
            (<DiscordUser>testUsers.find(x => x.name === "Zoe")).discordId
        )
        let relationship = new Relationship("ROMANTIC", user1!, user2!, "1")
        await assert.isFulfilled(relationships.add(relationship))
        let foundRelationships = await relationships.getByUsers([user1!])
            .then(x => x.filter(y => y.leftUser?.id == user2?.id || y.rightUserId == user2?.id))
        assert.equal(foundRelationships.length, 1)
    })

    it('can form relationships between a discord user and a user', async() => {
        let user1 = await users.getByDiscordId(
            (<DiscordUser>testUsers.find(x => x.name === "Alexandra")).discordId
        )
        let user2 = await users.getByUsername("Lucca", "1", []).then(x => x[0])
        let relationship = new Relationship("SEXUAL", user1!, user2, "1")
        await assert.isFulfilled(relationships.add(relationship))
        let foundRelationships = await relationships.getByUsers([user1!])
            .then(x => x.filter(y => y.leftUserId == user2.id || y.rightUserId == user2.id))
        assert.equal(foundRelationships.length, 1)
    })

    it('can delete an existing relationship', async() => {
        let user1 = await users.getByUsername("Lucca", "1", []).then(x => x[0])
        let user2 = await users.getByDiscordId(
            (<DiscordUser>testUsers.find(x => x.name === "Alma")).discordId
        )
        let relationship = new Relationship("ROMANTIC", user1, user2!, "1")
        await relationships.add(relationship)
        await assert.isFulfilled(relationships.delete(relationship))
        let foundRelationships = await relationships.getByUsers([user1!])
            .then(x => x.filter(y => y.leftUserId == user2?.id || y.rightUserId == user2?.id))
        assert.isEmpty(foundRelationships)
    })

    it('can form multiple relationships of different types between the same two users', async() => {
        let user1 = await users.getByUsername("Lucca", "1", []).then(x => x[0])
        let user2 = await users.getByDiscordId(
            (<DiscordUser>testUsers.find(x => x.name === "Alexandra")).discordId
        )
        let relationship1 = new Relationship("FRIEND", user1, user2!, "1")
        let relationship2 = new Relationship("CUDDLES WITH", user1, user2!, "1")
        await assert.isFulfilled(relationships.add(relationship1))
        await assert.isFulfilled(relationships.add(relationship2))
        let foundRelationships = await relationships.getByUsers([user1])
            .then(x => x.filter(y => y.leftUserId == user2!.id || y.rightUserId == user2!.id))
        assert.equal(foundRelationships.length, 2)
    })

    it('can reject relationships between users that already exist', async() => {
        let user1 = await users.getByDiscordId(
            (<DiscordUser>testUsers.find(x => x.name === "Alma")).discordId
        )
        let user2 = await users.getByUsername("Lucca", "1", []).then(x => x[0])
        let relationship = new Relationship("ROMANTIC", user1!, user2, "1")
        await assert.isFulfilled(relationships.add(relationship))
        await assert.isRejected(relationships.add(relationship))
        let foundRelationships = await relationships.getByUsers([user1!])
            .then(x => x.filter(y => y.leftUserId == user2.id || y.leftUserId == user2.id))
        assert.equal(foundRelationships.length, 1)
    })

    afterEach(async() => {
        await dbClient.query("DELETE FROM relationships")
    })

    after(async() => {
        await dbClient.query("DELETE FROM users")
    })
})

after(async() => {
    await dbClient.end()
})