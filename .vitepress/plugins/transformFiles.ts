import matter from "gray-matter";
import * as path from "node:path";
import type { Plugin } from "vitepress";
import { getWebsiteResolver } from "../config/i18n.ts";
import { AT, LATEST_VERSION, OLD_VERSIONS, VERSION_RE } from "../constants.ts";

const FILE_PATH_RE = /(?:^<<< *([^[{#\n]+))|(?:^@\[[^\]]*\]\(([^)]*)\))/gm;

const VERSION_SWITCHER = `<VersionSwitcher h1 :versioningPlugin="${JSON.stringify({ versions: OLD_VERSIONS, latestVersion: LATEST_VERSION }).replaceAll('"', "'")}" />`;

// TODO: refactor to use early returns instead of returning returned
const parsePagePath = (relativePath: string) => {
  const returned = {} as {
    versionType: keyof typeof versionTypeToSegments;
    version: string;
    localeIndex: string;
    purePath: string;
  };

  const versionTypeToSegments = {
    /** `[translated/locale/]path/to/file-name.md` */
    latest: 0,

    /** `[translated/locale/]version/path/to/file-name.md` */
    future: 1,

    /** `versions/version/[translated/locale/]path/to/file-name.md` */
    old: 2,
  } as const;

  const split = relativePath.split("/");

  if (split[0] === "versions") {
    returned.versionType = "old";
    returned.version = split[1];
  } else if (VERSION_RE.test(split[0])) {
    returned.versionType = "future";
    returned.version = split[0];
  } else if (split[0] === "translated" && VERSION_RE.test(split[2])) {
    returned.versionType = "future";
    returned.version = split[2];
  } else {
    returned.versionType = "latest";
    returned.version = LATEST_VERSION;
  }

  if (split[0] === "translated") {
    returned.localeIndex = split[1];
  } else if (returned.versionType === "old" && split[2] === "translated") {
    returned.localeIndex = split[3];
  } else {
    returned.localeIndex = "root";
  }

  returned.purePath = split
    .slice(versionTypeToSegments[returned.versionType])
    .slice(returned.localeIndex === "root" ? 0 : 2)
    .join("/")
    .replace(/((?<=^|[/])index)?[.]md$/, "");

  return returned;
};

export const transformFile = (src: string, id: string) => {
  const { data, content } = matter(src, {});

  // Version and locale information
  const relativePath = path.relative(AT, id);
  Object.assign(data, parsePagePath(relativePath));

  if (data.versionType === "old") {
    data.editLink = false;
    data.search = false;
  }

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
