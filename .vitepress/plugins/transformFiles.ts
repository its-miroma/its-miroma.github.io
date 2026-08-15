import matter from "gray-matter";
import * as path from "node:path";
import type { Plugin, SiteConfig } from "vitepress";
import type { Fabric } from "../types.d.ts";
import { parsePagePath, VersionType } from "./fileStructure.ts";

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
  // TODO: atp can we use the resolver?
  // Consider also confirming that the usages of the strings in this file are
  // the only ones, so we can drop them from the themeConfig in i18n.ts altogether
  const themeConfig = config.userConfig.locales![data.localeIndex]
    .themeConfig as Fabric.ThemeConfig;

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
