export function commandLineArgSplit(str: string): { commandName: string, args: string[] } {
    let commandNameIndex = str.indexOf(" ")
    if (commandNameIndex === -1) {
        return {
            commandName: str,
            args: []
        }
    }
    let commandName = str.substring(0, commandNameIndex)
    let argsStr = str.substring(commandNameIndex + 1)
    let prevChar = ""
    let strBuilder = ""
    let ignoreSpace = false
    let args: string[] = []
    for (let i = 0; i < argsStr.length; i++) {
        let char = argsStr[i]
        if (prevChar === "\\") {
            strBuilder += char
            prevChar = char
            continue;
        }
        if (char === "\\") {
            prevChar = char;
            continue;
        }
        if (char === "\"") {
            ignoreSpace = !ignoreSpace
            prevChar = char;
            continue;
        }
        if (char === " " && !ignoreSpace) {
            if (prevChar != " ") {
                args[args.length] = strBuilder
                strBuilder = "";
            }
            prevChar = char
            continue;
        }
        strBuilder += char
        prevChar = char
    }
    args[args.length] = strBuilder
    strBuilder = "";
    return {
        commandName: commandName,
        args: args
    }
}

export function getType(thing: any) {
    if (Array.isArray(thing)) {
        return "array"
    }
    if (thing === null) {
        return "null"
    }
    let t = typeof thing;
    if (t === "number" && isNaN(thing)) {
        return "NaN"
    }
    return t
}

export function humanPrintArray(arr: string[], andOr = "or"): string {
    if (arr.length === 0) {
        return "";
    }
    else if (arr.length === 1) {
        return arr[0]
    }
    return arr.slice(0, arr.length - 1).join(", ") + " " + andOr + " " + arr[arr.length - 1]
}