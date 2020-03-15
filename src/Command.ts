import * as Discord from "discord.js"
import { client } from "./index"
import { users } from "./db";
import { User } from "./User";
import { getType, humanPrintArray } from "./utilities"
import AggregateError from "aggregate-error"


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
    private _value: any
    constructor(value: any) {
        this._value = value
    }
    get value(): any {
        return this._value
    }
}

export class ExtraDataParseResult extends ParseResult {
    private evaluator: (input: ArgumentFuncInput) => Promise<ParseResult>
    constructor(value: string, evaluator: (input: ArgumentFuncInput) => Promise<ParseResult>) {
        super(value)
        this.evaluator = evaluator
    }
    setExtraData(input: ArgumentFuncInput) {
        return this.evaluator(input)
    }
}

export class ArgumentError extends Error {
    argument: Argument
    constructor(message: string, arg: Argument) {
        super(message);
        this.argument = arg;
    }
}

export abstract class Argument {
    usage: string = ""
    abstract parse(input: ArgumentFuncInput): Promise<ParseResult>
    abstract get description(): string;
    setUsage(usage: string): Argument {
        this.usage = usage
        return this;
    }
}

export class OrArgument extends Argument {
    private args: Argument[]
    constructor(...args: Argument[]) {
        super();
        this.args = args
    }
    async parse(input: ArgumentFuncInput) {
        let results = await Promise.all(this.args.map(x => async () => {
            try {
                return await x.parse(input)
            }
            catch (e) {
                return e;
            }
        }).map(x => x()))
        let notError = results.find(x => !(x instanceof Error))
        if (notError) {
            return notError;
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
    strings: string[]
    constructor(...str: string[]) {
        super()
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
    userCache: User | null | undefined
    async parse(input: ArgumentFuncInput) {
        let user = await users.getByUsername(input.content, input.guild.id, input.guild.members.map(x => x.id))
        if (user.length === 0) {
            throw new ArgumentError("there are no users with that argument", this)
        }
        if (user.length > 1) {
            let res: ExtraDataParseResult = new ExtraDataParseResult("", async input => {
                let n = parseInt(input.content);
                if (isNaN(n) || --n > user.length) {
                    return res;
                }
                return new ParseResult(user[n])
            })
        }
        return new ParseResult(user[0]);
    }
    get description() {
        return "your username if you have added yourself"
    }
}

export class NumberArgument extends Argument {
    async parse(input: ArgumentFuncInput) {
        let n = parseFloat(input.content)
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
    private specificStrings: string[]
    constructor(...specificString: string[]) {
        super()
        this.specificStrings = specificString
    }
    async parse(input: ArgumentFuncInput) {
        if (!this.specificStrings.includes(input.content)) {
            throw new ArgumentError(input + " is not part of " + humanPrintArray(this.specificStrings), this)
        }
        return new ParseResult(input.content)
    }
    get description() {
        return humanPrintArray(this.specificStrings)
    }
}

export abstract class CommandReponseBase {
    abstract respond(message: Discord.Message): Promise<void>;
    public listeners: ((message: Discord.Message) => Promise<boolean>)[] = []
    public addListner: ((func: (message: Discord.Message) => Promise<boolean>) => void) = func => {
        this.listeners.push(func)
    }
}

export class CommandMoreData extends CommandReponseBase {
    resolver: (() => void) | null | "done" = null
    results: ParseResult[]
    indexes: number[] = []
    transformer: (results: ParseResult[]) => Promise<CommandReponseBase>
    constructor(results: ParseResult[], transformer: (results: ParseResult[]) => Promise<CommandReponseBase>) {
        super()
        this.results = results
        this.transformer = transformer
    }
    async respond(message: Discord.Message) {
        let res = () => {
            this.calcIndexes();
            if (this.indexes.length === 0) {
                if (this.resolver === null || this.resolver === "done") {
                    this.resolver = "done"
                }
                else {
                    this.resolver();
                }
            }
            let currIndex = this.indexes[0]
            let currResult = this.results[currIndex] as ExtraDataParseResult
            this.addListner(async message => {
                this.results[currIndex] = await currResult.setExtraData({
                    content: message.content,
                    guild: (message.channel as Discord.TextChannel).guild,
                    channel: message.channel,
                    author: message.author
                })
                res();
                return false;
            })
        }
        res();
        await new Promise<void>((resolve, reject) => {
            if (this.resolver === "done") {
                resolve()
            }
            else {
                this.resolver = resolve
            }
        });
        await (await this.transformer(this.results)).respond(message);
    }
    private calcIndexes() {
        this.results.forEach((x, i) => {
            if (x instanceof ExtraDataParseResult) {
                this.indexes.push(i)
            }
        })
    }
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

export class CommandResponseFile extends CommandReponseBase {
    file: Buffer
    filename: string
    constructor(file: Buffer, filename: string) {
        super()
        this.file = file
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
    abstract validLength(length: number): boolean
    protected abstract internalParse(values: string[], discord: DiscordInput): Promise<ParseResult>[]
    parse(values: string[], discord: DiscordInput): Promise<ParseResult[]> {
        return Promise.all(this.internalParse(values, discord).map(async x => {
            try {
                return await x
            }
            catch (e) {
                if (e instanceof ArgumentError) {
                    return new Promise<any>((resolve) => resolve(e))
                }
                else {
                    throw e
                }
            }
        }))
    }
}

export class StandardArgumentList extends ArgumentList {
    arguments: Argument[]
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
}

interface OptionalizedArgument {
    argument: Argument,
    type: "required" | "default",
    default?: any
}

export class OptionalArgumentList extends ArgumentList {
    arguments: OptionalizedArgument[]
    constructor(args: OptionalizedArgument[]) {
        super()
        this.arguments = args
    }

    validLength(length: number): boolean {
        return length >= this.arguments.filter(x => x.type === "required").length || length <= this.arguments.length
    }

    protected internalParse(values: string[], discord: DiscordInput): Promise<ParseResult>[] {
        let res: Promise<any>[] = [];
        let args = this.arguments.reverse()
        let defaultArgsIndex = 0;
        let amount = args.length - values.length;
        values = values.reverse();
        args.forEach((x, i) => {
            if (x.type === "default" && amount < defaultArgsIndex) {
                defaultArgsIndex++;
                res.push(new Promise<any>((resolve) => resolve(x.default)))
            }
            else {
                res.push(x.argument.parse({
                    channel: discord.channel,
                    guild: discord.guild,
                    author: discord.author,
                    content: values[i]
                }))
            }
        })
        return res.reverse();
    }
}

export class VariableArgumentList extends ArgumentList {
    argument: Argument
    constructor(arg: Argument) {
        super()
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
    description: string
    name: string
    alias: string[] = []
    arguments: ArgumentList
    func: (input: CommandFuncInput) => Promise<CommandReponseBase>
    channelType: DiscordChannelType[]

    async call(args: string[], author: Discord.User, channel: Discord.Channel, guild: Discord.Guild): Promise<CommandReponseBase> {
        let parsedResults = await this.arguments.parse(args, { author, channel, guild });
        let errors = parsedResults.filter(x => x instanceof ArgumentError);
        if (errors.length !== 0) {
            throw new AggregateError(errors)
        }
        if (parsedResults.filter(x => x instanceof ExtraDataParseResult).length > 0) {
            return new CommandMoreData(parsedResults, x => this.func({
                args: x,
                author: author,
                channel: channel,
                guild: guild
            }))
        }
        else {
            return await this.func({
                args: parsedResults,
                author: author,
                channel: channel,
                guild: guild
            });
        }
    }

    constructor(name: string, description: string, args: ArgumentList, func: (input: CommandFuncInput) => Promise<CommandReponseBase>, alias: string[] = [], channelType: DiscordChannelType | DiscordChannelType[] = "text") {
        this.name = name
        this.arguments = args
        this.func = func
        this.description = description
        if (getType(channelType) === "string") {
            this.channelType = [channelType as DiscordChannelType]
        }
        else {
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
    cache: Map<string, CommandReponseBase> = new Map()
    constructor(name: string, description: string, args: ArgumentList, func: (input: CommandFuncInput) => Promise<CommandReponseBase>, alias: string[] = [], channelType: DiscordChannelType | DiscordChannelType[] = "text") {
        super(name, description, args, async input => {
            let val = JSON.stringify(input.args)
            if (!this.cache.has(val)) {
                this.cache.set(val, await func(input))
            }
            return this.cache.get(val)!
        }, alias, channelType)
    }
}