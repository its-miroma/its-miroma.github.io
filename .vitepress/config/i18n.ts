import * as fs from "node:fs";
import * as path from "node:path";
import * as tinyglobby from "tinyglobby";
import type t_sidebar from "../../sidebar_translations.json";
import type t_website from "../../website_translations.json";
import Develop from "../sidebars/develop";
import Players from "../sidebars/players";
import type { Fabric } from "../types.d";

// TODO: because variable dynamic imports are NOT watched, this must be refactored.
// refactor to use import.meta.glob with **/*_translations.json, and the resolver should get the data from that import map.

const REQUIRED_FILES = [
  "index.md",
  "sidebar_translations.json",
  "website_translations.json",
] as const;

export const getLocaleNames = (translated: string) => [
  "en_us",
  ...tinyglobby
    .globSync(`${translated}/*`, { onlyDirectories: true })
    .filter((d) => REQUIRED_FILES.every((f) => fs.existsSync(path.resolve(d, f))))
    .map((d) => path.relative(translated, d)),
];

// TODO: why is this outside
const locales = getLocaleNames(path.resolve(import.meta.dirname, "..", "..", "translated"));

const getResolver = //
  async <T extends Record<string, any>>(
    file: string,
    locale: string
  ): Promise<<K extends keyof T>(k: K) => T[K]> => {
    const importFile = async (file: string) =>
      (await import(file, { with: { type: "json" } })).default as T;

    const strings = await importFile(
      `../../translated/${locale === "en_us" ? ".." : locale}/${file}`
    );

    if (locale !== "en_us") {
      const fallback = await importFile(`../../${file}`);
      return (k) => strings[k] || fallback[k];
    }

    for (const k of Object.keys(strings)) {
      if (!/^([/][/])?[a-z0-9_.]*$/.test(k)) {
        // TODO: can these use the vite logger? if it did, the progress messages wouldn't break maybe?
        console.warn(`${file}: unusual character in key: ${k}`);
      }
    }

    // TODO: should this be the one that warns about unrecognized keys instead?
    return (k) => strings[k];
  };

export const getSidebar = async (locale: string) => {
  const returned: Fabric.Sidebar = {};
  const resolver = await getResolver<typeof t_sidebar>("sidebar_translations.json", locale);

  const normalizeSidebar = (sidebar: Fabric.SidebarItem[]) => {
    const returned: Fabric.SidebarItem[] = JSON.parse(JSON.stringify(sidebar));

    for (const item of returned) {
      // @ts-expect-error - TODO: maybe check if the item.text is NOT found? In that case, warn?
      //
      // const key = item.text
      // item.text = resolver(key)
      // if (!item.text) console.warn(...)
      // Does that work?
      item.text = resolver(item.text);
      if (item.items) item.items = normalizeSidebar(item.items);
      if (locale !== "en_us" && item.link?.startsWith("/")) {
        item.link = `/${locale}${item.link}`;
      }
    }

    return returned;
  };

  returned[`${locale === "en_us" ? "" : `/${locale}`}/develop/`] = normalizeSidebar(Develop);
  returned[`${locale === "en_us" ? "" : `/${locale}`}/players/`] = normalizeSidebar(Players);

  return returned;
};

export const getLocales = async () => {
  const returned: Fabric.Config["locales"] = {};

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DisplayNames
  const intlLocaleOverrides: Record<string, string> = {
    zh_cn: "zh-Hans",
    zh_tw: "zh-Hant",
  };

  // https://developer.crowdin.com/language-codes
  const crowdinLocaleOverrides: Record<string, string> = {
    en_us: "",
    es_es: "es-ES",
    pt_br: "pt-BR",
    zh_cn: "zh-CN",
    zh_tw: "zh-TW",
  };

  for (const locale of locales) {
    const intlLocale =
      intlLocaleOverrides[locale]
      ?? locale.replace(/..$/, (m) => m.toUpperCase()).replace("_", "-");
    const crowdinLocale = crowdinLocaleOverrides[locale] ?? locale.split("_")[0];

    const resolver = await getResolver<typeof t_website>("website_translations.json", locale);
    const intl = new Intl.DisplayNames(intlLocale, {
      languageDisplay: "standard",
      style: "short",
      type: "language",
    });

    returned[locale === "en_us" ? "root" : locale] = {
      lang: intlLocale,
      link: locale === "en_us" ? "/" : `/${locale}/`,
      label: intl
        .of(intlLocale)!
        .replace(/^\p{CWU}/u, (firstChar) => firstChar.toLocaleUpperCase(intlLocale)),

      title: resolver("title"),
      description: resolver("description"),

      markdown: {
        codeCopyButton: {
          copiedText: resolver("code.copied"),
          tooltipText: resolver("code.copy"),
        },

        container: {
          cautionLabel: resolver("container.caution"),
          dangerLabel: resolver("container.danger"),
          detailsLabel: resolver("container.details"),
          importantLabel: resolver("container.important"),
          infoLabel: resolver("container.info"),
          noteLabel: resolver("container.note"),
          tipLabel: resolver("container.tip"),
          warningLabel: resolver("container.warning"),
          customContainers: {
            prerequisites: resolver("container.prerequisites"),
          },
        },
      },

      themeConfig: {
        authors: {
          heading: resolver("authors.heading"),
          noGitHub: resolver("authors.no_github"),
        },

        banner: {
          local: {
            build: resolver("banner.local.build"),
            dev: resolver("banner.local.dev"),
          },
          pr: {
            text: resolver("banner.pr"),
            link: resolver("banner.pr.link"),
          },
        },

        code: {
          enterFullscreen: resolver("code.enter_fullscreen"),
          exitFullscreen: resolver("code.exit_fullscreen"),
          wrap: resolver("code.wrap"),
        },

        darkModeSwitchLabel: resolver("mode_switcher"),

        darkModeSwitchTitle: resolver("mode_dark"),

        docFooter: {
          next: resolver("footer.next"),
          prev: resolver("footer.prev"),
        },

        download: {
          text: resolver("download"),
        },

        editLink: {
          pattern:
            locale === "en_us"
              ? "https://github.com/FabricMC/fabric-docs/edit/main/:path"
              : `https://crowdin.com/project/fabricmc/${crowdinLocale}`,
          text: locale === "en_us" ? resolver("edit_github") : resolver("edit_crowdin"),
        },

        footer: {
          copyright: resolver("footer.copyright").replace(
            "%s",
            [
              '<a href="https://github.com/FabricMC/fabric-docs/blob/-/LICENSE" target="_blank" rel="noreferrer">',
              resolver("footer.license"),
              "</a>",
            ].join("")
          ),
          message: resolver("footer.message"),
        },

        langMenuLabel: resolver("lang_switcher"),

        lastUpdated: {
          text: resolver("last_updated"),
        },

        lightModeSwitchTitle: resolver("mode_light"),

        nav: [
          {
            text: resolver("nav.home"),
            link: "https://fabricmc.net/",
            noIcon: true,
          },
          {
            text: resolver("nav.contribute"),
            link: `${locale === "en_us" ? "" : `/${locale}`}/contributing`,
          },
          {
            text: resolver("nav.repo"),
            items: [
              {
                text: "Fabric API",
                link: "https://github.com/FabricMC/fabric",
              },
              {
                text: "Fabric Loader",
                link: "https://github.com/FabricMC/fabric-loader",
              },
              {
                text: "Fabric Loom",
                link: "https://github.com/FabricMC/fabric-loom",
              },
              {
                text: "Fabric Annotater",
                link: "https://github.com/FabricMC/mcsrc",
              },
            ],
          },
          {
            component: "VersionSwitcher",
          },
        ],

        notFound: {
          code: resolver("404.code"),
          title: resolver("404.title"),
          pooh: resolver("404.title.pooh"),
          quotes: resolver("404.quotes"),

          crowdinLinkLabel: resolver("404.crowdin_link.label"),
          crowdinLinkText: resolver("404.crowdin_link"),

          englishLinkLabel: resolver("404.english_link.label"),
          englishLinkText: resolver("404.english_link"),

          linkLabel: resolver("404.link.label"),
          linkText: resolver("404.link"),
        },

        outline: {
          label: resolver("outline"),
        },

        references: {
          files: resolver("references.files"),
          resources: resolver("references.resources"),
        },

        returnToTopLabel: resolver("return_to_top"),

        search: {
          options: {
            translations: {
              button: {
                buttonAriaLabel: resolver("search.button"),
                buttonText: resolver("search.button"),
              },
              modal: {
                backButtonTitle: resolver("search.back"),
                displayDetails: resolver("search.display_details"),
                noResultsText: resolver("search.no_results"),
                resetButtonTitle: resolver("search.reset"),
                footer: {
                  closeKeyAriaLabel: resolver("search.footer.close.key"),
                  closeText: resolver("search.footer.close"),
                  navigateDownKeyAriaLabel: resolver("search.footer.down.key"),
                  navigateText: resolver("search.footer.navigate"),
                  navigateUpKeyAriaLabel: resolver("search.footer.up.key"),
                  selectKeyAriaLabel: resolver("search.footer.select.key"),
                  selectText: resolver("search.footer.select"),
                },
              },
            },
          },
        },

        sidebar: await getSidebar(locale),

        sidebarMenuLabel: resolver("sidebar_menu"),

        siteTitle: resolver("title"),

        skipToContentLabel: resolver("skip_to_content"),

        socialLinks: [
          {
            icon: "github",
            link: "https://github.com/FabricMC/fabric-docs",
            ariaLabel: resolver("social.github"),
          },
          {
            icon: "discord",
            link: "https://discord.fabricmc.net/",
            ariaLabel: resolver("social.discord"),
          },
          {
            icon: "crowdin",
            link: `https://crowdin.com/project/fabricmc/${crowdinLocale}`,
            ariaLabel: resolver("social.crowdin"),
          },
        ],

        version: {
          reminder: {
            oldVersion: resolver("version.reminder.old_version"),
            oldVersionHome: resolver("version.reminder.old_version_home"),
            futureVersion: resolver("version.reminder.future_version"),
          },

          switcher: {
            label: resolver("version.switcher.label"),
            none: resolver("version.switcher.none"),
          },
        },

        versionSwitcher: false,
      },
    };
  }

  return returned;
};
