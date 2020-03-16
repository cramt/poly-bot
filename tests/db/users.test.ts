import chaiAsPromised from 'chai-as-promised';
import * as chai from 'chai';
import { users, openDB } from '../../src/db';
import { User } from '../../src/User';
import { rejects } from 'assert';

chai.use(chaiAsPromised)
const assert = chai.assert
let testUser = new User("Person McPersonface", "NEUTER", "123", null, null, null)

before(async () => {
    await openDB()
    await users.add(testUser)
})

beforeEach(async () => {
    await users.add(testUser)
})

describe("Database User", () => {
    it("Create user", async () => {
        let user = new User("TestCreateUser", "NEUTER", "124", null, null, null)
        return new Promise((resolve, reject) =>{
            assert.eventually.isTrue(users.add(user))
            assert.isNotNull(user.id)
            resolve()
        }) 
        .catch((e) => {
            console.error(e)
            assert.fail()
        });
    })

    it("Get by username", async () => {

        return users.getByUsername("Person McPersonface", "123"!, [])
        .then((res) => {
            assert.deepEqual(res, [testUser])
        });
    })

    it("Set discord id", async () => {
        testUser.discordId = "123"
        testUser.guildId = null
        assert.isTrue(await users.update(testUser))
    })

    it("Delete by discord id", async () => {
        assert.isTrue(await users.deleteByDiscord(testUser.discordId!))
        assert.isNull(await users.get(testUser.id!))
    })
})

afterEach(() => {
    
})

after(() => process.exit(0))