import * as Discord from "discord.js"
import secret from "./secret"
import {AggregateError, commandLineArgSplit} from "./utilities"
import {openDB, polymapCache} from "./db"
import {commands} from "./commands"
import {ArgumentError} from "./Command"
import * as job from "microjob"
import * as fs from "fs"
import * as wasm from "../lib/wasmlib/wasmlib.js"
import * as threads from "worker_threads";

if (process.platform !== "win32" && process.platform !== "linux") {
    console.warn("youre currently running this program on " + process.platform + " which is currently not actively supported")
}

export const client = new Discord.Client();

//hack so that graphvis doesnt fuck me
if ((global as any).util === undefined) {
    (global as any).util = new Proxy(() => {
    }, {
        get() {
            return (global as any).util;
        },
        set() {
            return true;
        },
        apply() {
            return (global as any).util;
        },
        construct() {
            return (global as any).util;
        }
    })
}

(async () => {
    const [db] = await Promise.all([openDB(), job.start()]);


    client.on("ready", async () => {
        console.log("poly-bot online");
        await client.user.setActivity("with polyamory")
    });

    client.on("guildMemberAdd", member => {
        polymapCache.invalidate(member.guild.id)
    });

    client.on("guildMemberRemove", member => {
        polymapCache.invalidate(member.guild.id)
    });

    client.on("message", async message => {
        while (message.guild.memberCount !== message.guild.members.size) {
            await message.guild.fetchMembers()
        }
        const testBots = (process.env.TEST_BOTS || "").split(",");
        if (message.author.bot && !testBots.includes(message.author.id)) {
            return;
        }
        if (message.content.startsWith(secret.PREFIX)) {
            console.log("responding to " + message.content + " in " + message.guild.name);
            let channel = message.channel;
            let userCommand = commandLineArgSplit(message.content.substring(secret.PREFIX.length));
            let command = commands.filter(x => x.name === userCommand.commandName && (x.arguments.validLength(userCommand.args.length)) && x.channelType.includes(channel.type))[0] || null;
            if (command === null) {
                await message.channel.send("there is no command with that name and that amount of arguments");
                return;
            }
            try {
                let respond = await command.call(userCommand.args, message.author, channel, message.guild);
                await respond.respond(message)
            } catch (ae) {
                if (ae instanceof AggregateError) {
                    let errorMessages: string[] = [];
                    for (let i = 0; i < ae.errors.length; i++) {
                        let argError = ae.errors[i];
                        if ((argError as any).argument !== undefined) {
                            errorMessages.push(argError.message)
                        } else {
                            throw argError
                        }
                    }
                    await message.channel.send("***ERROR***```" + errorMessages.join("\r\n") + "```")
                } else {
                    throw ae;
                }
            }
        }

    });


    await client.login(secret.DISCORD_TOKEN)

})();

{
    const consoles = {
        message: console.log,
        info: console.info,
        warning: console.warn,
        error: console.error
    };
    console.log = (...args: any[]) => {
        printToRunner({
            data: args.map(x => x + "").join(", "),
            type: "message"
        })
    };
    console.info = (...args: any[]) => {
        printToRunner({
            data: args.map(x => x + "").join(", "),
            type: "info"
        })
    };
    console.warn = (...args: any[]) => {
        printToRunner({
            data: args.map(x => x + "").join(", "),
            type: "warning"
        })
    };
    console.error = (...args: any[]) => {
        printToRunner({
            data: args.map(x => x.stack ? x.stack : x + "").join(", "),
            type: "error"
        })
    };

    function printToRunner(arg: {
        exit?: number,
        data: string,
        type: "error" | "message" | "warning" | "info"
    }) {
        if (threads.parentPort) {
            threads.parentPort.postMessage(arg)
        } else {
            consoles[arg.type](arg.data);
            if (arg.exit !== undefined) {
                process.exit(arg.exit)
            }
        }
    }

    function onError(error: any) {
        if (error instanceof Error) {
            error = error.stack
        } else {
            error = JSON.stringify(error)
        }
        printToRunner({
            exit: 1,
            data: error,
            type: "error",
        })
    }

    //process.on("unhandledRejection", onError);
    //process.on("uncaughtException", onError)
}

