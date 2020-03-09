import * as Thread from "worker_threads"
import * as fs from "fs"
import { Relationship } from "./Relationship"
import { User } from "./User"

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

export interface ThreadFunctionArgs {
    name: string
    args: any[]
}

export function runThreadFunction(args: ThreadFunctionArgs): Promise<any> {
    return new Promise((resolve, reject) => {
        const worker = new Thread.Worker(__filename, {
            workerData: args
        })
        worker.once("message", resolve)
        worker.once("error", reject)
    })
}

export function loadTestData(filename: string): { relationships: Relationship[], users: User[] } {
    let data = JSON.parse(fs.readFileSync(filename).toString()) as { relationships: Relationship[], users: User[] }
    let userMap = new Map<number, User>();
    data.users.forEach(x => userMap.set(x.id!, x));
    data.users.forEach(x => {
        if (x.systemId !== null) {
            x.system = userMap.get(x.systemId)!
        }
    })
    data.relationships.forEach(x => {
        x.leftUser = userMap.get(x.leftUserId)!
        x.rightUser = userMap.get(x.rightUserId)!
    })
    return data;
}

