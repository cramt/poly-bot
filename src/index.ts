import { User, genderToColor } from "./User"
import { Relationship, relationshipTypeToColor } from "./Relationship"
import * as fs from "fs"
import { polyMapGenerate } from "./polyMapGenerate"
import * as Discord from "discord.js"
import SECRET from "./SECRET"
import { commandLineArgSplit } from "./utilities"
import { commands } from "./Command"

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

const prefix = "/poly "

export const client = new Discord.Client();

client.on("ready", () => {
    console.log("im on")
    client.user.setActivity("with polyamory")
})

client.on("message", message => {
    if (message.content.startsWith(prefix)) {
        let userCommand = commandLineArgSplit(message.content.substring(prefix.length))
        let command = commands.filter(x => x.name === userCommand.commandName && userCommand.args.length === x.arguments.length)[0] || null
        if (command === null) {
            message.channel.send("there is no command with that name and that amount of arguments")
            return;
        }
        let invalidArgs = command.argErrors(userCommand.args)
        if (invalidArgs.length > 0) {
            message.channel.send("argument " + invalidArgs.join(", ") + " did not receive the proper type")
            return;
        }
        command.call(userCommand.args, message.author).respond(message)
    }

})


client.login(SECRET.DISCORD_TOKEN)


/*

let users: User[] = []
let relationships: Relationship[] = [];

(() => {
    const lucca = new User("lucca", "FEMME")
    users[users.length] = lucca
    const alma = new User("alma", "FEMME")
    users[users.length] = alma
    const zoe = new User("zoe", "FEMME")
    users[users.length] = zoe
    const table = new User("table sytem", "SYSTEM")
    users[users.length] = table
    const martine = new User("martine", "FEMME")
    users[users.length] = martine

    relationships[relationships.length] = new Relationship("ROMANTIC", lucca, alma)
    relationships[relationships.length] = new Relationship("ROMANTIC", lucca, zoe)
    relationships[relationships.length] = new Relationship("ROMANTIC", lucca, martine)
    relationships[relationships.length] = new Relationship("ROMANTIC", lucca, table)
    relationships[relationships.length] = new Relationship("ROMANTIC", alma, zoe)
    relationships[relationships.length] = new Relationship("ROMANTIC", alma, table)
    relationships[relationships.length] = new Relationship("ROMANTIC", alma, martine)
    relationships[relationships.length] = new Relationship("FRIEND", zoe, martine)
    relationships[relationships.length] = new Relationship("ROMANTIC", zoe, table)
    relationships[relationships.length] = new Relationship("ROMANTIC", table, martine)
})();

polyMapGenerate(users, relationships).then(x => {
    if (fs.existsSync("output.png")) {
        fs.unlinkSync("output.png")
    }
    let f = fs.createWriteStream("output.png")
    f.write(x)
    f.close();
})
*/