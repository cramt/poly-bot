import * as Discord from "discord.js"
import SECRET from "./SECRET"
import { commandLineArgSplit } from "./utilities"
import { openDB } from "./db"
import { commands } from "./commands"
import { ArgumentError, Argument } from "./Command"
import AggregateError from "aggregate-error"
import * as job from "microjob"

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

    let listeners = new Map<string, ((message: Discord.Message) => Promise<boolean>)[]>()

    client.on("message", async message => {
        if (message.author.bot) {
            return;
        }
        if (listeners.get(message.channel.id) !== undefined) {
            let newListeners: ((message: Discord.Message) => Promise<boolean>)[] = []
            listeners.get(message.channel.id)!.forEach(x => {
                if (x(message)) {
                    newListeners.push(x)
                }
            })
            listeners.set(message.channel.id, newListeners)
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
                listeners.set(message.channel.id, [])
                listeners.get(message.channel.id)!.push(...respond.listeners)
                respond.addListner = func => {
                    listeners.get(message.channel.id)!.push(func)
                }
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