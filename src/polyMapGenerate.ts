import { User, genderToColor } from "./User";
import { Relationship, relationshipTypeToColor } from "./Relationship";
import { graph, Node, Graph, Edge, digraph } from "graphviz";
import SECRET from "./SECRET";
import Jimp from "jimp";
import * as fs from "fs"
import { exec } from "child_process";
import * as path from "path"
import * as Thread from "worker_threads"
import { runThreadFunction } from "./utilities";
import puppeteer from "puppeteer"

interface SystemClusterMap {
    [k: string]: {
        subSystems: SystemClusterMap
        cluster: Graph
        user: User
    } | undefined
}

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
    const g = digraph("G")
    g.set("bgcolor", backgroundColor)
    g.set("compound", true)

    systems.forEach(x => {
        let cluster = g.addCluster("\"cluster_" + x.id + "\"")
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
        function getUserNode(user: User): {
            node: Node,
            cluster: Graph | null
        } {
            let asSinglet = userNodeMap.get(user)
            let asSystem = systemClusterMap.get(user)
            if (asSinglet !== undefined) {
                return {
                    node: asSinglet,
                    cluster: null
                }
            }
            else if (asSystem !== undefined) {
                return {
                    node: userNodeMap.get(user.members[0])!,
                    cluster: asSystem
                }
            }
            else {
                throw new Error("user is neither a system nor singlet")
            }
        }
        let n1 = getUserNode(x.rightUser!)
        let n2 = getUserNode(x.leftUser!);
        if (n1 && n2) {
            let edge = g.addEdge(n1.node, n2.node);
            edge.set("color", relationshipTypeToColor[x.type])
            edge.set("arrowhead", "none")

            if (n1.cluster !== null) {
                let id = (n1.cluster as any).id + ""
                edge.set("ltail", id.substring(1, id.length - 1))
            }
            if (n2.cluster !== null) {
                let id = (n2.cluster as any).id + ""
                edge.set("lhead", id.substring(1, id.length - 1))
            }

        }
    });
    return Buffer.from(g.to_dot());
}

export function exportDotScript(dotScript: Buffer, output: "svg" | "png" = "svg"): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        const pwshCommand = "echo '" + dotScript.toString() + "' | " + path.resolve(SECRET.GRAPHVIZ_LOCATION, "unflatten") + " -l 100 | " + path.resolve(SECRET.GRAPHVIZ_LOCATION, "fdp") + " -T" + output
        exec(pwshCommand, process.platform === "win32" ? {
            shell: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"
        } : {}, (error, stdout, stderr) => {
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
