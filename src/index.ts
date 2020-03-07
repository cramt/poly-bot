import { User, genderToColor } from "./User"
import { Relationship, relationshipTypeToColor } from "./Relationship"
import * as fs from "fs"
import { polyMapGenerate } from "./polyMapGenerate"
import * as Discord from "discord.js"
import SECRET from "./SECRET"
import { commandLineArgSplit, ThreadFunctionArgs } from "./utilities"
import { openDB } from "./db"
import { commands } from "./commands"
import { AnyArgumentCommand } from "./Command"
import * as Thread from "worker_threads"
import * as threadFunctions from "./threadFunctions"

export const prefix = SECRET.PREFIX

export const client = new Discord.Client();

if (Thread.isMainThread) {

    //hack so that graphvis doesnt fuck me
    if ((global as any).util === undefined) {
        (global as any).util = new Proxy(() => { }, {
            get() {
                return (global as any).util;
            },
            set() {
                return true;
            },
            apply(that, args) {
                return (global as any).util;
            },
            construct() {
                return (global as any).util;
            }
        })
    }

    process.on("unhandledRejection", console.log)

    const dbPromise = openDB()

    client.on("ready", async () => {
        await dbPromise
        client.user.setActivity("with polyamory")
    })

    client.on("message", async message => {
        await dbPromise
        if (message.author.bot) {
            return;
        }
        if (message.content.startsWith(prefix)) {
            let channel = message.channel;
            let userCommand = commandLineArgSplit(message.content.substring(prefix.length))
            let command = commands.filter(x => x.name === userCommand.commandName && (userCommand.args.length === x.arguments.length || x instanceof AnyArgumentCommand) && x.channelType.includes(channel.type))[0] || null
            if (command === null) {
                await message.channel.send("there is no command with that name and that amount of arguments")
                return;
            }
            let invalidArgs = await command.argErrors(userCommand.args, channel)
            if (invalidArgs.length > 0) {
                await message.channel.send("argument " + invalidArgs.join(", ") + " did not receive the proper type")
                return;
            }
            (await command.call(userCommand.args, message.author, channel, message.guild)).respond(message)
        }

    })


    client.login(SECRET.DISCORD_TOKEN)

}
else {
    let args = Thread.workerData as ThreadFunctionArgs
    let functions = threadFunctions as any
    let func = functions[args.name]
    if (func === undefined) {
        throw new Error("theadFunction doesnt exist")
    }
    else {
        (async () => {
            Thread.parentPort?.postMessage(await func(...args.args))
        })()
    }
}