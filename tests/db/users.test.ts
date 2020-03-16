import chaiAsPromised from 'chai-as-promised';
import * as chai from 'chai';
import { users, openDB, genderIntToString } from '../../src/db';
import { Client } from 'pg';
import { User, GuildUser, DiscordUser } from '../../src/User';
import { client } from '../../src';

chai.use(chaiAsPromised)
const assert = chai.assert
let dbclient: Client

before(async () => {
    dbclient = await openDB()
    dbclient.query("DELETE FROM public.users")
})

describe("Database User", () => {
    let name = Math.random().toString(36).substring(4)
    let gender = genderIntToString[Math.floor(Math.random() * Object.getOwnPropertyNames(genderIntToString).length)]
    let guildId = Math.random().toString(36).substring(4)
    let guildUser = new GuildUser(name, gender, null, null, guildId)

    it("can be created", async () => {
        await assert.eventually.isTrue(users.add(guildUser))
        assert.isNotNull(guildUser.id)
        let user = await users.get(guildUser.id!)
        assert.equal(user!.name, name)
        assert.equal(user!.gender, gender)
        assert.equal((user as GuildUser).guildId, guildId)
    })

    it("can be fetched by username", async () => {
        let user = await users.getByUsername(guildUser.name, guildUser.guildId!, [])
        assert.deepEqual(user, [guildUser])
    })
    let discordUser: DiscordUser;
    it("Set discord id", async () => {
        let discordId = Math.random().toString(36).substring(4)
        discordUser = guildUser.toDiscordUser(discordId)
        assert.isTrue(await users.update(discordUser))
    })

    it("Delete by discord id", async () => {
        assert.isTrue(await users.deleteByDiscord(discordUser.discordId!))
        assert.isNull(await users.get(guildUser.id!))
        assert.isNull(await users.get(discordUser.id!))
    })
})

describe("Database System User", () => {
    let name = Math.random().toString(36).substring(4)
    let gender = genderIntToString[Math.floor(Math.random() * Object.getOwnPropertyNames(genderIntToString).length)]
    let guildId = Math.random().toString(36).substring(4)
    let guildUser = new GuildUser(name, gender, null, null, guildId)

})

afterEach(() => {
})
