const cp = require("child_process")
const fs = require('fs');
const path = require('path');
const threads = require("worker_threads")
const dateformat = require("dateformat")

const PRODUCTION = process.env.NODE_ENV === "production"

const deleteFolderRecursive = function (_path) {
    if (fs.existsSync(_path)) {
        fs.readdirSync(_path).forEach((file, index) => {
            const curPath = path.join(_path, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(_path);
    }
};

function copyFileSync(source, target) {

    let targetFile = target;
    if (fs.existsSync(target)) {
        if (fs.lstatSync(target).isDirectory()) {
            targetFile = path.join(target, path.basename(source));
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync(source, target) {
    let files = [];

    let targetFolder = path.join(target, path.basename(source));
    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder);
    }

    if (fs.lstatSync(source).isDirectory()) {
        files = fs.readdirSync(source);
        files.forEach(function (file) {
            var curSource = path.join(source, file);
            if (fs.lstatSync(curSource).isDirectory()) {
                copyFolderRecursiveSync(curSource, targetFolder);
            } else {
                copyFileSync(curSource, targetFolder);
            }
        });
    }
}

let tsc = new Promise((resolve, reject) => {
    cp.exec("tsc", (err, stdout, stderr) => {
        console.log("tsc-out: " + stdout)
        console.log("tsc-err: " + stderr)
        if (err) {
            console.log("ERROR: " + err)
            reject(err)
        }
        else {
            resolve();
        }
    })
})

let copy = new Promise((resolve, reject) => {
    try {
        if (fs.existsSync("dist")) {
            deleteFolderRecursive("dist");
        }
        fs.mkdirSync("dist")
        fs.mkdirSync("dist/lib")
        copyFolderRecursiveSync("lib/wasmlib", "dist/lib")
        resolve()
    }
    catch (e) { reject(e) }
});

const formatNow = () => dateformat(new Date(), "yyyy-mm-dd,HH-MM-ss");

const indexPath = path.resolve(__dirname, "../dist/src/index.js");

function startProd() {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync("logs")) {
            fs.mkdirSync("logs")
        }
        const log = fs.createWriteStream("logs/" + formatNow() + ".log")
        const main = new threads.Worker(indexPath);
        main.on("message", message => {
            log.write(message.type + " at " + formatNow() + ": " + message.data + "\n")
            if (message.exit !== undefined) {
                log.write("exited with exit code " + message.exit)
                main.terminate();
                resolve(message.exit)
            }
        })
    })
}

console.log("running in " + (PRODUCTION ? "production" : "development") + " mode")

function startDev() {
    require(indexPath)
}

(async () => {
    try {
        await Promise.all([tsc, copy])
    }
    catch (e) {
        console.log("could not start")
        console.log(e)
        process.exit(1)
    }
    if (PRODUCTION) {
        while (true) {
            console.log("exited with code " + await startProd())
            console.log("restarting")
        }
    }
    else{
        startDev();
    }
})()