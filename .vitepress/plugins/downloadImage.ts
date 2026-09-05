import { ZipArchive } from "@archiver/archiver";
import * as fs from "node:fs";
import * as path from "node:path";
import * as stream from "node:stream";
import pLimit from "p-limit";
import * as tinyglobby from "tinyglobby";
import type { MarkdownRenderer, SiteConfig } from "vitepress";
import { getWebsiteResolver } from "../config/i18n.ts";
import AT from "../constants/at.ts";
import ENV from "../constants/env.ts";

// {download} on an image marks it as having a downloadable counterpart:
//   ![Condensed Oak Log texture](/assets/develop/blocks/condensed_oak_log.png){download}
// The downloadable file lives at the same path, with /assets/ swapped for /download/.
// An explicit path can still be given with {download=/download/...} if needed.
// If the download path resolves to a directory, it will be zipped after build.

// TODO: seeing that this is becoming a rather large plugin, should it still be called downloadImage.ts? I guess so
// TODO: review whether to use console.error instead of console.warn in some of these cases.

const directoriesToBeZipped = new Set<string>();

const checkAssetPathConvention = (relativePath: string, purePath: string, src: string) => {
  const expectedParent = `/assets/${purePath.replace(/[.]md$/, "")}/`;

  const relativeSrc = path.posix.relative(expectedParent, src);
  if (relativeSrc.startsWith("../") || path.isAbsolute(relativeSrc)) {
    console.warn(`${relativePath}: expected assets under ${expectedParent}, got ${src}`);
  }

  if (src !== src.toLowerCase()) {
    console.warn(`${relativePath}: unexpected uppercase in '${src}'`);
  }
};

export const downloadImagePlugin = (md: MarkdownRenderer) => {
  const image = md.renderer.rules.image!;
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    if (!env.localeIndex) {
      return image(tokens, idx, options, env, self);
    }

    const token = tokens[idx];
    const locale = env.frontmatter.localeIndex === "root" ? "en_us" : env.frontmatter.localeIndex;
    const resolver = getWebsiteResolver(locale);

    const srcValue = token.attrGet("src");
    const src = path.posix.normalize(srcValue!);
    if (srcValue !== src) {
      console.warn(`${env.relativePath}: expected normalized '${src}', got '${srcValue}'`);
    }

    checkAssetPathConvention(env.relativePath, env.frontmatter.purePath, src);

    let downloadPath = token.attrGet("download");
    if (downloadPath === null) {
      return image(tokens, idx, options, env, self);
    }

    token.attrs!.splice(token.attrIndex("download"), 1);
    const renderedImage = image(tokens, idx, options, env, self);
    if (downloadPath) {
      if (downloadPath !== downloadPath.toLowerCase()) {
        console.warn(`${env.relativePath}: unexpected uppercase in {download="${downloadPath}"}`);
      }
    } else if (!src.startsWith("/assets/")) {
      console.warn(`${env.relativePath}: cannot determine {download} path for ${src}.`);

      return renderedImage;
    }

    downloadPath ||= src.replace("/assets/", "/download/");
    downloadPath = downloadPath.replace(/[/]+$/, "");

    const absoluteDownloadPath = path.resolve(AT, "public", `./${downloadPath}`);
    if (!absoluteDownloadPath.startsWith(`${AT}${path.sep}`)) {
      console.warn(`${env.relativePath}: out of project traversal in {download="${downloadPath}"}`);

      return renderedImage;
    }

    const stat = fs.statSync(absoluteDownloadPath, { throwIfNoEntry: false });
    if (!stat) {
      console.warn(`${env.relativePath}: no {download} asset found at /${downloadPath}`);

      return renderedImage;
    }

    if (stat.isDirectory()) {
      if (ENV !== "dev") {
        directoriesToBeZipped.add(downloadPath);
      }

      downloadPath += ".zip";
    }

    return `${renderedImage} <a download ${
      downloadPath.endsWith(".zip") && ENV === "dev"
        ? `title="${md.utils.escapeHtml(resolver("download.unavailable_in_dev"))}"`
        : `title="${md.utils.escapeHtml(
            resolver("download.button").replace("%s", token.content || path.basename(downloadPath))
          )}" href="${md.utils.escapeHtml(downloadPath)}"`
    }></a>`;
  };
};

export const createDownloadZips = async (siteConfig: SiteConfig) => {
  if (directoriesToBeZipped.size === 0) return;

  const limit = pLimit(5);

  const tasks = [...directoriesToBeZipped].map((relativeD) =>
    limit(async () => {
      const d = path.resolve(siteConfig.outDir, `./${relativeD}`);
      const stat = await fs.promises.stat(d, { throwIfNoEntry: false });
      if (!stat?.isDirectory()) return;

      const z = `${d}.zip`;
      if (fs.existsSync(z)) {
        console.warn(`${z}: found unexpected zip before generation`);
        await fs.promises.rm(z);
      }

      const subDirectories = await tinyglobby.glob("*", { cwd: d, onlyDirectories: true });
      if (subDirectories.length) {
        console.warn(`${z}: unexpected subdirectories: '${subDirectories.join("', '")}'`);
      }

      // @ts-expect-error: https://github.com/node-archiver/archiver/pull/95
      const archive = new ZipArchive({ zlib: { level: 9 } }).directory(d, false);
      const pipeline = stream.promises.pipeline(archive, fs.createWriteStream(z));

      await archive.finalize();
      await pipeline;
    })
  );

  await Promise.all(tasks);
};
