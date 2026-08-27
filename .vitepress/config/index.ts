// @ts-expect-error
import snippetPlugin from "markdown-it-vuepress-code-snippet-enhanced";
import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import bytecode from "syntax-java-bytecode/java-bytecode.tmLanguage.json" with { type: "json" };
import mcfunction from "syntax-mcfunction/mcfunction.tmLanguage.json" with { type: "json" };
import type { SiteConfig } from "vitepress";
import { tabsMarkdownPlugin } from "vitepress-plugin-tabs";
import defineVersionedConfig from "vitepress-versioning-plugin";
import { downloadImagePlugin, zipDownloadAssets } from "../plugins/downloadImage.ts";
import { transformFilesPlugin } from "../plugins/transformFiles.ts";
import { watchTranslationsPlugin } from "../plugins/watchTranslations.ts";
import ROOT from "../root.ts";
import type { Fabric } from "../types.d.ts";
import { getBuildTransformHead, getClientTransformHead } from "./head.ts";
import { getLocaleConfig } from "./i18n.ts";

const latestVersion = fs
  .readFileSync(path.resolve(ROOT, "reference", "latest", "build.gradle"), "utf-8")
  .match(/def minecraftVersion = "([^"]+)"/)![1];

// https://docs.github.com/en/actions/reference/workflows-and-actions/variables#default-environment-variables
// https://docs.netlify.com/build/configure-builds/environment-variables/#read-only-variables
const env = process.env.GITHUB_ACTIONS
  ? "github"
  : process.env.NETLIFY
    ? Number(process.env.REVIEW_ID)
    : process.env.NODE_ENV === "production"
      ? "build"
      : "dev";

const hostname =
  env === "github"
    ? "https://docs.fabricmc.net/"
    : env === "build"
      ? "http://fabric-docs.localhost:4173/"
      : env === "dev"
        ? "http://fabric-docs.localhost:5173/"
        : `${process.env.DEPLOY_PRIME_URL!}/`;

// https://vitepress.dev/reference/site-config
// https://www.npmjs.com/package/vitepress-versioning-plugin
export default defineVersionedConfig(
  {
    // Removes .html from the end of URLs.
    cleanUrls: true,

    // Set head tags on the client side
    head: [["script", { "data-gen": "" }, getClientTransformHead(latestVersion)]],

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
          const relativePath = i.url.replace(hostname, "");
          return !config.rewrites.inv[relativePath]?.startsWith("versions/");
        });
      },
    },

    srcExclude: ["README.md", ...(typeof env === "number" ? ["versions"] : [])],

    themeConfig: {
      env,
      externalLinkIcon: true,
      logo: "/logo.png",
      outline: { level: "deep" },
      search: { provider: "local" },
      versionSwitcher: false,
    },

    // Set head tags at build time
    transformHead: getBuildTransformHead(latestVersion),

    // Versioning plugin configuration.
    versioning: {
      latestVersion,
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
      zipDownloadAssets(siteConfig);
    },

    vite: {
      plugins: [transformFilesPlugin(latestVersion), watchTranslationsPlugin()],
    },

    vue: {
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith("media-"),
        },
      },
    },
  } as Fabric.Config,
  path.resolve(ROOT, ".vitepress")
);
