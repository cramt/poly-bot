import * as Discord from "discord.js"
import { client } from "./index"
import { createNewUser, getUserByDiscordId, getUserByUsername, createNewRelationship } from "./db";
import { Gender, User } from "./User";
import { getType } from "./utilities"
import { checkServerIdentity } from "tls";
import { Relationship, RelationshipType } from "./Relationship";

export abstract class Argument {
    abstract valid(input: string, channel: Discord.TextChannel): Promise<boolean>
    abstract parse(input: string, channel: Discord.TextChannel): Promise<any>
}

export class OrArgument extends Argument {
    private args: Argument[]
    constructor(...args: Argument[]) {
        super();
        this.args = args
    }
    async valid(input: string, channel: Discord.TextChannel) {
        let stuff = (await Promise.all(this.args.map(x => x.valid(input, channel))))
        return stuff.length !== 0;
    }
    async parse(input: string, channel: Discord.TextChannel) {
        for (let i = 0; i < this.args.length; i++) {
            if (await this.args[i].valid(input, channel)) {
                return await this.args[i].parse(input, channel)
            }
        }
    }
}

export class AnyArgument extends Argument {
    async valid(input: string) {
        return true
    }
    async parse(input: string) {
        return input
    }
}

export class DiscordUserArgument extends Argument {
    async valid(input: string) {
        return input.length > 4 && input.startsWith("<@") && input[input.length - 1] === ">"
    }
    async parse(input: string) {
        let start = 2;
        if (input.startsWith("<@!")) {
            start = 3;
        }
        return await client.fetchUser(input.substring(start, input.length - 1))
    }
}

export class UserArgument extends Argument {
    userCache: User | null | undefined
    async valid(input: string, channel: Discord.TextChannel) {
        let user = await getUserByUsername(channel.guild.id, input)
        this.userCache = user;
        if (user === null) {
            return false;
        }
        return true;
    }
    async parse(input: string, channel: Discord.TextChannel) {
        if (this.userCache === undefined) {
            await this.valid(input, channel)
        }
        return this.userCache
    }
}

export class NumberArgument extends Argument {
    async valid(input: string) {
        return !isNaN(parseFloat(input))
    }
    async parse(input: string) {
        return parseFloat(input)
    }
}

export class SpecificArgument extends Argument {
    private specificStrings: string[]
    constructor(...specificString: string[]) {
        super()
        this.specificStrings = specificString
    }
    async valid(input: string) {
        return this.specificStrings.includes(input)
    }
    async parse(input: string) {
        return input
    }
}

export interface CommandFuncInput {
    args: any[]
    author: Discord.User,
    channel: Discord.TextChannel
}

export abstract class CommandReponseBase {
    abstract respond(message: Discord.Message): Promise<void>;
}

export class CommandReponseNone extends CommandReponseBase {
    async respond(message: Discord.Message) {

    }
}



export class CommandReponseInSameChannel extends CommandReponseBase {
    text: string
    constructor(text: string) {
        super();
        this.text = text
    }
    async respond(message: Discord.Message) {
        await message.channel.send(this.text)
    }
}

export class CommandResponseReaction extends CommandReponseBase {
    reaction: string
    constructor(reaction: string) {
        super()
        this.reaction = reaction
    }
    async respond(message: Discord.Message) {
        await message.react(this.reaction)
    }
}

export class Command {
    name: string
    arguments: Argument[]
    func: (input: CommandFuncInput) => Promise<CommandReponseBase>

    async argErrors(args: string[], channel: Discord.TextChannel): Promise<number[]> {
        let res: number[] = []
        await Promise.all(this.arguments.map(async (x, i) => {
            if (!await x.valid(args[i], channel)) {
                res[res.length] = i
            }
        }))
        return res;
    }

    async call(args: string[], author: Discord.User, channel: Discord.TextChannel): Promise<CommandReponseBase> {
        return await this.func({
            args: await Promise.all(args.map((x, i) => this.arguments[i].parse(x, channel))),
            author: author,
            channel: channel
        });
    }

    constructor(name: string, args: Argument[], func: (input: CommandFuncInput) => Promise<CommandReponseBase>) {
        this.name = name
        this.arguments = args
        this.func = func
    }
}

