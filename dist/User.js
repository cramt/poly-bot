"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var User = /** @class */ (function () {
    function User(name, gender) {
        this.name = name.split(" ").map(function (x) { return x.toUpperCase(); }).join(" ");
        this.gender = gender;
    }
    return User;
}());
exports.User = User;
exports.genderToColor = {
    "FEMME": "red",
    "MASC": "blue",
    "NEUTER": "white",
    "SYSTEM": "yellow"
};
