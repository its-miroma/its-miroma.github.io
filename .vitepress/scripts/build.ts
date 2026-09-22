import * as crossSpawn from "cross-spawn";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import * as perfHooks from "node:perf_hooks";
import * as process from "node:process";
import * as tinyglobby from "tinyglobby";
import { AT, LATEST_VERSION, OLD_VERSIONS } from "../constants.ts";

const start = perfHooks.performance.now();
process.chdir(AT);

const argv = process.argv.slice(2);
const isLatestOnly = argv.includes("--latest-only");
const isListOnly = argv.includes("--list-only");
const isMergeOnly = argv.includes("--merge-only");

const tempDir = path.join(AT, ".vitepress", ".versions");

if (isMergeOnly && !fs.statSync(tempDir, { throwIfNoEntry: false })?.isDirectory()) {
  console.error(`couldn't find built versions directory`);
  process.exit(1);
}

const includedVersions = new Set(
  argv.map((v) => path.basename(v)).filter((v) => OLD_VERSIONS.includes(v))
);

if (includedVersions.size < 1) {
  for (const v of isMergeOnly
    ? tinyglobby.globSync("*", { cwd: tempDir, onlyDirectories: true }).map((v) => path.basename(v))
    : OLD_VERSIONS) {
    includedVersions.add(v);
  }
}

if (isLatestOnly) {
  includedVersions.clear();
}

const builtVersions = [...includedVersions, LATEST_VERSION];

if (isListOnly) {
  console.log(JSON.stringify(builtVersions));
  process.exit(0);
}

if (builtVersions.length > 1) {
  console.log(`building ${builtVersions.length} versions...`);
} else {
  console.log(`building only ${builtVersions[0]}...`);
}

console.warn("PLEASE DO NOT TOUCH ANY FILE DURING BUILD\n");

if (!isMergeOnly) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

const getOutDir = (version: string) => path.join(tempDir, version);

for (const version of builtVersions) {
  if (isMergeOnly) break;

  console.log(`building ${version}...`);

  const outDir = getOutDir(version);
  fs.mkdirSync(outDir, { recursive: true });

  const otherVersions = OLD_VERSIONS.filter((v) => v !== version);

  const buildProcess = crossSpawn.sync(
    "pnpm",
    ["exec", "vitepress", "build", `--outDir=${outDir}`],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        CI: "1",
        SHOW_ALL_VERSIONS: "1",
        EXCLUDED_VERSIONS: otherVersions.join(","),
      },
    }
  );

  if (buildProcess.error || buildProcess.status !== 0) {
    console.error(`Building ${version} failed!`);
    process.exit(buildProcess.status || 1);
  }
}

console.log(`merging metadata...`);
const getNewHash = (content: string) => crypto.hash("sha256", content, "hex").slice(0, 8);

const hashes: string[] = [];
const hashMap: Record<string, string> = {};
let siteData: unknown;

for (const version of builtVersions) {
  const window = ((globalThis as any).window = {} as any);
  const outDir = getOutDir(version);

  const metadataFile = tinyglobby.globSync("metadata.*.js", {
    cwd: path.join(outDir, "assets", "chunks"),
    absolute: true,
  })[0];

  hashes.push(path.basename(metadataFile).match(/^metadata[.](.+)[.]js$/)![1]);

  const fileContent = fs.readFileSync(metadataFile, { encoding: "utf-8" });
  const split = fileContent
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  if (split.length !== 2) {
    console.error(`too many assignments in ${metadataFile}`);
    process.exit(1);
  }

  await import(metadataFile);

  if (!split[0].startsWith(`window.__VP_HASH_MAP__=JSON.parse`)) {
    console.error(`failed to parse hash map in ${metadataFile}`);
    process.exit(1);
  }
  const versionHashMap = window.__VP_HASH_MAP__;

  if (!split[1].startsWith(`window.__VP_SITE_DATA__=JSON.parse`)) {
    console.error(`failed to parse site data in ${metadataFile}`);
    process.exit(1);
  }

  if (version === LATEST_VERSION) {
    siteData = window.__VP_SITE_DATA__;
  }

  (globalThis as any).window = undefined;

  Object.assign(hashMap, versionHashMap);
}

const targetDir = path.join(AT, ".vitepress", "dist");
fs.rmSync(targetDir, { recursive: true, force: true });

const newMetadataContent = `window.__VP_HASH_MAP__=JSON.parse(${JSON.stringify(JSON.stringify(hashMap))});window.__VP_SITE_DATA__=JSON.parse(${JSON.stringify(JSON.stringify(siteData))});`;
const newHash = getNewHash(newMetadataContent);

const newMetadataPath = path.join(targetDir, "assets", "chunks", `metadata.${newHash}.js`);
const newHashmapJsonPath = path.join(targetDir, "hashmap.json");

fs.mkdirSync(path.dirname(newMetadataPath), { recursive: true });
fs.writeFileSync(newMetadataPath, newMetadataContent, "utf-8");
fs.writeFileSync(newHashmapJsonPath, JSON.stringify(hashMap), "utf-8");

console.log(`merging pages...`);
for (const version of builtVersions) {
  const outDir = getOutDir(version);
  const files = tinyglobby.globSync("**/*", {
    cwd: outDir,
    ignore: ["hashmap.json", "assets/chunks/metadata.*.js"],
    absolute: true,
  });

  for (const f of files) {
    if (fs.statSync(f).isDirectory()) {
      continue;
    }

    const destPath = f.replace(outDir, targetDir);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });

    if (f.endsWith(".html")) {
      let content = fs.readFileSync(f, "utf-8");
      for (const h of hashes) {
        content = content.replaceAll(`metadata.${h}.js`, `metadata.${newHash}.js`);
      }

      fs.writeFileSync(destPath, content, "utf-8");
    } else {
      fs.copyFileSync(f, destPath);
    }
  }
}

const finish = perfHooks.performance.now();
console.log(`built ${builtVersions.length} versions in ${((finish - start) / 1000).toFixed(2)}s`);
