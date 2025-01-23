import * as fs from "node:fs";
import { exec } from "../src/index.js";

await exec(fs.createReadStream("example/example.json"));
