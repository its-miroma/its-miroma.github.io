import * as fs from "node:fs";
import * as path from "node:path";
import * as tinyglobby from "tinyglobby";
import Develop from "../sidebars/develop.ts";
import Players from "../sidebars/players.ts";
import type { Fabric } from "../types.d.ts";

type SidebarTranslations = typeof import("../../sidebar_translations.json");
type WebsiteTranslations = typeof import("../../website_translations.json");

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

const translated = path.resolve(import.meta.dirname, "..", "..", "translated");

const getResolver = //
  <T extends Record<string, any>>(
    file: string,
    locale: string
  ): (<K extends keyof T>(k: K) => T[K]) => {
    const stringsFile = path.resolve(translated, locale === "en_us" ? ".." : locale, file);
    const strings = JSON.parse(fs.readFileSync(stringsFile, "utf-8"));

    if (locale !== "en_us") {
      const fallbackFile = path.resolve(translated, "..", file);
      const fallback = JSON.parse(fs.readFileSync(fallbackFile, "utf-8"));
      return (k) => strings[k] || fallback[k];
    }

    for (const k of Object.keys(strings)) {
      if (!/^([/][/])?[a-z0-9_.]*$/.test(k)) {
        console.warn(`${file}: unusual character in key: ${k}`);
      }
    }

    return (k) => {
      if (strings[k] === undefined) {
        console.warn(`${file}: missing translation for key: ${String(k)}`);
      }

      return strings[k];
    };
  };

export const getSidebar = (locale: string) => {
  const returned: Fabric.Sidebar = {};
  const resolver = getResolver<SidebarTranslations>("sidebar_translations.json", locale);

  const normalizeSidebar = (sidebar: Fabric.SidebarItem[]) => {
    const returned: Fabric.SidebarItem[] = JSON.parse(JSON.stringify(sidebar));

    for (const item of returned) {
      // @ts-expect-error
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

export const getLocales = () => {
  const returned: Fabric.Config["locales"] = {};

  const locales = getLocaleNames(translated);

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

    const resolver = getResolver<WebsiteTranslations>("website_translations.json", locale);
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

        sidebar: getSidebar(locale),

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
