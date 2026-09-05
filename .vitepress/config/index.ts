// @ts-expect-error
import snippetPlugin from "markdown-it-vuepress-code-snippet-enhanced";
import * as path from "node:path";
import * as process from "node:process";
import bytecode from "syntax-java-bytecode/java-bytecode.tmLanguage.json" with { type: "json" };
import mcfunction from "syntax-mcfunction/mcfunction.tmLanguage.json" with { type: "json" };
import type { SiteConfig } from "vitepress";
import { tabsMarkdownPlugin } from "vitepress-plugin-tabs";
import defineVersionedConfig from "vitepress-versioning-plugin";
import AT from "../constants/at.ts";
import ENV from "../constants/env.ts";
import LATEST_VERSION from "../constants/latestVersion.ts";
import { createDownloadZips, downloadImagePlugin } from "../plugins/downloadImage.ts";
import { transformFile, transformFilesPlugin } from "../plugins/transformFiles.ts";
import { watchTranslationsPlugin } from "../plugins/watchTranslations.ts";
import type { Fabric } from "../types.d.ts";
import { getBuildTransformHead, getClientTransformHead } from "./head.ts";
import { getLocaleConfig } from "./i18n.ts";

// TODO: should all constants be in a single common file .vitepress/constants.ts instead of one file for each?
// TODO: review deps and devDeps, why we have them, and if they are in the right place.

const hostname =
  ENV === "dev"
    ? "http://fabric-docs.localhost:5173/"
    : ENV === "build"
      ? "http://fabric-docs.localhost:4173/"
      : ENV === "github"
        ? "https://docs.fabricmc.net/"
        : ENV === "netlify"
          ? "https://fabric-docs.netlify.app/"
          : process.env.DEPLOY_PRIME_URL!;

// https://vitepress.dev/reference/site-config
// https://www.npmjs.com/package/vitepress-versioning-plugin
export default defineVersionedConfig(
  {
    // Removes .html from the end of URLs.
    cleanUrls: true,

    // Set head tags on the client side
    head: [["script", { "data-gen": "" }, getClientTransformHead()]],

    // Ignore dead links under translated/. Allows builds with incomplete translations
    ignoreDeadLinks: [
      (_, filePath) => {
        const split = filePath.split("/");
        if (split[0] === "versions") split.splice(0, 2);
        return split[0] !== "translated";
      },
    ],

    // Adds a "Last Updated" block to the footer of pages, uses git to determine the last time a page's file was modified.
    lastUpdated: true,

    locales: getLocaleConfig(),

    markdown: {
      config: (md) => {
        // TODO(not-for-llm): add a plugin that rewrites asset paths from /public/* to drop that prefix.
        // Use the snippet plugin for transclusions
        md.use(snippetPlugin);
        // Use the tabs plugin for... having tabs?
        md.use(tabsMarkdownPlugin);
        // {download} on an image links a downloadable counterpart
        md.use(downloadImagePlugin);
      },
      container: {
        // TODO(not-for-llm): decide
        // TODO(not-for-llm): acknowledge ::: caution and ::: note
        // TODO(not-for-llm): review all ::: containers with a title, except ::: details, because that shouldn't be needed
        // TODO(not-for-llm): migrate ::: info PREREQUISITES
        // TODO(not-for-llm): migrate ::: warning IMPORTANT
        customContainers: {
          prerequisites: "PREREQUISITES",
        },
      },
      footnote: false,
      gfmAlerts: false,
      image: { lazyLoad: true },
      languageAlias: { classtweaker: "text", gradle: "groovy" },
      languages: [
        { ...(bytecode as any), name: "bytecode" },
        { ...(mcfunction as any), name: "mcfunction" },
      ],
      lineNumbers: true,
      shikiSetup: async (shiki) => {
        await shiki.loadTheme("github-light", "github-dark");
      },
      // TODO(upstream): drop silent: true after the errors are fixed.
      snippet: { stripRegionMarkers: "all", silent: true },
      toc: false,
    },

    rewrites: { "translated/:locale/(.*)": ":locale/(.*)" },

    sitemap: {
      hostname,
      transformItems: (items) => {
        const config = (globalThis as any).VITEPRESS_CONFIG as SiteConfig;
        return items.filter((i) => {
          // TODO: why not split at :// ? if that's possible, then we can inline hostname earlier.
          const relativePath = i.url.replace(hostname, "");
          return !config.rewrites.inv[relativePath]?.startsWith("versions/");
        });
      },
    },

    srcExclude: [
      "README.md",
      (process.env.WITH_VERSIONS !== undefined
        ? !Number(process.env.WITH_VERSIONS)
        : typeof ENV === "number") && "versions",
    ].filter(Boolean),

    themeConfig: {
      env: ENV,
      externalLinkIcon: true,
      logo: "/logo.png",
      outline: { level: "deep" },
      search: {
        options: {
          _render: async (src, env, md) => {
            src = transformFile(src, env.path);
            const html = await md.renderAsync(src, env);
            return env.frontmatter?.search === false ? "" : html;
          },
        },
        provider: "local",
      },
    },

    // Set head tags at build time
    transformHead: getBuildTransformHead(),

    // Versioning plugin configuration.
    versioning: {
      latestVersion: LATEST_VERSION,
      rewrites: { localePrefix: "translated" },
      sidebars: {
        sidebarContentProcessor: (s) =>
          Object.fromEntries(
            Object.entries(s).map(([k, v]) => [
              (() => {
                const split = k.split("/").filter(Boolean);
                if (split[0] === split[2]) split.splice(2, 1);
                return `/${split.join("/")}/`;
              })(),
              v,
            ])
          ),
        sidebarUrlProcessor: (url, version) =>
          url.startsWith("/") ? `/${version}${/^[/].._..[/]/.test(url) ? url.slice(6) : url}` : url,
      },
    },

    buildEnd: (siteConfig) => {
      createDownloadZips(siteConfig);
    },

    vite: {
      plugins: [transformFilesPlugin(), watchTranslationsPlugin()],
    },

    vue: {
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith("media-"),
        },
      },
    },
  } as Fabric.Config,
  path.resolve(AT, ".vitepress")
);
