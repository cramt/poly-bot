import chaisAsPromiseod from 'chai-as-promised';
import * as chai from 'chai';
import * as sinon from 'sinon';
import { createSinonStubInstance } from './SinonStubbedInstance';
import * as commands from '../src/commands';
import { users } from '../src/db'
import { User, Guild, TextChannel } from 'discord.js';
import { UserArgument, ParseResult, ArgumentList, StandardArgumentList } from '../src/Command';
import { GuildUser } from '../src/User';

chai.use(chaisAsPromiseod)
const assert = chai.assert

describe("add-local", async() => {
    
    let command = commands.commands.find(x => x.name === "add-local")
    let guild: Guild
    let user: User
    let channel: TextChannel

    beforeEach(() => {
        guild = createSinonStubInstance(Guild)
        guild.id = "1"
        user = createSinonStubInstance(User)
        channel = createSinonStubInstance(TextChannel)
        channel.guild = guild
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

after(async() => {
    sinon.restore()
})