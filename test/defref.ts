import * as fs from "node:fs";
import { exec } from "../src/index.js";

const source = fs.createReadStream("example/example.json");

try {
    await exec(source);
} finally {
    source.close();
}
