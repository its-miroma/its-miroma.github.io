import matter from "gray-matter";
import * as path from "node:path";
import type { Plugin } from "vitepress";
import { getWebsiteResolver } from "../config/i18n.ts";
import AT from "../constants/at.ts";
import LATEST_VERSION from "../constants/latestVersion.ts";

// the value is the number of segments in the path that indicate the version
enum VersionType {
  /** `[translated/locale/]path/to/file-name.md` */
  LATEST = 0,

  /** `[translated/locale/]version/path/to/file-name.md` */
  FUTURE = 1,

  /** `versions/version/[translated/locale/]path/to/file-name.md` */
  OLD = 2,
}

interface PagePath {
  version: string;
  versionType: VersionType;
  localeIndex: string;
  purePath: string;
}

export const VERSION_RE = /^[0-9]+[.][0-9]+([.][0-9]+)?$/;
const FILE_PATH_RE = /(?:^<<< *([^[{#\n]+))|(?:^@\[[^\]]*\]\(([^)]*)\))/gm;

const parsePagePath = (relativePath: string): PagePath => {
  const returned = {} as PagePath;

  const split = relativePath.split("/");

  if (split[0] === "versions") {
    returned.version = split[1];
    returned.versionType = VersionType.OLD;
  } else if (VERSION_RE.test(split[0])) {
    returned.version = split[0];
    returned.versionType = VersionType.FUTURE;
  } else if (split[0] === "translated" && VERSION_RE.test(split[2])) {
    returned.version = split[2];
    returned.versionType = VersionType.FUTURE;
  } else {
    returned.version = LATEST_VERSION;
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

export const transformFile = (src: string, id: string) => {
  const { data, content } = matter(src, {});

  // Version and locale information
  const relativePath = path.relative(AT, id);
  Object.assign(data, parsePagePath(relativePath));

  if (data.versionType === VersionType.OLD) {
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
    if (data.versionType === VersionType.OLD) {
      newContent.push(
        "::: warning",
        resolver("version.reminder.old_version_home").replace("%s", data.version),
        ":::"
      );
    }
  } else {
    if (data.title) {
      newContent.push("<hgroup>");

      const type = data.versionType === VersionType.LATEST ? "tip" : "warning";
      newContent.push(`# ${data.title} <Badge type="${type}" text="${data.version}" /> {#h1}`);

      if (data.description) {
        newContent.push(`${data.description} {role="doc-subtitle"} `);
      }

      newContent.push("</hgroup>");
    }

    if (data.versionType === VersionType.OLD) {
      newContent.push(
        "::: warning",
        resolver("version.reminder.old_version").replace("%s", data.version),
        ":::"
      );
    }

    if (data.versionType === VersionType.FUTURE) {
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
