import matter from "gray-matter";
import * as path from "node:path";
import type { Plugin } from "vitepress";
import { getWebsiteResolver } from "../config/i18n.ts";
import { AT, LATEST_VERSION, OLD_VERSIONS, VERSION_RE } from "../constants.ts";

const FILE_PATH_RE = /(?:^<<< *([^[{#\n]+))|(?:^@\[[^\]]*\]\(([^)]*)\))/gm;

const VERSION_SWITCHER = `<VersionSwitcher h1 :versioningPlugin="${JSON.stringify({ versions: OLD_VERSIONS, latestVersion: LATEST_VERSION }).replaceAll('"', "'")}" />`;

const parsePagePath = (id: string) => {
  const split = path.relative(AT, id).split("/");
  const purify = (parts: string[]) => parts.join("/").replace(/((?<=^|[/])index)?[.]md$/, "");

  if (split[0] === "versions") {
    // versions/version/[translated/locale/]path/to/file-name.md
    const versionType = "old" as const;
    const version = split[1];
    const localeIndex = split[2] === "translated" ? split[3] : "root";
    const purePath = purify(split.slice(localeIndex === "root" ? 2 : 4));

    return { versionType, version, localeIndex, purePath };
  }

  // [translated/locale/][version/]path/to/file-name.md
  const localeIndex = split[0] === "translated" ? split[1] : "root";
  if (localeIndex !== "root") {
    split.splice(0, 2);
  }

  if (VERSION_RE.test(split[0])) {
    const versionType = "future" as const;
    const version = split[0];
    const purePath = purify(split.slice(1));

    return { versionType, version, localeIndex, purePath };
  }

  const versionType = "latest" as const;
  const version = LATEST_VERSION;
  const purePath = purify(split);

  return { versionType, version, localeIndex, purePath };
};

export const transformFile = (src: string, id: string) => {
  const { data, content } = matter(src, {});

  // Version and locale information
  Object.assign(data, parsePagePath(id));

  if (data.versionType === "old") {
    data.editLink = false;
    data.search = false;
  }

  // TODO(not-for-llm): consider restoring search for other languages, since localSearch appears to index locales separately now
  if (data.localeIndex !== "root") {
    data.search = false;
  }

  const locale = data.localeIndex === "root" ? "en_us" : data.localeIndex;
  const resolver = getWebsiteResolver(locale);
  const newContent: string[] = [];

  if (data.layout === "home") {
    if (data.versionType === "old") {
      newContent.push(
        "::: warning",
        resolver("version.reminder.old_version_home").replace("%s", data.version),
        ":::"
      );
    }
  } else {
    if (data.title) {
      newContent.push("<hgroup>");

      newContent.push(`# ${data.title} ${VERSION_SWITCHER} {#h1}`);

      if (data.description) {
        newContent.push(`${data.description} {role="doc-subtitle"} `);
      }

      newContent.push("</hgroup>");
    }

    if (data.versionType === "old") {
      newContent.push(
        "::: warning",
        resolver("version.reminder.old_version").replace("%s", data.version),
        ":::"
      );
    }

    if (data.versionType === "future") {
      newContent.push(
        "::: warning",
        resolver("version.reminder.future_version").replace("%s", data.version),
        ":::"
      );
    }
  }

  newContent.push(content);

  if (data.filesExclude === true) {
    data.files = [];
  } else {
    // Find files referenced in the page
    const matches = [...content.matchAll(FILE_PATH_RE)].map((m) => (m[1] || m[2]).trim());

    matches.push(...(data.files || []));

    data.files = [...new Set(matches)].filter((f) => !(data.filesExclude || []).includes(f));
  }

  return matter.stringify(newContent.join("\n\n"), data);
};

export const transformFilesPlugin = (): Plugin => ({
  name: "fabric-docs:transform-files",
  enforce: "pre",

  transform: {
    filter: { id: /[.]md$/ },
    handler(src, id) {
      this.addWatchFile(id);
      return { code: transformFile(src, id) };
    },
  },
});
