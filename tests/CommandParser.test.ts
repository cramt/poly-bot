import chaiAsPromised from 'chai-as-promised';
import * as chai from 'chai';
import * as sinon from 'sinon';
import {User} from 'discord.js';
import * as Commands from '../src/commands';
import * as CommandParser from '../src/Command';
import {client} from '../src/index';

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

describe('Discord User Arguments', () => {
    let user = new User(client, {
        id: "<@1234567890>",
        username: "test user",
        discriminator: "#0000"
    })
    

    beforeEach(() => {
        sinon.stub(client, "fetchUser").returns(new Promise((resolve) => resolve(user)))
    })

    it('can accept discord users', async() => {
        let userArgument = {
            content: user.id,
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

