import * as path from "node:path";

// TODO: btw, this corresponds to the dir of package.json, if that can simplify things
export default path.resolve(import.meta.dirname, "..", "..");
