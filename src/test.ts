import { openDB, getAllInGuild, createNewRelationship, genderStringToInt } from "./db";
import { polyMapGenerate } from "./polyMapGenerate";
import Jimp from "jimp"
import * as fs from "fs"
import { PluralKitApi } from "./PluralKitApi";
import { Relationship } from "./Relationship";
import { User } from "./User";

/*
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

interface Color {
    r: number
    g: number
    b: number
    a: number
}
function parseHexToObj(hex: string) {
    hex = hex.slice(1)
    let obj: Color = { r: 255, g: 255, b: 255, a: 255 }
    if (hex.length >= 6) {
        obj.r = parseInt(hex.substring(0, 2), 16)
        obj.g = parseInt(hex.substring(2, 4), 16)
        obj.b = parseInt(hex.substring(4, 6), 16)
    }
    if (hex.length === 8) {
        obj.a = parseInt(hex.substring(6, 8), 16)
    }
    return obj;
}



*/

const id = "634515225369903114";
const outputFile = "output.png";


(async () => {
    /*
    await openDB()
    let all = await getAllInGuild('634515225369903114')
    let buffer = await polyMapGenerate(all.users, all.relationships)

    if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile)
    }
    let stream = fs.createWriteStream(outputFile)
    stream.write(buffer)
    stream.close()
    console.log("done")
    */

    let user = new User("Coding System.Kassandra.Alex", "NEUTER", "634515225369903114", "test_discord_id")

   let data = []
   let split = user.name.split(".")
   for (let i = 0; i < split.length; i++) {
       data[data.length] = genderStringToInt["SYSTEM"]
       data[data.length] = null;
       data[data.length] = split.slice(0, i + 1).join(".")
       data[data.length] = user.guildId;
       
       
   }
   data[1] = user.discordId
   data = data.reverse()
   data[3] = genderStringToInt[user.gender]

   console.log(data)

})().then().catch(console.log)