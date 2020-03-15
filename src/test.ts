import { polyMapGenerate, exportDotScript, svgToPngViaChromium, addLegendAndBackground, generateDotScript } from "./polyMapGenerate";
import Jimp from "jimp"
import * as fs from "fs"
import { PluralKitApi } from "./PluralKitApi";
import { Relationship } from "./Relationship";
import { User } from "./User";
import { spawn, exec } from "child_process";
import { loadTestData } from "./utilities";
import { commands } from "./commands";
import { NumberArgument, StandardArgumentList } from "./Command";
import AggregateError from "aggregate-error";


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

    commands.length
    let { users, relationships } = loadTestData("testdata.json")
    let dotScript = generateDotScript(users, relationships);
    fs.writeFileSync("output.dot", dotScript)
    let output = await addLegendAndBackground(await svgToPngViaChromium(await exportDotScript(dotScript, "svg")))
    fs.writeFileSync("output.png", output)

    console.log("done")
    */

    let a = new AggregateError([])
    for(const b of a){
console.log("a")
    }
})().then(() => process.exit(0)).catch(console.log)