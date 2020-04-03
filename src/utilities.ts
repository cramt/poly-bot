import * as fs from "fs"
import {Relationship} from "./Relationship"
import {User} from "./User"
import AggregateError from "aggregate-error"
import * as Discord from "discord.js"
import {client} from "."
import beginningOfLine = Mocha.reporters.Base.cursor.beginningOfLine;

export function commandLineArgSplit(str: string): { commandName: string, args: string[] } {
    let commandNameIndex = str.indexOf(" ");
    if (commandNameIndex === -1) {
        return {
            commandName: str,
            args: []
        }
    }
    let commandName = str.substring(0, commandNameIndex);
    let argsStr = str.substring(commandNameIndex + 1);
    let prevChar = "";
    let strBuilder = "";
    let ignoreSpace = false;
    let args: string[] = [];
    for (let i = 0; i < argsStr.length; i++) {
        let char = argsStr[i];
        if (prevChar === "\\") {
            strBuilder += char;
            prevChar = char;
            continue;
        }
        if (char === "\\") {
            prevChar = char;
            continue;
        }
        if (char === "\"") {
            ignoreSpace = !ignoreSpace;
            prevChar = char;
            continue;
        }
        if (char === " " && !ignoreSpace) {
            if (prevChar != " ") {
                args[args.length] = strBuilder;
                strBuilder = "";
            }
            prevChar = char;
            continue;
        }
        strBuilder += char;
        prevChar = char
    }
    args[args.length] = strBuilder;
    strBuilder = "";
    return {
        commandName: commandName,
        args: args
    }
}

export function getType(thing: any) {
    if (Array.isArray(thing)) {
        return "array"
    }
    if (thing === null) {
        return "null"
    }
    let t = typeof thing;
    if (t === "number" && isNaN(thing)) {
        return "NaN"
    }
    return t
}

export function humanPrintArray(arr: string[], andOr = "or"): string {
    if (arr.length === 0) {
        return "";
    } else if (arr.length === 1) {
        return arr[0]
    }
    return arr.slice(0, arr.length - 1).join(", ") + " " + andOr + " " + arr[arr.length - 1]
}


export function loadTestData(filename: string): { relationships: Relationship[], users: User[] } {
    let data = JSON.parse(fs.readFileSync(filename).toString()) as { relationships: Relationship[], users: User[] };
    let userMap = new Map<number, User>();
    data.users.forEach(x => Object.setPrototypeOf(x, User.prototype));
    data.relationships.forEach(x => Object.setPrototypeOf(x, Relationship.prototype));
    data.users.forEach(x => userMap.set(x.id!, x));
    data.users.forEach(x => {
        if (x.systemId !== null) {
            x.system = userMap.get(x.systemId)!
        }
    });
    data.relationships.forEach(x => {
        x.leftUser = userMap.get(x.leftUserId)!;
        x.rightUser = userMap.get(x.rightUserId)!
    });
    return data;
}

export function awaitAll<T>(values: readonly (T | PromiseLike<T>)[]): Promise<T[]> {
    return new Promise<T[]>((resolve, reject) => {
        let res: T[] = [];
        let errors: any[] = [];
        let index = 0;
        if (values.length === 0) {
            resolve(res);
        } else {
            values.forEach(async (x, i) => {
                try {
                    res[i] = await x
                } catch (e) {
                    errors[i] = e
                }
                index++;
                if (index === values.length) {
                    if (errors.length !== 0) {
                        reject(new AggregateError(errors))
                    } else {
                        resolve(res)
                    }
                }
            })
        }
    })
}

export function waitForReaction(message: Discord.Message, user: Discord.User, timeout = -1) {
    return new Promise<Discord.MessageReaction>((resolve, reject) => {
        let f = (reaction: Discord.MessageReaction, author: Discord.User) => {
            if (reaction.message.id === message.id && author.id === user.id) {
                client.removeListener("messageReactionAdd", f);
                resolve(reaction)
            }
        };
        client.on("messageReactionAdd", f);
        if (timeout > 0) {
            setTimeout(() => {
                client.removeListener("messageReactionAdd", f);
                reject(new Error("timed out"))
            }, timeout);
        }
    })
}

export async function discordRequestChoice<T>(name: string, arr: T[], channel: Discord.TextChannel, author: Discord.User, converter: (t: T) => string): Promise<T> {
    const reactionArr = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🇦", "🇧", "🇨", "🇩", "🇪", "🇫", "🇬", "🇭", "🇮", "🇯", "🇰", "🇱", "🇲", "🇳", "🇴", "🇵", "🇶", "🇷", "🇸", "🇹", "🇺", "🇻", "🇼", "🇾", "🇿"];
    let message = await channel.send("\"" + name + "\" is ambiguous, plz choose " +
        arr.map((x, i) => "\r\n" + i.toString(36) + ": " + converter(x))) as Discord.Message;
    let index = -1;
    while (index < 0 || index >= arr.length) {
        let waitReaction = waitForReaction(message, author);
        if (arr.length <= 36) {
            for (let i = 0; i < arr.length; i++) {
                await message.react(reactionArr[i]);
            }
        }
        let reaction = await waitReaction;
        index = reactionArr.indexOf(reaction.emoji.name);
    }
    return arr[index]

}

export const math = {
    gcd2(a: number, b: number): number {
        // Greatest common divisor of 2 integers
        if (!b) return b === 0 ? a : NaN;
        return math.gcd2(b, a % b);
    },
    gcd(array: number[]) {
        // Greatest common divisor of a list of integers
        let n = 0;
        for (let i = 0; i < array.length; ++i)
            n = math.gcd2(array[i], n);
        return n;
    },
    lcm2(a: number, b: number) {
        // Least common multiple of 2 integers
        return a * b / math.gcd2(a, b);
    },
    lcm(array: number[]) {
        // Least common multiple of a list of integers
        let n = 1;
        for (let i = 0; i < array.length; ++i)
            n = math.lcm2(array[i], n);
        return n;
    }
};


function longToByteArray(long: bigint) {
    const byteArray = [BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0)];

    for (let index = 0; index < byteArray.length; index++) {
        const byte = long & BigInt(0xff);
        byteArray[index] = byte;
        long = (long - byte) / BigInt(256);
    }

    return byteArray;
}

function byteArrayToLong(byteArray: bigint[]) {
    let value = BigInt(0);
    for (let i = byteArray.length - 1; i >= 0; i--) {
        value = (value * BigInt(256)) + byteArray[i];
    }

    return value;
}

export function splitMessageForDiscord(str: string, block: boolean = true): string[] {
    let maxSize = 1998;
    let blockStr = "";
    if (block) {
        blockStr = "```";
        maxSize -= (blockStr.length * 2);
    }
    if (str.length < maxSize) {
        return [blockStr + str + blockStr]
    }
    let res: string[] = [""];
    let split = str.split(/\r?\n/);
    split.forEach(x => {
        if (res[res.length - 1].length + x.length > maxSize) {
            res.push("");
        }
        res[res.length - 1] += x + "\r\n";
    });
    res = res.map(x => blockStr + x + blockStr);
    return res;
}