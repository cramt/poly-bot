import chaisAsPromiseod from 'chai-as-promised';
import * as chai from 'chai';
import * as sinon from 'sinon';
import { createSinonStubInstance } from './SinonStubbedInstance';
import * as commands from '../src/commands';
import { users, relationships } from '../src/db'
import { User, Guild, TextChannel } from 'discord.js';
import { StandardArgumentList, UserArgument, ParseResult, OptionalArgumentList } from '../src/Command';
import { GuildUser, DiscordUser } from '../src/User';

chai.use(chaisAsPromiseod)
const assert = chai.assert

let command = commands.commands.find(x => x.name === "add-local")
let guild: Guild
let user: User
let channel: TextChannel

describe("add-local", async() => {
    


    beforeEach(() => {
        stubDiscordDependencies()
    })

    it('can add add a user locally', async() => {
        let userAdd = sinon.stub(users, "add")
        let parse = sinon.spy(StandardArgumentList.prototype, "parse")

        await assert.isFulfilled(command!.call(["Lucca", "femme"], user, channel, guild))
        sinon.assert.calledWith(parse, sinon.match.array.deepEquals(["Lucca", "femme"]), sinon.match.any)
        sinon.assert.calledWith(userAdd, sinon.match.has("name", "Lucca"))
        sinon.assert.calledWith(userAdd, sinon.match.has("gender", "FEMME"))
        sinon.assert.calledWith(userAdd, sinon.match.has("guildId", "1"))
    })

    it('can reject invalid gender options', async() => {
        let parse = sinon.spy(StandardArgumentList.prototype, "parse")
        let userAdd = sinon.stub(users, "add")
        let input = sinon.spy(command!, "func")

        await assert.isRejected(command!.call(["Lucca", "feme"], user, channel, guild))
        sinon.assert.calledWith(parse, sinon.match.array.deepEquals(["Lucca", "feme"]), sinon.match.any)
        sinon.assert.notCalled(userAdd)
        sinon.assert.notCalled(input)
    })

    afterEach(() => {
        sinon.restore()
    })
})

describe('add-relationship', () => {
    let command = commands.commands.find(x => x.name === "add-relationship")

    beforeEach(() => {
        stubDiscordDependencies()
    })

    it('can create a new relationshps between two existing users', async() => {
        sinon.stub(commands, "parseDiscordUserOrUser")
        let userParse = sinon.stub(UserArgument.prototype, "parse")
            .onFirstCall().resolves(new ParseResult(
                new GuildUser("Lucca", "FEMME", 1, null, "1")
            ))
            .onSecondCall().resolves(new ParseResult(
                new GuildUser("Zoe", "FEMME", 2, null, "1")
            ))
        let relationshipAdd = sinon.stub(relationships, "add")
        await assert.isFulfilled(command!.call(["lucca", "zoe", "romantic"], user, channel, guild))
        sinon.assert.calledWith(userParse.firstCall, sinon.match.has("content", "lucca"))
        sinon.assert.calledWith(userParse.secondCall, sinon.match.has("content", "zoe"))
        sinon.assert.calledWith(relationshipAdd, sinon.match.hasNested("leftUser.name", "Zoe"))
        sinon.assert.calledWith(relationshipAdd, sinon.match.hasNested("rightUser.name", "Lucca"))        
    })

    afterEach(() => {
        sinon.restore()
    })
})

describe('add-member', () => {
    let command = commands.commands.find(x => x.name === "add-member")

    beforeEach(() => {
        stubDiscordDependencies()
    })

    it('can add a member to an existing system', async() => {
        let parse = sinon.stub(OptionalArgumentList.prototype, "parse")
            .resolves([
                new ParseResult(new GuildUser("table", "SYSTEM", 1, null, "1")),
                new ParseResult("juniper"),
                new ParseResult("femme")
            ])
        let dbAdd = sinon.stub(users, "add").resolves(true)

        await assert.isFulfilled(command!.call(["table", "juniper", "femme"], user, channel, guild))
        sinon.assert.calledWith(parse, sinon.match.array.deepEquals(["table", "juniper", "femme"]), sinon.match.any)
        sinon.assert.calledWith(dbAdd, sinon.match(new GuildUser("juniper", "FEMME", null, 1, "")))
    })

    it('can turn a singlet user into a system', async() => {
        let parse = sinon.stub(OptionalArgumentList.prototype, "parse")
            .resolves([
                new ParseResult(new GuildUser("table", "FEMME", 1, null, "1")),
                new ParseResult("juniper"),
                new ParseResult("femme")
            ])
        let dbAdd = sinon.stub(users, "add").resolves(true)
        let dbUpdate = sinon.stub(users, "update").resolves(true)

        await assert.isFulfilled(command!.call(["table", "juniper", "femme"], user, channel, guild))
        sinon.assert.calledWith(parse, sinon.match.array.deepEquals(["table", "juniper", "femme"]), sinon.match.any)
        sinon.assert.calledWith(dbUpdate, sinon.match(new GuildUser("table", "SYSTEM", 1, null, "1")))
        sinon.assert.calledWith(dbAdd, sinon.match(new GuildUser("juniper", "FEMME", null, 1, "")))
    })

    afterEach(() => sinon.restore())
}) 

after(async() => {
    sinon.restore()
})

function stubDiscordDependencies () {
    guild = createSinonStubInstance(Guild)
        guild.id = "1"
        user = createSinonStubInstance(User)
        channel = createSinonStubInstance(TextChannel)
        channel.guild = guild
}