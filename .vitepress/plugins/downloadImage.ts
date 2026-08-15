import { ZipArchive } from "archiver";
import * as fs from "node:fs";
import * as path from "node:path";
import type { MarkdownRenderer, SiteConfig } from "vitepress";
import { getWebsiteResolver } from "../config/i18n.ts";

// {download} on an image marks it as having a downloadable counterpart:
//   ![Condensed Oak Log texture](/assets/develop/blocks/condensed_oak_log.png){download}
// The downloadable file lives at the same path, with /assets/ swapped for /download/.
// An explicit path can still be given with {download=/download/...} if needed.
// If the download path resolves to a directory, it will be zipped after build.

// TODO: does this work in the dev server? elements that might not work:
// - Caches
// - zipping files
// - ???

// TODO: should the attr value be allowed to be a relative path?
// this way we can do `download=../whatever.png` for like the installing-java/{os} pages

const publicDir = path.resolve(import.meta.dirname, "..", "..", "public");

const directoriesToBeZipped = new Set<string>();

// TODO: I don't like this helper pattern :/
const checkAssetPathConvention = (relativePath: string, purePath: string, src: string) => {
  const expectedParent = `/assets/${purePath.replace(/[.]md$/, "")}/`;

  const relativeSrc = path.relative(expectedParent, src);
  if (!relativeSrc || relativeSrc.startsWith("../") || path.isAbsolute(relativeSrc)) {
    false && console.warn(`${relativePath}: expected assets under ${expectedParent}, got ${src}`);
  }
};

export const downloadImagePlugin = (md: MarkdownRenderer) => {
  const image = md.renderer.rules.image!;
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];

    const src = path.resolve(token.attrGet("src")!);
    checkAssetPathConvention(env.relativePath, env.frontmatter.purePath, src);

    // TODO: is it a good idea to refactor this so it's immutable (const)?
    let downloadPath = token.attrGet("download");
    if (downloadPath === null) {
      return image(tokens, idx, options, env, self);
    }

    token.attrs!.splice(token.attrIndex("download"), 1);
    const renderedImage = image(tokens, idx, options, env, self);
    if (!downloadPath && !src.startsWith("/assets/")) {
      console.warn(`${env.relativePath}: cannot determine {download} path for ${src}.`);

      return renderedImage;
    }

    downloadPath ||= src.replace("/assets/", "/download/");
    // TODO: I think I f-ed something up while refactoring :sob:
    const fullDownloadPath = path.resolve(publicDir, `./${downloadPath}`);
    if (!fs.existsSync(fullDownloadPath)) {
      console.warn(`${env.relativePath}: no {download} asset found at /${downloadPath}`);

      return renderedImage;
    }

    if (fs.statSync(fullDownloadPath).isDirectory()) {
      directoriesToBeZipped.add(downloadPath);
      downloadPath += ".zip";
    }

    const locale = env.frontmatter.localeIndex === "root" ? "en_us" : env.frontmatter.localeIndex;
    const tooltip = getWebsiteResolver(locale)("download").replace("%s", token.content || src);

    return (
      // TODO: instead of wrapping in span.download-image, would it be possible to apply the styles to the surrounding p?
      // currently, this breaks the styling of images that can be found in styles.css.
      // Current DOM: p > span.download-image > :is(img, a.download-image-button)
      // Expected:    p > :is(img, a.download), and apply styles to p:has(a.download) maybe?
      `<span class="download-image">${renderedImage}`
      // TODO: should this be a button instead of an anchor?
      + `<a class="download-image-button" href="${md.utils.escapeHtml(downloadPath)}" `
      + `title="${md.utils.escapeHtml(tooltip)}" download></a></span>`
    );
  };
};

export const zipDownloadAssets = async (siteConfig: SiteConfig) => {
  if (directoriesToBeZipped.size === 0) return;

  await Promise.all(
    [...directoriesToBeZipped].map(async (d) => {
      const dir = path.resolve(siteConfig.outDir, `.${d}`);
      if (!fs.existsSync(dir)) {
        return;
      }

      await new Promise<void>((resolve, reject) => {
        const output = fs.createWriteStream(`${dir}.zip`);
        output.on("close", resolve);
        output.on("error", reject);

        const archive = new ZipArchive({ zlib: { level: 9 } });
        archive.on("error", reject);
        archive.on("warning", reject);

        archive.pipe(output);
        archive.directory(dir, false);
        void archive.finalize();
      });

      await fs.promises.rm(dir, { recursive: true, force: true });
    })
  );
};
