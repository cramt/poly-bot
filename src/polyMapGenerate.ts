import { User, genderToColor, DiscordUser } from "./User";
import { Relationship, relationshipTypeToColor } from "./Relationship";
import { graph, Node, Graph } from "graphviz";
import SECRET from "./SECRET";
import Jimp from "jimp";
import { exec } from "child_process";
import * as path from "path"
import puppeteer from "puppeteer"
import * as Discord from "discord.js"
import { polymapCache } from "./db";
import { writeFileSync } from "fs";
import xml2js from "xml2js"

//@alex you fuckwit, youre gonna forgot, so use this for gif stuff in the future https://www.npmjs.com/package/gifwrap

export function generateDotScript(users: User[], relationships: Relationship[]): Buffer {
    const backgroundColor = "#00000000"
    let systems: User[] = []
    let singlets: User[] = []
    users.forEach(x => {
        if (x.members.length === 0) {
            singlets.push(x)
        }
        else {
            systems.push(x)
        }
    })
    const userNodeMap = new Map<User, Node>();
    const systemClusterMap = new Map<User, Graph>();
    const sytemUserMap = new Map<string, User>()
    systems.forEach(x => sytemUserMap.set(x.name, x))
    const g = graph("G")
    g.set("splines", "polyline")
    g.set("bgcolor", backgroundColor)
    g.set("compound", true)

    systems.forEach(x => {
        let cluster = g.addCluster("cluster_" + x.id)
        cluster.set("label", x.name)
        cluster.set("fontname", "arial")
        systemClusterMap.set(x, cluster)
    })

    singlets.forEach(x => {
        let color = genderToColor[x.gender];
        let graph = systemClusterMap.get(x.system!)
        if (graph === undefined) {
            graph = g
        }
        let node = graph.addNode(x.id + "", { color: "black", fillcolor: color, style: "filled", shape: "ellipse", fontname: "arial" })
        node.set("label", x.name)
        node.set("fillcolor", color)
        userNodeMap.set(x, node)
    })

    relationships.forEach(x => {
        let n1 = userNodeMap.get(x.rightUser!) || systemClusterMap.get(x.rightUser!)
        let n2 = userNodeMap.get(x.leftUser!) || systemClusterMap.get(x.leftUser!)
        if (n1 && n2) {
            let edge = g.addEdge(n1, n2);
            edge.set("color", relationshipTypeToColor[x.type])
            edge.set("arrowhead", "none")
        }
    });
    return Buffer.from(g.to_dot());
}

export function exportDotScript(dotScript: Buffer, output: "svg" | "png" = "svg"): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        //" + path.resolve(SECRET.GRAPHVIZ_LOCATION, "unflatten") + " -l 100 |
        const pwshCommand = "echo '" + dotScript.toString() + "' | " + path.resolve(SECRET.GRAPHVIZ_LOCATION, "fdp") + " -Goverlap=prism -Goverlap_scaling=2 -Gsep=+20 -Gsplines -T" + output
        exec(pwshCommand, process.platform === "win32" ? {
            shell: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"
        } : {}, (error, stdout) => {
            if (error) {
                reject(error)
            }
            resolve(Buffer.from(stdout))
        });
    })
}

const browser = puppeteer.launch();

export async function svgToPngViaChromium(svg: Buffer): Promise<Buffer> {
    let page = await (await browser).newPage()
    await page.setContent("<html><head></head><body>" + svg.toString() + "</body></html>")
    const svgElement = await page.$("svg")
    await page.evaluate(() => {
        document.body.style.background = 'transparent'
        document.getElementsByTagName("svg")[0].style.overflow = "hidden"
        document.body.style.overflow = 'hidden'
    });
    let result = await svgElement?.screenshot({ omitBackground: true })!
    await page.close()
    return result

}

export async function addLegendAndBackground(image: Buffer): Promise<Buffer> {
    let [graph, transFlag, legend] = await Promise.all([
        Jimp.read(image),
        Jimp.read("transflag.png"),
        Jimp.read("legend.png")
    ])

    transFlag.resize(graph.bitmap.width + legend.bitmap.width, Math.max(graph.bitmap.height, legend.bitmap.height))

    transFlag.composite(legend, 0, 0, {
        mode: Jimp.BLEND_SOURCE_OVER,
        opacityDest: 1,
        opacitySource: 1
    })

    transFlag.composite(graph, legend.bitmap.width, 0, {
        mode: Jimp.BLEND_SOURCE_OVER,
        opacityDest: 1,
        opacitySource: 1,
    })

    return await transFlag.getBufferAsync("image/png");
}

export async function polyMapGenerate(users: User[], relationships: Relationship[]): Promise<Buffer> {
    return await addLegendAndBackground(await svgToPngViaChromium(await exportDotScript(generateDotScript(users, relationships), "svg")))
}

export async function cachedPolyMapGenerate(users: User[], relationships: Relationship[], guild: Discord.Guild | string): Promise<Buffer> {
    if (typeof guild === "object") {
        guild = guild.id
    }
    let cache = await polymapCache.get(guild)
    if (cache = null) {
        cache = await polyMapGenerate(users, relationships)
        polymapCache.set(cache, users.filter(x => x instanceof DiscordUser).map(x => (x as DiscordUser).discordId), guild)
    }
    return await polyMapGenerate(users, relationships);
}

export async function transformSvgToAllowEmoji(svg: Buffer): Promise<Buffer> {
    let result = await xml2js.parseStringPromise(svg.toString());
    result.svg.g[0].g.filter((x: any) => x.$.class === "node").forEach((x: any) => {
        let text = x.text[0]
        delete x.text
        let ellipse = x.ellipse[0]
        let { cx, cy, rx, ry } = ellipse.$
        cx = parseFloat(cx)
        cy = parseFloat(cy)
        rx = parseFloat(rx)
        ry = parseFloat(ry)
        let regex = /(.+?(?=<))<(a?):[^:]+:(\d*)>(.*)/gm
        let imgOrText: ({
            id: string,
            animated: boolean
        } | string)[] = []
        function rec(str: string) {
            let res = regex.exec(str)
            console.log(res)
            if (res === null) {
                imgOrText.push(str)
                return;
            }
            if (res[1] !== "") {
                imgOrText.push(res[1])
            }
            imgOrText.push({
                id: res[3],
                animated: res[2] === "a"
            })
            rec(res[4])
        }
        rec(text._)
        x.foreignObject = [{
            _: "",
            $: {
                x: cx - rx,
                y: cy - ry,
                height: ry * 2,
                width: rx * 2,
            },
            div: [{
                _: "",
                $: {
                    xmlns: "http://www.w3.org/1999/xhtml",
                    style: "display: flex; justify-content: center; align-items: center; width:100%; height:100%"
                },
                div: [{
                    _: "",
                    $: {
                        xmlns: "http://www.w3.org/1999/xhtml",
                        style: "font-family: arial; font-size: 14px"
                    },
                    span: imgOrText.map(x => {
                        if (typeof x === "object") {
                            return {
                                _: "",
                                $: {
                                    xmlns: "http://www.w3.org/1999/xhtml",
                                },
                                img: [{
                                    $: {
                                        xmlns: "http://www.w3.org/1999/xhtml",
                                        src: "https://cdn.discordapp.com/emojis/" + x.id,
                                        height: "16",
                                        width: "16"
                                    }
                                }]
                            }
                        }
                        else {
                            return {
                                _: x,
                                $: {
                                    xmlns: "http://www.w3.org/1999/xhtml",
                                },
                            }
                        }
                    })
                }]
            }]
        }]
    })
    return Buffer.from(new xml2js.Builder().buildObject(result))
}