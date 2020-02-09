import { User, genderToColor } from "./User";
import { Relationship, relationshipTypeToColor } from "./Relationship";
import { digraph, Node } from "graphviz";
import SECRET from "./SECRET";
import Jimp from "jimp";

function graphGenerate(users: User[], relationships: Relationship[]): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        const backgroundColor = "#00000000"
        const userNodeMap = new Map<User, Node>();
        const g = digraph("G")
        g.set("bgcolor", backgroundColor)

        users.forEach(x => {
            let color = genderToColor[x.gender];
            let node = g.addNode(x.name, { color: "black", fillcolor: color, style: "filled", shape: "ellipse", fontname: "arial" })
            node.set("fillcolor", color)
            userNodeMap.set(x, node)
        })
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
            reject(e)
        })
    })
}

export async function polyMapGenerate(users: User[], relationships: Relationship[]): Promise<Buffer> {
    let buffer = await graphGenerate(users, relationships)

    let graph = await Jimp.read(buffer)
    let transFlag = await Jimp.read("transflag.png")
    let legend = await Jimp.read("legend.png")

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

    buffer = await transFlag.getBufferAsync("image/png");

    return buffer;
}