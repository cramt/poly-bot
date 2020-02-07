import * as Discord from "discord.js"

export abstract class Argument {
    abstract valid(input: string): boolean
    abstract parse(input: string): any
}

export class OrArgument extends Argument {
    private args: Argument[]
    constructor(args: Argument[]) {
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
    parse(input: string) {
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
    parse(input: string) {
        return input
    }
}

export class DiscordUserArgument extends Argument {
    valid(input: string) {
        return true
    }
    parse(input: string) {
        return {}
    }
}

export class NumberArgument extends Argument {
    valid(input: string) {
        return !isNaN(parseFloat(input))
    }
    parse(input: string) {
        return parseFloat(input)
    }
}

export class SpecificArgument extends Argument {
    private specificStrings: string[]
    constructor(specificString: string[]) {
        super()
        this.specificStrings = specificString
    }
    valid(input: string) {
        return this.specificStrings.includes(input)
    }
    parse(input: string) {
        return input
    }
}

export interface CommandFuncInput {
    args: any[]
    author: Discord.User
}

export class CommandFuncOutputBase {
    respond(message: Discord.Message) {
        
    }
}

export class Command {
    name: string
    arguments: Argument[]

    constructor(name: string, args: Argument[]) {
        this.name = name
        this.arguments = args
    }
}

export const command: Command[] = [

]