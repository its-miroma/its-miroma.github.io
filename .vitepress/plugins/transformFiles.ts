import matter from "gray-matter";
import * as path from "node:path";
import type { Plugin, SiteConfig } from "vitepress";
import type { Fabric } from "../types.d.ts";

enum VersionType {
  /** `[translated/locale/]path/to/index.md` */
  LATEST = 0,

  /** `[translated/locale/]version/path/to/index.md` */
  FUTURE = 1,

  /** `versions/version/[translated/locale/]path/to/index.md` */
  OLD = 2,
}

interface PagePath {
  version: string;
  versionType: VersionType;
  localeIndex: string;
  purePath: string;
}

const V_RE = /^[0-9]+[.][0-9.]+$/;

const parsePagePath = (relativePath: string, latestVersion: string): PagePath => {
  const returned = {} as PagePath;

  const split = relativePath.split("/");

  if (split[0] === "versions") {
    returned.version = split[1];
    returned.versionType = VersionType.OLD;
  } else if (V_RE.test(split[0])) {
    returned.version = split[0];
    returned.versionType = VersionType.FUTURE;
  } else if (split[0] === "translated" && V_RE.test(split[2])) {
    returned.version = split[2];
    returned.versionType = VersionType.FUTURE;
  } else {
    returned.version = latestVersion;
    returned.versionType = VersionType.LATEST;
  }

  if (split[0] === "translated") {
    returned.localeIndex = split[1];
  } else if (returned.versionType === VersionType.OLD && split[VersionType.OLD] === "translated") {
    returned.localeIndex = split[3];
  } else {
    returned.localeIndex = "root";
  }

  returned.purePath = split
    .slice(returned.versionType)
    .slice(returned.localeIndex === "root" ? 0 : 2)
    .join("/");

  return returned;
};

// TODO: is this still needed considering the recent vitepress refactors around a single MarkdownRenderer?
// (context: this was currently exported because it was needed in the search render thing to add h1 iirc.
// apparently search's render might have used a separate md renderer)
export const transformFile = (src: string, id: string, latestVersion: string) => {
  const { data, content } = matter(src);
  const newContent: string[] = [];

  // Version and locale information
  const relativePath = path.relative(path.resolve(import.meta.dirname, "..", ".."), id);
  Object.assign(data, parsePagePath(relativePath, latestVersion));

  if (data.versionType === VersionType.OLD) {
    data.editLink = false;
  }

  const config = (globalThis as any).VITEPRESS_CONFIG as SiteConfig;
  // TODO: atp can we import the resolver instead of using the themeConfig?
  // Consider also confirming that the usages of the strings in this file are
  // the only ones, so we can drop them from the themeConfig in i18n.ts altogether
  // Note: theoretically, the root fallback is unnecessary, but unfortunately
  // if a translated page exists without the REQUIRED_FILES it is still built
  // (and themeConfig for that locale would be undefined)
  const themeConfig = (
    config.userConfig.locales![data.localeIndex] ?? config.userConfig.locales!.root
  ).themeConfig as Fabric.ThemeConfig;

  if (data.layout === "home") {
    if (data.versionType === VersionType.OLD) {
      newContent.push(
        "::: warning",
        themeConfig.version.reminder.oldVersionHome.replace("%s", data.version),
        ":::"
      );
    }
  } else {
    if (data.title) {
      newContent.push("<hgroup>");

      const type = data.versionType === VersionType.LATEST ? "tip" : "warning";
      newContent.push(`# ${data.title} <Badge type="${type}">${data.version}</Badge> {#h1}`);

      if (data.description) {
        newContent.push(`${data.description} {role="doc-subtitle"} `);
      }

      newContent.push("</hgroup>");
    }

    if (data.versionType === VersionType.OLD) {
      newContent.push(
        "::: warning",
        themeConfig.version.reminder.oldVersion.replace("%s", data.version),
        ":::"
      );
    }

    if (data.versionType === VersionType.FUTURE) {
      newContent.push(
        "::: warning",
        themeConfig.version.reminder.futureVersion.replace("%s", data.version),
        ":::"
      );
    }
  }

  newContent.push(content);

  if (data.filesExclude === true) {
    data.files = [];
  } else {
    // Find files referenced in the page
    const filePathRegex = /(?:^<<< *([^[{#\n]+))|(?:^@\[[^\]]*\]\(([^)]*)\))/gm;
    const matches = [...src.matchAll(filePathRegex)].map((m) => (m[1] ?? m[2]).trim());

    matches.push(...(data.files ?? []));

    data.files = [...new Set(matches)].filter((f) => !(data.filesExclude ?? []).includes(f));
  }

  return matter.stringify(newContent.join("\n\n"), data);
};

export const transformFilesPlugin = (latestVersion: string): Plugin => ({
  name: "fabric-docs:transform-files",
  enforce: "pre",

  transform: {
    filter: { id: /[.]md$/ },
    handler(src, id) {
      this.addWatchFile(id);
      return { code: transformFile(src, id, latestVersion) };
    },
  },
});
