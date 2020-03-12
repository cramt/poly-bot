import chaiAsPromised from 'chai-as-promised';
import * as chai from 'chai';
import { users, openDB } from '../../src/db';
import { User } from '../../src/User';

chai.use(chaiAsPromised)
const assert = chai.assert

describe("Database User", () => {
    it("Open connection", async () => {
        await openDB()
    })
    let user = new User("Person McPersonface", "NEUTER", "123", null, null, null)

    it("Create user", async () => {
        await assert.eventually.isTrue(users.add(user))
        assert.isNotNull(user.id)
    })

    it("Get by username", async () => {
        assert.deepEqual(await users.getByUsername(user.name, user.guildId!, []), [user])
    })

    it("Set discord id", async () => {
        user.discordId = "123"
        user.guildId = null
        assert.isTrue(await users.update(user))
    })

    it("Delete by discord id", async () => {
        assert.isTrue(await users.deleteByDiscord(user.discordId!))
        assert.isNull(await users.get(user.id!))
    })
})

after(() => process.exit(0))