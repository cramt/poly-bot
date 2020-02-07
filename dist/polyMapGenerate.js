"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var User_1 = require("./User");
var Relationship_1 = require("./Relationship");
var graphviz_1 = require("graphviz");
function polyMapGenerate(users, relationships) {
    return new Promise(function (resolve, reject) {
        var userNodeMap = new Map();
        var g = graphviz_1.digraph("G");
        users.forEach(function (x) {
            var color = User_1.genderToColor[x.gender];
            var node = g.addNode(x.name, { color: color, fillcolor: color, style: "rounded", shape: "rect" });
            userNodeMap.set(x, node);
        });
        relationships.forEach(function (x) {
            var n1 = userNodeMap.get(x.rightUser);
            var n2 = userNodeMap.get(x.leftUser);
            if (n1 && n2) {
                var edge = g.addEdge(n1, n2);
                edge.set("color", Relationship_1.relationshipTypeToColor[x.type]);
                edge.set("arrowhead", "none");
            }
        });
        g.output({
            type: "png",
            path: "D:\\programs\\Graphviz2.38\\bin"
        }, function (e) {
            resolve(e);
        }, function (e) {
            reject(e);
        });
    });
}
exports.polyMapGenerate = polyMapGenerate;
