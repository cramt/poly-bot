import { openDB, getAllInGuild, createNewRelationship } from "./db";
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
    let relationships: Relationship[] = []
    let users: User[] = []
    let keira = new User("Campfire.Keira", "FEMME", id, null)
    let camp = new User("Campfire.Camp", "FEMME", id, null)
    let mistress = new User("Campfire.Mistress", "FEMME", id, null)
    let alex = new User("Alexandra", "FEMME", id, null)
    users.push(keira)
    users.push(camp)
    users.push(alex)
    users.push(mistress)

    relationships.push(new Relationship("SEXUAL", alex, camp, id))
    relationships.push(new Relationship("SEXUAL", alex, keira, id))

    let buffer = await polyMapGenerate(users, relationships)

    if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile)
    }
    let stream = fs.createWriteStream(outputFile)
    stream.write(buffer)
    stream.close()


})().then().catch(console.log)