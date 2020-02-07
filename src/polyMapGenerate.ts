import { User, genderToColor } from "./User";
import { Relationship, relationshipTypeToColor } from "./Relationship";
import { digraph, Node } from "graphviz";
import SECRET from "./SECRET";

export function polyMapGenerate(users: User[], relationships: Relationship[]): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {

        const userNodeMap = new Map<User, Node>();
        const g = digraph("G")

        users.forEach(x => {
            let color = genderToColor[x.gender];
            let node = g.addNode(x.name, { color: color, fillcolor: color, style: "rounded", shape: "rect" })
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