import chaiAsPromised from 'chai-as-promised';
import * as chai from 'chai';
import { users, openDB, genderIntToString } from '../../src/db';
import { User } from '../../src/User';

chai.use(chaiAsPromised)
const assert = chai.assert

before(async () => {
    await openDB()
})

describe("Database User", () => {
    let name = Math.random().toString(36).substring(4)
    let gender = genderIntToString[Math.floor(Math.random() * Object.getOwnPropertyNames(genderIntToString).length)]
    let guild = Math.random().toString(36).substring(4)
    let user = new User(name, gender, guild, null, null, null)

    it("Create user", async () => {
        await assert.eventually.isTrue(users.add(user))
        assert.isNotNull(user.id)
    })

    it("Get by username", async () => {
        assert.deepEqual(await users.getByUsername(user.name, user.guildId!, []), [user])
    })

    let discord = Math.random().toString(36).substring(4)

    it("Set discord id", async () => {
        user.discordId = discord
        user.guildId = null
        assert.isTrue(await users.update(user))
    })

    it("Delete by discord id", async () => {
        assert.isTrue(await users.deleteByDiscord(user.discordId!))
        assert.isNull(await users.get(user.id!))
    })
})

after(() => process.exit(0))