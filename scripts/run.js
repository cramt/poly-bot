const cp = require("child_process");
const fs = require('fs');
const path = require('path');
const threads = require("worker_threads");
const dateformat = require("dateformat");
const http = require("http");

const PRODUCTION = process.env.NODE_ENV === "production";

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

function gitPullAndRestart() {
    cp.spawn("got pull && node " + process.argv[0], process.argv.slice(1), {
        stdio: "ignore"
    }).unref();
    process.exit(0);
}

const indexPath = path.resolve(__dirname, "../dist/src/index.js");

const formatNow = () => dateformat(new Date(), "yyyy-mm-dd,HH-MM-ss");

class StartDev {
    constructor() {
        require(indexPath)
    }
}

class StartProd {
    constructor() {

    }

    async kill() {
        await this.thread.terminate()
    }

    init() {
        return new Promise(async (resolve1, reject) => {
            while (true) {
                let code = await new Promise((resolve2, reject2) => {
                    if (!fs.existsSync("logs")) {
                        fs.mkdirSync("logs")
                    }
                    const log = fs.createWriteStream("logs/" + formatNow() + ".log");
                    const main = new threads.Worker(indexPath);
                    this.thread = main;
                    main.on("message", message => {
                        log.write(message.type + " at " + formatNow() + ": " + message.data + "\n");
                        if (message.exit !== undefined) {
                            log.write("exited with exit code " + message.exit);
                            main.terminate();
                            resolve2(message.exit)
                        }
                    });
                    main.on("online", () => {
                        resolve1()
                    })
                });
                console.log("exited with code " + code);
                console.log("restarting")
            }
        })
    }
}

async function compile() {
    let tsc = new Promise((resolve, reject) => {
        cp.exec("tsc", (err, stdout, stderr) => {
            console.log("tsc-out: " + stdout);
            console.log("tsc-err: " + stderr);
            if (err) {
                console.log("ERROR: " + err);
                reject(err)
            } else {
                resolve();
            }
        })
    });

    let copy = new Promise((resolve, reject) => {
        try {
            if (fs.existsSync("dist")) {
                deleteFolderRecursive("dist");
            }
            fs.mkdirSync("dist");
            fs.mkdirSync("dist/lib");
            copyFolderRecursiveSync("lib/wasmlib", "dist/lib");
            resolve()
        } catch (e) {
            reject(e)
        }
    });

    console.log("running in " + (PRODUCTION ? "production" : "development") + " mode");

    try {
        await Promise.all([tsc, copy])
    } catch (e) {
        console.log("could not compile");
        console.log(e);
        process.exit(1)
    }
}

(async () => {
    await compile();
    if (PRODUCTION) {
        let main = new StartProd();
        let initPromise = main.init();
        const secret = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../SECRET.json")).toString());
        const port = secret.HTTP_PORT;
        const githubSecret = secret.GITHUB_SECRET;
        const handler = require('github-webhook-handler')({path: "/github_webhook", secret: githubSecret});
        await initPromise;
        http.createServer((req, res) => {
            handler(req, res, err => {
                res.statusCode = 404;
                res.end("no such location")
            })
        }).listen(port);
        handler.on("push", async event => {
            gitPullAndRestart();
        })
    } else {
        new StartDev();
    }
})();