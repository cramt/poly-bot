import * as Discord from "discord.js"
import { client } from "./index"

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
        return client.fetchUser(input.substring(2, input.length - 1))
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
    author: Discord.User
}

export abstract class CommandReponseBase {
    abstract respond(message: Discord.Message): void;
}

export class CommandReponseInSameChannel extends CommandReponseBase {
    text: string
    constructor(text: string) {
        super();
        this.text = text
    }
    respond(message: Discord.Message) {
        message.channel.send(this.text)
    }
}

export class Command {
    name: string
    arguments: Argument[]
    func: (input: CommandFuncInput) => CommandReponseBase

    argErrors(args: string[]): number[] {
        let res: number[] = []
        this.arguments.forEach((x, i) => {
            if (!x.valid(args[i])) {
                res[res.length] = i
            }
        })
        return res;
    }

    call(args: string[], author: Discord.User): CommandReponseBase {
        return this.func({
            args: args.map((x, i) => this.arguments[i].parse(x)),
            author: author
        });
    }

    constructor(name: string, args: Argument[], func: (input: CommandFuncInput) => CommandReponseBase) {
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
        new SpecificArgument("femme", "masc", "neuter", "system")], input => {
            return new CommandReponseInSameChannel("cool")
        })
]