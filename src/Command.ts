import * as Discord from "discord.js"
import {client} from "./index"
import {users} from "./db";
import {DiscordUser} from "./User";
import {getType, humanPrintArray, discordRequestChoice, splitMessageForDiscord, AggregateError} from "./utilities"


export interface DiscordInput {
    author: Discord.User,
    channel: Discord.Channel,
    guild: Discord.Guild
}

export interface CommandFuncInput extends DiscordInput {
    args: ParseResult[]
}

export interface ArgumentFuncInput extends DiscordInput {
    content: string
}

export class ParseResult {
    private readonly _value: any;

    constructor(value: any) {
        this._value = value
    }

    get value(): any {
        return this._value
    }
}

export class ArgumentError extends Error {

    argument: Argument;

    constructor(message: string, arg: Argument) {
        super(message);
        this.argument = arg;
        (this as any).__proto__ = ArgumentError
    }
}

export abstract class Argument {
    usage: string = "";

    abstract parse(input: ArgumentFuncInput): Promise<ParseResult>

    abstract get description(): string;

    setUsage(usage: string): Argument {
        this.usage = usage;
        return this;
    }
}

export class OrArgument extends Argument {
    private args: Argument[];

    constructor(...args: Argument[]) {
        super();
        this.args = args
    }

    async parse(input: ArgumentFuncInput) {
        let errors: any[] = [];
        let finished: ParseResult[] = [];
        await Promise.all(this.args.map(x => x.parse(input).then(x => finished.push(x)).catch(x => errors.push(x))));
        if (this.args[0] instanceof SpecificArgument && this.args[1] instanceof SpecificArgument) {
            console.log(JSON.stringify(errors));
            console.log(finished);
            console.log(finished.length)
        }
        if (finished.length === 0) {
            throw errors[0];
        } else {
            return finished[0];
        }
    }

    get description() {
        return humanPrintArray(this.args.map(x => x.description))
    }
}

export class AnyArgument extends Argument {
    async parse(input: ArgumentFuncInput) {
        return new ParseResult(input.content)
    }

    get description() {
        return "literally anything"
    }
}

export class StringExcludedArgument extends Argument {
    strings: string[];

    constructor(...str: string[]) {
        super();
        this.strings = str;
    }

    async parse(input: ArgumentFuncInput) {
        for (let i = 0; i < this.strings.length; i++) {
            if (input.content.includes(this.strings[i])) {
                throw new ArgumentError(this.strings[i] + " is excluded from this argument and is not allowed", this)
            }
        }
        return new ParseResult(input.content)
    }

    get description() {
        return "literally anything except " + humanPrintArray(this.strings)
    }
}

export class DiscordUserArgument extends Argument {
    async parse(input: ArgumentFuncInput) {
        if (!(input.content.length > 4 && input.content.startsWith("<@") && input.content[input.content.length - 1] === ">")) {
            throw new ArgumentError("this argument has to be an @ of a discord user", this)
        }
        let start = 2;
        if (input.content.startsWith("<@!")) {
            start = 3;
        }
        return new ParseResult(await client.fetchUser(input.content.substring(start, input.content.length - 1)))
    }

    get description() {
        return "@'ing someone"
    }
}

export class UserArgument extends Argument {
    async parse(input: ArgumentFuncInput) {
        let user = await users.getByUsername(input.content, input.guild.id, input.guild.members.map(x => x.id));
        if (user.length === 0) {
            throw new ArgumentError("there are no users with that argument", this)
        }
        if (user.length > 1) {
            return new ParseResult(await discordRequestChoice(input.content, user, input.channel as Discord.TextChannel, input.author, x => (x instanceof DiscordUser ? ("<@" + x.discordId + ">") : "local user")))
        }
        return new ParseResult(user[0]);
    }

    get description() {
        return "your username if you have added yourself"
    }
}

export class NumberArgument extends Argument {
    async parse(input: ArgumentFuncInput) {
        let n = parseFloat(input.content);
        if (getType(n) === "NaN") {
            throw new ArgumentError("this argument requires a number", this)
        }
        return new ParseResult(n)
    }

    get description() {
        return "any number"
    }
}

export class SpecificArgument extends Argument {
    private readonly specificStrings: string[];
    private readonly ignoreCapital: boolean = true;

    constructor(...specificString: string[]) {
        super();

        this.specificStrings = specificString
        let max = Math.max(...specificString.map(x => x.length))
        for (let i = 1; i < max; i++) {
            for (let j = i; j < max; j++) {
                if (this.specificStrings[i] && this.specificStrings[j] && this.specificStrings[i].substring(0, i).toLowerCase() === this.specificStrings[j].substring(0, i)) {
                    this.ignoreCapital = false;
                }
            }
        }
    }

    async parse(input: ArgumentFuncInput) {
        let strings = [...this.specificStrings].map((x, i) => ({str: x, index: i}))
        let content = input.content
        if (this.ignoreCapital) {
            strings.forEach(x => {
                x.str = x.str.toLowerCase()
            })
            content = content.toLowerCase()
        }
        let res = strings.filter(x => x.str.substring(0, content.length) === content)
        if (res.length === 1) {
            let a = new ParseResult(this.specificStrings[res[0].index])
            return a;
        }
        throw new ArgumentError(content + " is not part of " + humanPrintArray(strings.map(x => x.str)), this)
    }

    get description() {
        return humanPrintArray(this.specificStrings)
    }
}

export abstract class CommandReponseBase {
    abstract respond(message: Discord.Message): Promise<void>;
}

export class CommandReponseNone extends CommandReponseBase {
    async respond(message: Discord.Message) {

    }
}

export class CommandReponseInSameChannel extends CommandReponseBase {
    text: string[];

    constructor(text: string) {
        super();
        let block = false;
        if (text.startsWith("```") && text.endsWith("```")) {
            text = text.substring(3, text.length - 3);
            block = true;
        }
        this.text = splitMessageForDiscord(text, block);
    }

    async respond(message: Discord.Message) {
        for (let t of this.text) {
            await message.channel.send(t);
        }
    }
}

export class CommandResponseReaction extends CommandReponseBase {
    reaction: string;

    constructor(reaction: string) {
        super();
        this.reaction = reaction
    }

    async respond(message: Discord.Message) {
        await message.react(this.reaction)
    }
}

export class CommandResponseFile extends CommandReponseBase {
    file: Buffer;
    filename: string;

    constructor(file: Buffer, filename: string) {
        super();
        this.file = file;
        this.filename = filename
    }

    async respond(message: Discord.Message) {
        await message.channel.send("", {
            file: {
                attachment: this.file,
                name: this.filename
            }
        })
    }
}

export type DiscordChannelType = 'dm' | 'group' | 'text' | 'voice' | 'category' | 'news' | 'store'

export abstract class ArgumentList {
    abstract get description(): string

    abstract validLength(length: number): boolean

    protected abstract internalParse(values: string[], discord: DiscordInput): Promise<ParseResult>[]

    async parse(values: string[], discord: DiscordInput): Promise<ParseResult[]> {
        let resolved: ParseResult[] = [];
        let rejected: Error[] = [];
        //@ts-ignore
        (await Promise.allSettled(this.internalParse(values, discord))).forEach(x => {
            if (x.status === "rejected") {
                rejected.push(x.reason)
            } else {
                resolved.push(x.value)
            }
        })
        if (rejected.length === 0) {
            return resolved;
        } else {
            throw new AggregateError(rejected);
        }
    }
}

export class StandardArgumentList extends ArgumentList {
    arguments: Argument[];

    constructor(...args: Argument[]) {
        super();
        this.arguments = args;
    }

    validLength(length: number): boolean {
        return this.arguments.length === length;
    }

    protected internalParse(values: string[], discord: DiscordInput): Promise<ParseResult>[] {
        return this.arguments.map(async (x, i) => x.parse({
            channel: discord.channel,
            guild: discord.guild,
            author: discord.author,
            content: values[i]
        }));
    }

    get description(): string {
        return this.arguments.map((x, i) => "\r\nargument " + i + ": " + (x.usage !== "" ? x.usage + ", can be" : "") + x.description).join("")
    }
}

interface OptionalizedArgument {
    argument: Argument,
    type: "required" | "default",
    default?: any
}

export class OptionalArgumentList extends ArgumentList {
    arguments: OptionalizedArgument[];
    sizeMap = new Map<number, (values: string[], discord: DiscordInput) => Promise<ParseResult>[]>();

    constructor(args: OptionalizedArgument[]) {
        super();
        this.arguments = args
        let required: OptionalizedArgument[] = [];
        let optional: OptionalizedArgument[] = []
        this.arguments.forEach(x => {
            switch (x.type) {
                case "default":
                    optional.push(x)
                    break
                case "required":
                    required.push(x)
                    break
                default:
                    throw new TypeError("OptionalizedArgument.type is not default or required")
            }
        })
        for (let i = required.length; i < this.arguments.length + 1; i++) {

            interface PossiblySetArgument {
                isArgument: boolean
                argument: OptionalizedArgument
                set: any
            }

            let arr = [...this.arguments].reverse().map(x => ({
                isArgument: true,
                argument: x
            } as PossiblySetArgument))
            let leftToModify = optional.length - (i - required.length)
            arr.forEach(x => {
                if (leftToModify < 1) {
                    return
                }
                if (x.argument.type === "default") {
                    x.isArgument = false
                    x.set = x.argument.default
                    leftToModify--
                }
            })
            arr.reverse()
            this.sizeMap.set(i, (values: string[], discord: DiscordInput) => {
                let vIndex = 0;
                return (arr.map(async x => {
                    if (x.isArgument) {
                        return await x.argument.argument.parse({
                            author: discord.author,
                            channel: discord.channel,
                            guild: discord.guild,
                            content: values[vIndex++]
                        })
                    } else {
                        return new ParseResult(x.set)
                    }
                }));
            })
        }

    }

    validLength(length: number): boolean {
        return this.sizeMap.has(length);
    }

    protected internalParse(_values: string[], discord: DiscordInput): Promise<ParseResult>[] {
        let func = this.sizeMap.get(_values.length)!;
        return func(_values, discord);
    }

    get description(): string {
        return this.arguments.map((x, i) => "\r\nargument " + i + ": " + (x.argument.usage !== "" ? x.argument.usage + ", can be" : "") + x.argument.description + (x.type === "default" ? ", default value is " + x.default : "")).join("")
    }
}

export class VariableArgumentList extends ArgumentList {
    get description(): string {
        return "any amount of argument: " + (this.argument.usage !== "" ? this.argument.usage + ", can be" : "") + this.argument.description;
    }

    argument: Argument;

    constructor(arg: Argument) {
        super();
        this.argument = arg
    }

    validLength(length: number): boolean {
        return true
    }

    protected internalParse(values: string[], discord: DiscordInput): Promise<ParseResult>[] {
        return values.map(x => this.argument.parse({
            channel: discord.channel,
            guild: discord.guild,
            author: discord.author,
            content: x
        }));
    }
}

export class Command {
    description: string;
    name: string;
    alias: string[] = [];
    arguments: ArgumentList;
    func: (input: CommandFuncInput) => Promise<CommandReponseBase>;
    channelType: DiscordChannelType[];

    async call(args: string[], author: Discord.User, channel: Discord.Channel, guild: Discord.Guild): Promise<CommandReponseBase> {
        let parsedResults: ParseResult[] = await this.arguments.parse(args, {author, channel, guild});
        return await this.func({
            args: parsedResults,
            author: author,
            channel: channel,
            guild: guild
        });
    }

    constructor(name: string, description: string, args: ArgumentList, func: (input: CommandFuncInput) => Promise<CommandReponseBase>, alias: string[] = [], channelType: DiscordChannelType | DiscordChannelType[] = "text") {
        this.name = name;
        this.arguments = args;
        this.func = func;
        this.description = description;
        if (getType(channelType) === "string") {
            this.channelType = [channelType as DiscordChannelType]
        } else {
            this.channelType = channelType as DiscordChannelType[]
        }
        this.alias = alias;
    }
}

export class AdminCommand extends Command {
    constructor(name: string, description: string, args: ArgumentList, func: (input: CommandFuncInput) => Promise<CommandReponseBase>) {
        super(name, description + ", can only be used by admin", args, async input => {
            if ((await (input.channel as Discord.TextChannel).guild.fetchMember(input.author.id)).hasPermission("ADMINISTRATOR")) {
                return await func(input)
            }
            return new CommandReponseInSameChannel("this command is an admin command, and can only be used by adminstators")
        })
    }
}

export class CacheCommand extends Command {
    cache: Map<string, CommandReponseBase> = new Map();

    constructor(name: string, description: string, args: ArgumentList, func: (input: CommandFuncInput) => Promise<CommandReponseBase>, alias: string[] = [], channelType: DiscordChannelType | DiscordChannelType[] = "text") {
        super(name, description, args, async input => {
            let val = JSON.stringify(input.args);
            if (!this.cache.has(val)) {
                this.cache.set(val, await func(input))
            }
            return this.cache.get(val)!
        }, alias, channelType)
    }
}
