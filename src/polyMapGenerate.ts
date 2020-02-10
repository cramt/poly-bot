import { User, genderToColor } from "./User";
import { Relationship, relationshipTypeToColor } from "./Relationship";
import { graph, Node, Graph } from "graphviz";
import SECRET from "./SECRET";
import Jimp from "jimp";

interface SystemClusterMap {
    [k: string]: {
        subSystems: SystemClusterMap
        cluster: Graph
    } | undefined
}

function graphGenerate(users: User[], relationships: Relationship[]): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        const backgroundColor = "#00000000"
        const userNodeMap = new Map<User, Node>();
        const systemClusterMap: SystemClusterMap = {}
        const g = graph("G")
        g.set("bgcolor", backgroundColor)


        function buildNode(user: User, graph: Graph) {
            let systems = user.name.split(".")
            let username = systems[systems.length - 1]
            systems = systems.slice(0, systems.length - 1)
            systems.forEach((system, i) => {
                if (systemClusterMap[system] === undefined) {
                    let cluster = g.addCluster("cluster_" + systems.slice(0, i).join("_"));
                    systemClusterMap[system] = {
                        cluster: cluster,
                        subSystems: {}
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
            node.set("fillcolor", color)
            userNodeMap.set(user, node)
        }

        users.forEach(x => buildNode(x, g))
        relationships.forEach(x => {
            let n1 = userNodeMap.get(x.rightUser);
            let n2 = userNodeMap.get(x.leftUser);
            if (n1 && n2) {
                let edge = g.addEdge(n1, n2)
                edge.set("color", relationshipTypeToColor[x.type])
                edge.set("arrowhead", "none")
            }
        });
        (g as any).output({
            type: "png",
            path: SECRET.GRAPHVIZ_LOCATION
        }, (e: Buffer) => {
            resolve(e)
        }, (e: object) => {
            reject("couldnt generate\n" + g.to_dot())
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