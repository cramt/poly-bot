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

interface SystemClusterMap {
    [k: string]: {
        subSystems: SystemClusterMap
        cluster: Graph
        user: User
    } | undefined
}

let viz = new (require("viz.js"))(require("viz.js/full.render.js"));

export function generateDotScript(users: User[], relationships: Relationship[]): Buffer {
    const backgroundColor = "#00000000"
    let usersSystems = users.filter(x => x.gender === "SYSTEM" && users.find(y => y.name.startsWith(x.name + ".")))
    let usersNotSystems = users.filter(x => !usersSystems.includes(x))
    const userNodeMap = new Map<User, Node>();
    const systemClusterMap: SystemClusterMap = {}
    const sytemUserMap = new Map<string, User>()
    usersSystems.forEach(x => sytemUserMap.set(x.name, x))
    const g = digraph("G")
    g.set("splines", "polyline")
    g.set("bgcolor", backgroundColor)
    g.set("compound", true)

    function buildNode(user: User, graph: Graph) {
        let systems = user.name.split(".")
        let username = systems[systems.length - 1]
        systems = systems.slice(0, systems.length - 1)
        systems.forEach((system, i) => {
            if (systemClusterMap[system] === undefined) {
                let systemName = systems.splice(0, i + 1).join(".")
                let cluster = g.addCluster("\"cluster_" + systemName + "\"");
                systemClusterMap[system] = {
                    cluster: cluster,
                    subSystems: {},
                    user: sytemUserMap.get(systemName)!
                }
                cluster.set("label", system)
                cluster.set("fontname", "arial")
            }
            graph = systemClusterMap[system]?.cluster!
        })
        /*
        let c: Graph
        let systemName = username.slice(0, dotPos)
        let memberName = username.slice(dotPos + 1)
        if (systemClusterMap.has(systemName)) {
            c = systemClusterMap.get(systemName)!
        }
        else {
            c = graph.addCluster("cluster_" + systemName)
            systemClusterMap.set()
            c.set("label", systemName)
        }
        buildNode(user, memberName, c)
        */
        let color = genderToColor[user.gender];
        let node = graph.addNode(username, { color: "black", fillcolor: color, style: "filled", shape: "ellipse", fontname: "arial" })
        node.set("label", username)
        node.set("fillcolor", color)
        userNodeMap.set(user, node)
    }

    usersNotSystems.forEach(x => buildNode(x, g))
    relationships.forEach(x => {
        function getUserNode(user: User): {
            node: Node,
            cluster: Graph | null
        } {
            if (usersSystems.includes(user)) {
                let temp = systemClusterMap;
                let cluster: Graph | null = null;
                user.name.split(".").forEach(x => {
                    let t = temp[x]!
                    cluster = t.cluster!;
                    temp = t.subSystems
                })

                let n = userNodeMap.get(usersNotSystems.find(x => x.name.startsWith(user.name))!)!
                return {
                    node: n!,
                    cluster: cluster
                }
            }
            else {
                return {
                    node: userNodeMap.get(user)!,
                    cluster: null
                }
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
        const pwshCommand = "echo '" + dotScript.toString() + "' | " + path.resolve(SECRET.GRAPHVIZ_LOCATION, "unflatten") + " -l 100 | " + path.resolve(SECRET.GRAPHVIZ_LOCATION, "dot") + " -T" + output
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

function graphGenerate(users: User[], relationships: Relationship[]): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        let g = "";
        /*
        viz.renderString(g.to_dot()).then((x: string) => {
            svg2img(x, (err: any, buffer: Buffer) => {
                if (err) {
                    reject(err)
                }
                else {
                    resolve(buffer)
                }
            })
        }).catch(reject)
        */
        (g as any).output({
            type: "png",
            path: SECRET.GRAPHVIZ_LOCATION
        }, (e: Buffer) => {
            resolve(e)
        }, (code: number, out: string, err: string) => {
            reject({
                code,
                err,
                out
            })
        })

    })
}

export async function polyMapGenerate(users: User[], relationships: Relationship[]): Promise<Buffer> {
    let [graph, transFlag, legend] = await Promise.all([
        graphGenerate(users, relationships).then(Jimp.read),
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
