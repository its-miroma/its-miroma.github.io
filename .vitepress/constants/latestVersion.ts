import * as fs from "node:fs";
import * as path from "node:path";
import AT from "./at.ts";

// TODO: this shouldn't need caching because Node deals with it automatically?
// TODO: changes to build.gradle, do they restart the dev server?

export default fs
  .readFileSync(path.resolve(AT, "reference", "latest", "build.gradle"), "utf-8")
  .match(/def minecraftVersion = "([^"]+)"/)?.[1] || "";
