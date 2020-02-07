"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Relationship = /** @class */ (function () {
    function Relationship(type, leftUser, rightUser) {
        this.type = type;
        this.leftUser = leftUser;
        this.rightUser = rightUser;
    }
    return Relationship;
}());
exports.Relationship = Relationship;
exports.relationshipTypeToColor = {
    "ROMANTIC": "red",
    "SEXUAL": "purple",
    "FRIEND": "green",
    "LIVES WITH": "yellow",
    "IN SYSTEM WITH": "blue",
    "CUDDLES WITH": "orange",
};
