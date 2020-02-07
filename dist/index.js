"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Discord = __importStar(require("discord.js"));
var SECRET_1 = __importDefault(require("./SECRET"));
var utilities_1 = require("./utilities");
//hack so that graphvis doesnt fuck me
if (global.util === undefined) {
    global.util = new Proxy(function () { }, {
        get: function () {
            return global.util;
        },
        set: function () {
            return true;
        },
        apply: function (that, args) {
            return global.util;
        },
        construct: function () {
            return global.util;
        }
    });
}
var prefix = "/poly ";
var client = new Discord.Client();
client.on("ready", function () {
    console.log("im on");
    client.user.setActivity("with polyamory");
});
client.on("message", function (message) {
    if (message.content.startsWith(prefix)) {
        var command = utilities_1.commandLineArgSplit(message.content.substring(prefix.length));
        console.log(command);
    }
});
client.login(SECRET_1.default.DISCORD_TOKEN);
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
