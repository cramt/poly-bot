import { openDB, getAllInGuild } from "./db";
import { polyMapGenerate } from "./polyMapGenerate";
import Jimp from "jimp"
import * as fs from "fs"

const id = "634515225369903114";
const outputFile = "output.png";

(async () => {
    await openDB();
    let all = await getAllInGuild(id)
    let buffer = await polyMapGenerate(all.users, all.relationships)
    let image = await Jimp.read(buffer)
    const targetColor = { r: 255, g: 255, b: 255, a: 255 };  // Color you want to replace
    const replaceColor = { r: 253, g: 3, b: 232, a: 255 };  // Color you want to replace with
    const colorDistance = (c1: typeof targetColor, c2: typeof targetColor) => Math.sqrt(Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2) + Math.pow(c1.a - c2.a, 2));  // Distance between two colors
    const threshold = 32;  // Replace colors under this threshold. The smaller the number, the more specific it is.
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
        const thisColor = {
            r: image.bitmap.data[idx + 0],
            g: image.bitmap.data[idx + 1],
            b: image.bitmap.data[idx + 2],
            a: image.bitmap.data[idx + 3]
        };
        if (colorDistance(targetColor, thisColor) <= threshold) {
            image.bitmap.data[idx + 0] = replaceColor.r;
            image.bitmap.data[idx + 1] = replaceColor.g;
            image.bitmap.data[idx + 2] = replaceColor.b;
            image.bitmap.data[idx + 3] = replaceColor.a;
        }
    });
    await image.writeAsync(outputFile)
    return;
    if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile)
    }
    let stream = fs.createWriteStream(outputFile)
    stream.write(await image.getBufferAsync(Jimp.MIME_PNG))
    stream.close()

})().then(() => process.exit(0))