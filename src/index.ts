import * as Discord from "discord.js"
import SECRET from "./SECRET"
import { commandLineArgSplit } from "./utilities"
import { openDB } from "./db"
import { commands } from "./commands"
import { ArgumentError } from "./Command"
import AggregateError from "aggregate-error"
import * as job from "microjob"
import * as fs from "fs"
import { wasm as wasm } from "../lib/wasmlib.js"
console.log(wasm.add(1, 2))

export const prefix = SECRET.PREFIX

export const client = new Discord.Client();

//hack so that graphvis doesnt fuck me
if ((global as any).util === undefined) {
    (global as any).util = new Proxy(() => { }, {
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
    const [db] = await Promise.all([openDB(), job.start()])


    client.on("ready", async () => {
        client.user.setActivity("with polyamory")
    })

    client.on("message", async message => {
        while (message.guild.memberCount !== message.guild.members.size) {
            await message.guild.fetchMembers()
        }
        if (message.author.bot) {
            return;
        }
        if (message.content.startsWith(prefix)) {
            let channel = message.channel;
            let userCommand = commandLineArgSplit(message.content.substring(prefix.length))
            let command = commands.filter(x => x.name === userCommand.commandName && (x.arguments.validLength(userCommand.args.length)) && x.channelType.includes(channel.type))[0] || null
            if (command === null) {
                await message.channel.send("there is no command with that name and that amount of arguments")
                return;
            }
            try {
                let respond = await command.call(userCommand.args, message.author, channel, message.guild)
                await respond.respond(message)
            }
            catch (ae) {
                if (ae instanceof AggregateError) {
                    let errorMessages: string[] = []
                    for (const argError of ae) {
                        if (argError instanceof ArgumentError) {
                            errorMessages.push(argError.message)
                        }
                        else {
                            throw argError
                        }
                    }
                    await message.channel.send("***ERROR***```" + errorMessages.join("\r\n") + "```")
                }
                else {
                    throw ae;
                }
            }
        }

    })


    client.login(SECRET.DISCORD_TOKEN)

})()