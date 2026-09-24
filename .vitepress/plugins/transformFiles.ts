import matter from "gray-matter";
import * as path from "node:path";
import type { Plugin } from "vitepress";
import { getWebsiteResolver } from "../config/i18n.ts";
import { AT, LATEST_VERSION, OLD_VERSIONS, VERSION_RE } from "../constants.ts";

const FILE_PATH_RE = /(?:^<<< *([^[{#\n]+))|(?:^@\[[^\]]*\]\(([^)]*)\))/gm;

const VERSION_SWITCHER = `<VersionSwitcher h1 :versioningPlugin="${JSON.stringify({ versions: OLD_VERSIONS, latestVersion: LATEST_VERSION }).replaceAll('"', "'")}" />`;

export const transformFile = (src: string, id: string) => {
  const { data, content } = matter(src, {});
  const split = path.relative(AT, id).split("/");

  data.versionType = "latest";
  data.version = LATEST_VERSION;
  data.localeIndex = "root";

  if (split[0] === "versions") {
    // versions/version/[translated/locale/]path/to/file-name.md
    data.versionType = "old";
    data.version = split[1];
    data.editLink = false;
    data.search = false;

    split.splice(0, 2);
  }

  // [translated/locale/][version/]path/to/file-name.md
  if (split[0] === "translated") {
    data.localeIndex = split[1];
    split.splice(0, 2);
  }

  if (data.version === LATEST_VERSION && VERSION_RE.test(split[0])) {
    data.versionType = "future";
    data.version = split[0];
    split.splice(0, 1);
  }

  data.purePath = split.join("/").replace(/((?<=^|[/])index)?[.]md$/, "");

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
