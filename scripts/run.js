const cp = require("child_process")

var fs = require('fs');
var path = require('path');

const deleteFolderRecursive = function (_path) {
    if (fs.existsSync(_path)) {
        fs.readdirSync(_path).forEach((file, index) => {
            const curPath = path.join(_path, file);
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(_path);
    }
};

function copyFileSync(source, target) {

    var targetFile = target;

    //if target is a directory a new file with the same name will be created
    if (fs.existsSync(target)) {
        if (fs.lstatSync(target).isDirectory()) {
            targetFile = path.join(target, path.basename(source));
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync(source, target) {
    var files = [];

    //check if folder needs to be created or integrated
    var targetFolder = path.join(target, path.basename(source));
    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder);
    }

    //copy
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
        deleteFolderRecursive("dist/lib")
        copyFolderRecursiveSync("lib", "dist")
        resolve()
    }
    catch (e) { reject(e) }
});

(async () => {
    try {
        await Promise.all([tsc, copy])
    }
    catch (e) {
        console.log("could not start")
        console.log(e)
        process.exit(1)
    }
    require(path.resolve(__dirname, "../dist/src/index.js"))
})()