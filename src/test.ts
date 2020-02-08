import { openDB, getAllInGuild } from "./db";
import { polyMapGenerate } from "./polyMapGenerate";
import * as fs from "fs"

const id = "634515225369903114";
const outputFile = "output.png";

(async () => {
    await openDB();
    let all = await getAllInGuild(id)
    let buffer = await polyMapGenerate(all.users, all.relationships)
    if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile)
    }
    let stream = fs.createWriteStream(outputFile)
    stream.write(buffer)
    stream.close()
})()