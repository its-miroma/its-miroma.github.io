/*
page path format:
- latest version  (0): [translated/locale/] path/to/index.md
- future versions (1): [translated/locale/] version/ path/to/index.md
- old versions    (2): versions/version/ [translated/locale/] path/to/index.md
*/

export enum VersionType {
  LATEST = 0,
  FUTURE = 1,
  OLD = 2,
}

export interface PagePath {
  version: string;
  versionType: VersionType;
  localeIndex: string;
  purePath: string;
}

const V_RE = /^[0-9]+[.][0-9.]+$/;

export const parsePagePath = (relativePath: string, latestVersion: string): PagePath => {
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
