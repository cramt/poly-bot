import chaiAsPromised from 'chai-as-promised';
import * as chai from 'chai';
import { users, openDB, genderIntToString } from '../../src/db';
import { User, GuildUser } from '../../src/User';

chai.use(chaiAsPromised)
const assert = chai.assert

before(async () => {
    await openDB()
})

describe("Database User", () => {
    let name = Math.random().toString(36).substring(4)
    let gender = genderIntToString[Math.floor(Math.random() * Object.getOwnPropertyNames(genderIntToString).length)]
    let guild = Math.random().toString(36).substring(4)
    let guildUser = new GuildUser(name, gender, null, null, guild)

    it("Create user", async () => {
        await assert.eventually.isTrue(users.add(guildUser))
        assert.isNotNull(guildUser.id)
    })

    it("Get by username", async () => {
        assert.deepEqual(await users.getByUsername(guildUser.name, guildUser.guildId!, []), [guildUser])
    })

    let discord = Math.random().toString(36).substring(4)

    let discordUser = guildUser.toDiscordUser(discord)

    it("Set discord id", async () => {
        assert.isTrue(await users.update(discordUser))
    })

    it("Delete by discord id", async () => {
        assert.isTrue(await users.deleteByDiscord(discordUser.discordId!))
        assert.isNull(await users.get(guildUser.id!))
        assert.isNull(await users.get(discordUser.id!))
    })
})

afterEach(() => {
    
})

after(() => process.exit(0))