// @ts-expect-error
import snippetPlugin from "markdown-it-vuepress-code-snippet-enhanced";
import * as path from "node:path";
import * as process from "node:process";
import bytecode from "syntax-java-bytecode/java-bytecode.tmLanguage.json" with { type: "json" };
import mcfunction from "syntax-mcfunction/mcfunction.tmLanguage.json" with { type: "json" };
import type { SiteConfig } from "vitepress";
import { tabsMarkdownPlugin } from "vitepress-plugin-tabs";
import defineVersionedConfig from "vitepress-versioning-plugin";
import { AT, ENV, EXCLUDED_OLD_VERSIONS, LATEST_VERSION } from "../constants.ts";
import { createDownloadZips, downloadImagePlugin } from "../plugins/downloadImage.ts";
import { transformFile, transformFilesPlugin } from "../plugins/transformFiles.ts";
import type { Config } from "../types.d.ts";
import { getBuildTransformHead, getClientTransformHead } from "./head.ts";
import { excludedLocales, getLocaleConfig } from "./i18n.ts";

// https://vitepress.dev/reference/site-config
// https://www.npmjs.com/package/vitepress-versioning-plugin
export default defineVersionedConfig(
  {
    // Removes .html from the end of URLs.
    cleanUrls: true,

    // Set head tags on the client side
    head: [["script", { "data-gen": "" }, getClientTransformHead()]],

    icons: { include: ["lucide:download"] },

    // Ignore dead links under translated/. Allows builds with incomplete translations
    ignoreDeadLinks: [
      (_, filePath) => {
        const split = path.relative(AT, filePath).split("/");
        if (split[0] === "versions") return true; // split.splice(0, 2);
        return split[0] === "translated";
      },
    ],

    // Adds a "Last Updated" block to the footer of pages, uses git to determine the last time a page's file was modified.
    lastUpdated: true,

    locales: getLocaleConfig(),

    markdown: {
      config: (md) => {
        // Use the snippet plugin for transclusions
        md.use(snippetPlugin);
        // Use the tabs plugin for... having tabs?
        md.use(tabsMarkdownPlugin);
        // {download} on an image links a downloadable counterpart
        md.use(downloadImagePlugin);
      },
      container: {
        // TODO(not-for-llm): acknowledge ::: caution and ::: note
        // TODO(not-for-llm): review all ::: containers with unnecessary title, except ::: details
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
      // TODO(not-for-llm): drop silent: true after the errors are fixed in translated/ and versions/
      snippet: { stripRegionMarkers: "all", silent: true },
      toc: false,
    },

    rewrites: { "translated/:locale/(.*)": ":locale/(.*)" },

    sitemap: {
      hostname:
        {
          dev: "http://fabric-docs.localhost:5173/",
          build: "http://fabric-docs.localhost:4173/",
          github: "https://its-miroma.github.io/",
          netlify: "https://fabric-docs.netlify.app/",
        }[ENV] || process.env.DEPLOY_PRIME_URL!,
      transformItems: (items) => {
        const config = (globalThis as any).VITEPRESS_CONFIG as SiteConfig;
        const getFilePath = (url: string) => `${url.replace(/[/]$/, "/index")}.md`;

        return items.filter(
          (i) => !config.rewrites.inv[getFilePath(i.url)]?.startsWith("versions/")
        );
      },
    },

    srcExclude: [
      "README.md",
      ...excludedLocales.map((l) => `translated/${l}`),
      ...EXCLUDED_OLD_VERSIONS.map((v) => `versions/${v}`),
    ],

    themeConfig: {
      env: ENV,
      excludedVersions: process.env.SHOW_ALL_VERSIONS ? [] : EXCLUDED_OLD_VERSIONS,
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
      plugins: [transformFilesPlugin()],
    },

    vue: {
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith("media-"),
        },
      },
    },
  } as Config,
  path.join(AT, ".vitepress")
);
