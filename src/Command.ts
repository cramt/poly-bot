import * as Discord from "discord.js"
import { client } from "./index"
import { createNewUser, getUser } from "./db";
import { Gender, User } from "./User";
import { getType } from "./utilities"

export abstract class Argument {
    abstract valid(input: string): boolean
    abstract parse(input: string): Promise<any>
}

export class OrArgument extends Argument {
    private args: Argument[]
    constructor(...args: Argument[]) {
        super();
        this.args = args
    }
    valid(input: string) {
        let res = false;
        this.args.forEach(x => {
            res = res || x.valid(input)
        })
        return res;
    }
    async parse(input: string) {
        for (let i = 0; i < this.args.length; i++) {
            if (this.args[i].valid(input)) {
                return this.args[i].parse(input)
            }
        }
    }
}

export class AnyArgument extends Argument {
    valid(input: string) {
        return true
    }
    async parse(input: string) {
        return input
    }
}

export class DiscordUserArgument extends Argument {
    valid(input: string) {
        return input.length > 4 && input.startsWith("<@") && input[input.length - 1] === ">"
    }
    async parse(input: string) {
        return await client.fetchUser(input.substring(2, input.length - 1))
    }
}

export class NumberArgument extends Argument {
    valid(input: string) {
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
    valid(input: string) {
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

    argErrors(args: string[]): number[] {
        let res: number[] = []
        this.arguments.forEach((x, i) => {
            if (!x.valid(args[i])) {
                res[res.length] = i
            }
        })
        return res;
    }

    async call(args: string[], author: Discord.User, channel: Discord.TextChannel): Promise<CommandReponseBase> {
        return await this.func({
            args: await Promise.all(args.map((x, i) => this.arguments[i].parse(x))),
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

export const commands: Command[] = [
    new Command("add", [
        new AnyArgument(),
        new OrArgument(
            new SpecificArgument("me", "unknown"),
            new DiscordUserArgument()),
        new SpecificArgument("femme", "masc", "neuter", "system")], async input => {

            let name = input.args[0] as string
            let discordUser = input.args[1] as Discord.User | "me" | "unknown" | null
            if (discordUser === "unknown") {
                discordUser = null;
            }
            else if (discordUser === "me") {
                discordUser = input.author
            }
            let discordID: string | null = null
            if (getType(discordUser) === "object") {
                discordID = discordUser?.id!
            }
            let gender = (input.args[2] + "").toUpperCase() as Gender
            let user = new User(name, gender, input.channel.guild.id, discordID)

            if (await createNewUser(user)) {
                return new CommandResponseReaction("👍")
            }
            else {
                return new CommandReponseInSameChannel("there is already a person with that name on this discord server")
            }
        }),


    new Command("me", [], async input => {
        let user = await getUser(input.channel.guild.id, input.author.id)
        if (user === null) {
            return new CommandReponseInSameChannel("you have not been added yet")
        }
        return new CommandReponseInSameChannel("```name: " + user.name +"\ngender: " + user.gender.toLowerCase() + "```")
    })
]