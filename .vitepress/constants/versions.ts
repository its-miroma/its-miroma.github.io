import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import * as tinyglobby from "tinyglobby";
import AT from "./at.ts";
import ENV from "./env.ts";

export const VERSION_RE = /^[0-9]+[.][0-9]+([.][0-9]+)?$/;

export const LATEST_VERSION =
  fs
    .readFileSync(path.resolve(AT, "reference", "latest", "build.gradle"), "utf-8")
    .match(/def minecraftVersion = "([^"]+)"/)?.[1] || "";

export const ALL_VERSIONS = [
  LATEST_VERSION,
  ...tinyglobby
    .globSync("*", {
      cwd: path.resolve(AT, "versions"),
      onlyDirectories: true,
    })
    .map((v) => path.basename(v)),
];

export const EXCLUDED_VERSIONS =
  {
    auto: typeof ENV === "number" ? ALL_VERSIONS : [],
    all: ALL_VERSIONS,
  }[process.env.EXCLUDED_VERSIONS || "auto"]
  || [
    ...new Set(
      process.env
        .EXCLUDED_VERSIONS! //
        .split(/[,; ]/)
        .filter(Boolean)
    ),
  ].filter((v) => {
    if (v === LATEST_VERSION) return false;

    const returned = ALL_VERSIONS.includes(v);

    if (!returned) {
      console.warn(`EXCLUDED_VERSIONS: unrecognized version '${v}'`);
    }

    return returned;
  });

export const INCLUDED_VERSIONS = ALL_VERSIONS.filter((v) => !EXCLUDED_VERSIONS.includes(v));
