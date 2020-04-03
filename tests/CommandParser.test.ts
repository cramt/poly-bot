import chaiAsPromised from 'chai-as-promised';
import * as chai from 'chai';
import * as sinon from 'sinon';
import * as PolyUser from '../src/User'
import {
    User,
    Guild,
    TextChannel,
    Collection,
    Snowflake,
    GuildMember
} from 'discord.js';
import {client} from "../src";
import {users} from '../src/db';
import {
    ArgumentError,
    UserArgument,
    NumberArgument,
    AnyArgument,
    DiscordUserArgument,
    SpecificArgument,
    StringExcludedArgument,
    OrArgument,
    ParseResult
} from '../src/Command';
import {createSinonStubInstance} from './SinonStubbedInstance';
import * as util from '../src/utilities'
import {GuildUser} from "../src/User";

chai.use(chaiAsPromised);
const assert = chai.assert;

let guild: Guild;
let user: User;
let channel: TextChannel;

describe('Number Arguments', () => {
    it('can reject invalid numbers', async () => {
        await assert.isRejected(new NumberArgument().parse({
            content: "hello there",
            channel: null as any,
            guild: null as any,
            author: null as any
        }).then(x => x.value), ArgumentError)
    });
    it('accept valid numbers', async () => {
        await assert.eventually.equal(new NumberArgument().parse({
            content: "4",
            channel: null as any,
            guild: null as any,
            author: null as any
        }).then(x => x.value), 4)
    })
});

describe('Any Arguments', async () => {

    it('can return the contents of an argument', async () => {
        await assert.eventually.equal(new AnyArgument().parse({
            content: "argument",
            channel: null as any,
            guild: null as any,
            author: null as any
        }).then(x => x.value), "argument")
    })
});

describe('User Arguments', () => {

    let testUsers = [
        new PolyUser.GuildUser("test1", "FEMME", null, null, "1111"),
        new PolyUser.DiscordUser("test2", "NEUTRAL", null, null, "111111"),
        new PolyUser.DiscordUser("test2", "FEMME", null, null, "111112"),
        new PolyUser.GuildUser("test3", "MASC", null, null, "2222")
    ];

    beforeEach(() => {
        stubDiscordDependencies()
    });

    it('can retrieve a user', async () => {
        let getUser = sinon.stub(users, "getByUsername").resolves([new GuildUser("test1", "FEMME", 1, null, "1")]);
        await assert.isFulfilled(new UserArgument().parse({
            content: "test1",
            channel: channel,
            guild: guild,
            author: user
        }).then(x => assert.deepEqual(x.value.name, "test1")));
        sinon.assert.calledWith(getUser, sinon.match("test1"), "1", sinon.match.any)
    });

    it('can reject non-existent users', async () => {
        let getUser = sinon.stub(users, "getByUsername").rejects();
        await assert.isRejected(new UserArgument().parse({
            content: "test4",
            channel: channel,
            guild: guild,
            author: user
        }));
        sinon.assert.calledWith(getUser, sinon.match("test4"), "1", sinon.match.any)
    });

    it('can accept correct results from requests for more data', async () => {
        let user1 = testUsers[1];
        user1.id = 1;
        let user2 = testUsers[2];
        user2.id = 2;
        let getUser = sinon.stub(users, "getByUsername").resolves([user1, user2]);
        let requestChoice = sinon.stub(util, "discordRequestChoice").resolves(user1);
        await assert.isFulfilled(new UserArgument().parse({
            content: "test2",
            channel: channel,
            guild: guild,
            author: user
        }).then(x => assert.deepEqual(x.value.gender, "NEUTRAL")));
        sinon.assert.calledWith(getUser, sinon.match("test2"), "1", sinon.match.any);
        sinon.assert.calledWith(requestChoice, sinon.match("test2"), sinon.match.array.deepEquals([user1, user2]),
            sinon.match.any, sinon.match.any, sinon.match.any)
    });

    it('can handle rejection of requests for more data', async () => {
        sinon.stub(util, "discordRequestChoice").rejects();
        await assert.isRejected(new UserArgument().parse({
            content: "test2",
            channel: channel,
            guild: guild,
            author: user
        }))
    });

    afterEach(() => {
        sinon.restore()
    })
});

describe('Discord User Arguments', () => {
    let user = new User(client, {
        id: "138790334896275455",
        username: "test user",
        discriminator: "#0000"
    });

    beforeEach(() => {
        sinon.stub(client, "fetchUser").resolves(user)
    });

    it('can accept discord users', async () => {
        let userArgument = {
            content: "<@138790334896275456>",
            channel: null as any,
            guild: null as any,
            author: null as any
        };
        await assert.isFulfilled(new DiscordUserArgument().parse(userArgument))
    });

    it('can reject invalid discord users', async () => {
        let userArgument = {
            content: "invalid argument",
            channel: null as any,
            guild: null as any,
            author: null as any
        };
        await assert.isRejected(new DiscordUserArgument().parse(userArgument))
    });

    afterEach(() => sinon.restore())
});

describe('Specific Arguments', () => {
    let arg = new SpecificArgument("1", "2", "3");
    it('can accept arguments that match one element', () => {
        assert.isFulfilled(arg.parse({
            content: "1",
            channel: null as any,
            guild: null as any,
            author: null as any
        }))
    });

    it('can reject arguments that match neither element', () => {
        assert.isRejected(arg.parse({
            content: "4",
            channel: null as any,
            guild: null as any,
            author: null as any
        }))
    })
});

describe('String Excluded Arguments', () => {
    let arg = new StringExcludedArgument("excluded");
    it('can reject arguments with excluded string', () => {
        assert.isRejected(arg.parse({
            content: "excluded",
            channel: null as any,
            guild: null as any,
            author: null as any
        }), ArgumentError)
    });

    it('can accept string arguments that do not contain excluded string', () => {
        assert.isFulfilled(arg.parse({
            content: "included",
            channel: null as any,
            guild: null as any,
            author: null as any
        }))
    })
});

describe('Or Arguments', () => {

    it('can accept either of defined type of argument', async () => {
        sinon.stub(UserArgument.prototype, "parse").rejects(ArgumentError);
        sinon.stub(DiscordUserArgument.prototype, "parse").resolves(new ParseResult(new PolyUser.DiscordUser("test1", "FEMME", 1, null, "123456")));
        let arg = new OrArgument(new UserArgument(), new DiscordUserArgument());
        await assert.isFulfilled(arg.parse({
            content: "<@123456>",
            channel: null as any,
            guild: null as any,
            author: null as any
        }))
    });

    it('can reject when both argument types are rejected', async () => {
        sinon.stub(UserArgument.prototype, "parse").rejects(ArgumentError);
        sinon.stub(DiscordUserArgument.prototype, "parse").rejects(ArgumentError);

        let arg = new OrArgument(new UserArgument, new DiscordUserArgument);
        await assert.isRejected(arg.parse({
            content: "1",
            channel: null as any,
            guild: null as any,
            author: null as any
        }))
    });

    afterEach(() => sinon.restore())
});

function stubDiscordDependencies() {
    guild = createSinonStubInstance(Guild);
    guild.id = "1";
    guild.members = new Collection<Snowflake, GuildMember>();
    user = createSinonStubInstance(User);
    channel = createSinonStubInstance(TextChannel);
    channel.guild = guild
}