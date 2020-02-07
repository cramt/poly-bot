export function commandLineArgSplit(str: string): { command: string, args: string[] } {
    let commandNameIndex = str.indexOf(" ")
    if (commandNameIndex === -1) {
        return {
            command: str,
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
        command: commandName,
        args: args
    }
}