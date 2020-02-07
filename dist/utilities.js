"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function commandLineArgSplit(str) {
    var commandNameIndex = str.indexOf(" ");
    if (commandNameIndex === -1) {
        return {
            command: str,
            args: []
        };
    }
    var commandName = str.substring(0, commandNameIndex);
    var argsStr = str.substring(commandNameIndex + 1);
    var prevChar = "";
    var strBuilder = "";
    var ignoreSpace = false;
    var args = [];
    for (var i = 0; i < argsStr.length; i++) {
        var char = argsStr[i];
        if (prevChar === "\\") {
            strBuilder += char;
            prevChar = char;
            continue;
        }
        if (char === "\\") {
            prevChar = char;
            continue;
        }
        if (char === "\"") {
            ignoreSpace = !ignoreSpace;
            prevChar = char;
            continue;
        }
        if (char === " " && !ignoreSpace) {
            if (prevChar != " ") {
                args[args.length] = strBuilder;
                strBuilder = "";
            }
            prevChar = char;
            continue;
        }
        strBuilder += char;
        prevChar = char;
    }
    args[args.length] = strBuilder;
    strBuilder = "";
    return {
        command: commandName,
        args: args
    };
}
exports.commandLineArgSplit = commandLineArgSplit;
