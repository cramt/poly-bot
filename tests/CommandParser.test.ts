import chaiAsPromised from 'chai-as-promised';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as PolyUser from '../src/User'
import { User, Guild, Collection as DisordCollection } from 'discord.js';
import * as Commands from '../src/commands';
import * as CommandParser from '../src/Command';
import { client } from '../src/index';
import { users } from '../src/db';
import { ArgumentError } from '../src/Command';
import { createSinonStubInstance } from './SinonStubbedInstance';
import * as util from '../src/utilities'

var cmd = Commands.commands;
chai.use(chaiAsPromised)
const assert = chai.assert

describe('Number Arguments', () => {
    it('can reject invalid numbers', async() => {
        await assert.isRejected(new CommandParser.NumberArgument().parse({
            content: "hello there",
            channel: null as any,
            guild: null as any,
            author: null as any
        }).then(x => x.value), CommandParser.ArgumentError)
    })
    it('accept valid numbers', async() => {
        await assert.eventually.equal(new CommandParser.NumberArgument().parse({
            content: "4",
            channel: null as any,
            guild: null as any,
            author: null as any
        }).then(x => x.value), 4)
    })
})

describe('Any Arguments', async() => {

    it('can return the contents of an argument', async() => {
        await assert.eventually.equal(new CommandParser.AnyArgument().parse({
            content: "argument",
            channel: null as any,
            guild: null as any,
            author: null as any
        }).then(x => x.value), "argument")
    })
})

describe('User Arguments', () => {

    let inputguild = createSinonStubInstance(Guild)
    inputguild.members = new DisordCollection()

    let testUsers = [
        new PolyUser.GuildUser("test1", "FEMME", null, null, "1111"),
        new PolyUser.DiscordUser("test2", "NEUTRAL", null, null, "111111"),
        new PolyUser.DiscordUser("test2", "FEMME", null, null, "111112"),
        new PolyUser.GuildUser("test3", "MASC", null, null, "2222")
    ]

    beforeEach(() => {
        sinon.stub(users, "getByUsername").callsFake(async(username: string, guildId: string, discordIds: string[]) => {
            
            let foundUsers = []
            for (let i = 0; i < testUsers.length; i++) {
                if (testUsers[i].name === username) {
                    foundUsers.push(testUsers[i])
                }
            }
            
            
            if (foundUsers.length > 0) {
                return foundUsers
            }
            else {
                throw new ArgumentError("there are no users with that argument", new CommandParser.UserArgument())
            }
        })
    })

    it('can retrieve a user', async() => {
        await assert.isFulfilled(new CommandParser.UserArgument().parse({
            content: "test1",
            channel: null as any,
            guild: inputguild,
            author: null as any
        }).then(x => assert.deepEqual(x.value.name, "test1")))

        await assert.isFulfilled(new CommandParser.UserArgument().parse({
            content: "test3",
            channel: null as any,
            guild: inputguild,
            author: null as any
        }).then(x => assert.deepEqual(x.value.name, "test3")))           
    })

    it('can reject non-existent users', async() => {
        await assert.isRejected(new CommandParser.UserArgument().parse({
            content: "test4",
            channel: null as any,
            guild: inputguild,
            author: null as any
        }))
    })

    

    it('can accept correct results from requests for more data', async() => {
        sinon.stub(util, "discordRequestChoice").returns(new Promise((resolve => resolve(testUsers[1]))))
        await assert.isFulfilled(new CommandParser.UserArgument().parse({
            content: "test2",
            channel: null as any,
            guild: inputguild,
            author: null as any
        }).then(x => assert.deepEqual(x.value.gender, "NEUTRAL")))
    })

    it('can handle rejection of requests for more data', async() => {
        sinon.stub(util, "discordRequestChoice").returns(new Promise((reject => reject())))
        await assert.isRejected(new CommandParser.UserArgument().parse({
            content: "test2",
            channel: null as any,
            guild: inputguild,
            author: null as any
        }))
    })

    

    afterEach(() => {
        sinon.restore()
    })
})

describe('Discord User Arguments', () => {
    let user = new User(client, {
        id: "138790334896275455",
        username: "test user",
        discriminator: "#0000"
    })
    

    beforeEach(() => {
        sinon.stub(client, "fetchUser").returns(new Promise((resolve) => resolve(user)))
    })

    it('can accept discord users', async() => {
        let userArgument = {
            content: "<@138790334896275456>",
            channel: null as any,
            guild: null as any,
            author: null as any
        }
        await assert.isFulfilled(new CommandParser.DiscordUserArgument().parse(userArgument))
    })

    it('can reject invalid discord users', async() => {
        let userArgument = {
            content: "invalid argument",
            channel: null as any,
            guild: null as any,
            author: null as any
        }
        await assert.isRejected(new CommandParser.DiscordUserArgument().parse(userArgument))
    })

    afterEach(() => sinon.restore())
})

describe('Specific Arguments', () => {
    let arg = new CommandParser.SpecificArgument("1", "2", "3")
    it('can accept arguments that match one element', () => {
        assert.isFulfilled(arg.parse({
            content: "1",
            channel: null as any,
            guild: null as any,
            author: null as any
        }))
    })

    it('can reject arguments that match neither element', () => {
        assert.isRejected(arg.parse({
            content: "4",
            channel: null as any,
            guild: null as any,
            author: null as any
        }))
    })
})

describe('String Excluded Arguments', () => {
    let arg = new CommandParser.StringExcludedArgument("excluded")
    it('can reject arguments with excluded string', () => {
        assert.isRejected(arg.parse({
            content: "excluded",
            channel: null as any,
            guild: null as any,
            author: null as any
        }), CommandParser.ArgumentError)
    })

    it('can accept string arguments that do not contain excluded string', () => {
        assert.isFulfilled(arg.parse({
            content: "included",
            channel: null as any,
            guild: null as any,
            author: null as any
        }))
    })
})

describe('Or Arguments', () => {



    it('can accept either of defined type of argument', async() => {
        sinon.stub(CommandParser, "UserArgument")
        sinon.stub(CommandParser, "DiscordUserArgument")
        let arg = new CommandParser.OrArgument(new CommandParser.UserArgument(), new CommandParser.DiscordUserArgument())
        await assert.isFulfilled(arg.parse({
            content: "<@123456>",
            channel: null as any,
            guild: null as any,
            author: null as any
        }))
    })

    it('can reject both argument types are rejected', async() => {
        
        let userArg = createSinonStubInstance(CommandParser.UserArgument)
        userArg.parse.throws(new ArgumentError("", userArg))

        let discordUserArg = createSinonStubInstance(CommandParser.UserArgument)
        discordUserArg.parse.throws(new ArgumentError("", discordUserArg))

        let arg = new CommandParser.OrArgument(userArg, discordUserArg)
        await assert.isRejected(arg.parse({
            content: "1",
            channel: null as any,
            guild: null as any,
            author: null as any
        }))
    })

    afterEach(() => sinon.restore())
})

