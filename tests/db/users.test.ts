import chaiAsPromised from 'chai-as-promised';
import * as chai from 'chai';
import {users, openDB, genderIntToString} from '../../src/db';
import {Client} from 'pg';
import {User, GuildUser, DiscordUser} from '../../src/User';
import {client} from '../../src';

chai.use(chaiAsPromised);
const assert = chai.assert;
let dbclient: Client;
const DELETE = "DELETE FROM users";

before(async () => {
    // @ts-ignore
    this.timeout = 10000
    dbclient = await openDB();
    await dbclient.query(DELETE)
});

describe("Database Singlet User", () => {
    let name = Math.random().toString(36).substring(4);
    let gender = genderIntToString[Math.floor(Math.random() * Object.getOwnPropertyNames(genderIntToString).length)];
    let guildId = Math.random().toString(36).substring(4);
    let guildUser = new GuildUser(name, gender, null, null, guildId);
    let discordId = Math.random().toString(36).substring(4);
    let discordUser = new DiscordUser(name, gender, null, null, discordId);

    afterEach(async () => {
        await dbclient.query(DELETE);
        guildUser.id = null;
        discordUser.id = null
    });

    it("can add local user", async () => {
        await assert.eventually.isTrue(users.add(guildUser));
        assert.isNotNull(guildUser.id);
        let user = await users.get(guildUser.id!);
        assert.equal(user!.name, name);
        assert.equal(user!.gender, gender);
        assert.equal((user as GuildUser).guildId, guildId)
    });

    it("can add global user", async () => {
        await assert.eventually.isTrue(users.add(discordUser));
        assert.isNotNull(discordUser.id);
        let user = await users.getByDiscordId(discordUser.discordId);
        assert.equal(user!.name, name);
        assert.equal(user!.gender, gender);
        assert.equal((user as DiscordUser).discordId, discordId)
    });

    it("can be fetched by username", async () => {
        await users.add(guildUser);
        let user = await users.getByUsername(guildUser.name, guildUser.guildId!, []);
        assert.deepEqual(user, [guildUser])
    });

    it("can update discord id", async () => {
        await users.add(guildUser);
        discordUser = guildUser.toDiscordUser(discordId);
        await assert.eventually.isTrue(users.update(discordUser));
        let userResult = await users.getByDiscordId(discordId);
        assert.equal(userResult!.name, name)
    });

    it("can delete by discord id", async () => {
        await users.add(discordUser);
        await assert.eventually.isTrue(users.deleteByDiscord(discordUser.discordId!));
        await assert.eventually.isNull(users.get(guildUser.id!));
        await assert.eventually.isNull(users.get(discordUser.id!))
    })
});

describe("Database System User", () => {
    let name = Math.random().toString(36).substring(4);
    let gender = genderIntToString[Math.floor(Math.random() * Object.getOwnPropertyNames(genderIntToString).length)];
    let guildId = Math.random().toString(36).substring(4);
    let guildUser = new GuildUser(name, gender, null, null, guildId);

    afterEach(async () => {
        await dbclient.query(DELETE);
        guildUser.id = null
    });

    it('can add a system member to a user', async () => {
        await users.add(guildUser);
        let headMate = new GuildUser("headmate", "FEMME", null, guildUser.id, "");
        await assert.eventually.isTrue(users.add(headMate));
        assert.isNotNull(headMate.id)
    }).timeout(10000);

    it('can retrieve a system member by username', async () => {
        await users.add(guildUser);
        let headMate = new GuildUser("headmate", "FEMME", null, guildUser.id, "");
        await users.add(headMate);
        headMate.guildId = guildUser.guildId;
        await assert.eventually.deepEqual(users.getByUsername(headMate.name, guildUser.guildId, []), [headMate])
    }).timeout(10000);
    it('can retrieve all members of system', async () => {
        await users.add(guildUser);
        let headmate_a = new GuildUser("headmate_a", "SYSTEM", null, guildUser.id, guildId);
        headmate_a.system = guildUser;
        await users.add(headmate_a);
        let headmate_a_b = new GuildUser("headmate_a_b", "FEMME", null, headmate_a.id, guildId);
        headmate_a_b.system = headmate_a;
        await users.add(headmate_a_b);
        let headmate_b = new GuildUser("headmate_b", "MASC", null, guildUser.id, guildId);
        headmate_b.system = guildUser;
        await users.add(headmate_b);
        let gotten = await users.get(guildUser.id!);
        await users.getMembers(gotten!);
        assert.deepEqual(gotten, guildUser);
    }).timeout(10000)

});

after(async () => {
    await dbclient.end()
});
