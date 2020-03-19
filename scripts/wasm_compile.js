const cp = require("child_process")
const path = require("path")
const fs = require("fs")

const rustBuild = new Promise((resolve, reject) => {
    cp.exec("cargo build --target wasm32-unknown-unknown --release && wasm-bindgen target/wasm32-unknown-unknown/release/deps/wasmlib.wasm --out-dir ../lib/ --nodejs --typescript", {
        cwd: path.resolve(__dirname, "../wasmlib")
    }, (err, stdout, stderr) => {
        console.log("cargo-out: " + stdout)
        console.log("cargo-err: " + stderr)
        if (err) {
            console.log("ERROR: " + err)
            reject(err)
        }
        else {
            resolve();
        }
    })
});

(async () => {
    try {
        await rustBuild
        fs.writeFileSync(path.resolve(__dirname, "../lib/wasmlib.d.ts"), `import * as wasm from "./wasmlib_bg"; export { wasm }`)
    }
    catch (e) {
        console.log("couldnt compile")
        console.log(e);
    }
})()