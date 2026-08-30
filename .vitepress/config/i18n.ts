import * as fs from "node:fs";
import * as path from "node:path";
import * as tinyglobby from "tinyglobby";
import AT from "../at.ts";
import { DEVELOP_SIDEBAR } from "../sidebars/develop.ts";
import { PLAYERS_SIDEBAR } from "../sidebars/players.ts";
import type { Fabric } from "../types.d.ts";

const REQUIRED_FILES = ["index.md", "website_translations.json"] as const;
export const getLocales = () => [
  "en_us",
  ...tinyglobby
    .globSync("*", { cwd: path.resolve(AT, "translated"), onlyDirectories: true, absolute: true })
    .filter((d) => REQUIRED_FILES.every((f) => fs.existsSync(path.resolve(d, f))))
    .map((d) => path.basename(d)),
];

const translationFileCache = new Map<string, Record<string, any>>();
const readTranslationFile = <T extends Record<string, any>>(file: string, locale: string): T => {
  const filePath = path.resolve(AT, "translated", locale === "en_us" ? ".." : locale, file);
  if (!translationFileCache.has(filePath)) {
    try {
      translationFileCache.set(filePath, JSON.parse(fs.readFileSync(filePath, "utf-8")));
    } catch {
      return {} as T;
    }
  }

  return translationFileCache.get(filePath) as T;
};

type Resolver<T extends Record<string, any>> = <K extends string & keyof T>(k: K) => T[K];
const getResolver = <T extends Record<string, any>>(file: string, locale: string): Resolver<T> => {
  const strings = readTranslationFile<T>(file, locale);

  if (locale !== "en_us") {
    const fallback = readTranslationFile<T>(file, "en_us");

    return (k) => strings[k] || fallback[k];
  }

  return (k) => {
    if (strings[k] === undefined && !k.endsWith("/")) {
      console.warn(`${file}: missing translation for key '${k}'`);
    }

    return strings[k];
  };
};

export const getWebsiteResolver = (locale: string) => {
  const file = "website_translations.json";

  if (locale === "en_us") {
    const strings = readTranslationFile<Fabric.Translations["website"]>(file, "en_us");
    for (const k of Object.keys(strings)) {
      if (!/^([/][/])?[a-z0-9_.]*$/.test(k)) {
        console.warn(`${file}: unusual character in key '${k}'`);
      }
    }
  }

  return getResolver<Fabric.Translations["website"]>(file, locale);
};

export const getSidebar = (locale: string) => {
  const returned: Fabric.Sidebar = {};

  const localePrefix = locale === "en_us" ? "" : `/${locale}`;

  const file = "sidebar_translations.json";
  const resolver = getResolver<Fabric.Translations["sidebar"]>("sidebar_translations.json", locale);

  const normalizeSidebar = (sidebar: Fabric.SidebarItem[], base = "") => {
    const returned = (JSON.parse(JSON.stringify(sidebar)) as Fabric.SidebarItem[]) //
      .map((item) => (typeof item === "string" ? { link: item } : item));

    for (const item of returned) {
      const k = item.text ?? `${item.base ?? base}${item.link ?? ""}`;

      // @ts-expect-error
      item.text = resolver(k) ?? (item.link && k.endsWith("/") ? resolver("introduction") : "");

      if (!item.text) {
        console.warn(`${file}: missing translation for key '${k}'`);
      }

      if (item.items) {
        item.items = normalizeSidebar(item.items, item.base ?? base);
      }

      item.base = `${localePrefix}${item.base ?? base}`;
    }

    return returned;
  };

  returned[`${localePrefix}/develop/`] = normalizeSidebar([DEVELOP_SIDEBAR]);
  returned[`${localePrefix}/players/`] = normalizeSidebar([PLAYERS_SIDEBAR]);

  return returned;
};

export const getLocaleConfig = () => {
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

  for (const locale of getLocales()) {
    const intlLocale =
      intlLocaleOverrides[locale]
      ?? locale.replace(/..$/, (m) => m.toUpperCase()).replace("_", "-");
    const crowdinLocale = crowdinLocaleOverrides[locale] ?? locale.split("_")[0];

    const label = new Intl.DisplayNames(intlLocale, {
      languageDisplay: "standard",
      style: "short",
      type: "language",
    })
      .of(intlLocale)!
      .replace(/^\p{CWU}/u, (firstChar) => firstChar.toLocaleUpperCase(intlLocale));

    const resolver = getWebsiteResolver(locale);

    returned[locale === "en_us" ? "root" : locale] = {
      lang: intlLocale,
      label,

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

        editLink:
          locale === "en_us"
            ? {
                pattern: "https://github.com/FabricMC/fabric-docs/edit/main/:path",
                text: resolver("edit_github"),
              }
            : {
                pattern: `https://crowdin.com/project/fabricmc/${crowdinLocale}`,
                text: resolver("edit_crowdin"),
              },

        footer: {
          // TODO(not-for-llm): if vuejs/vitepress#5390 is merged, use Markdown
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
          switcherLabel: resolver("version.switcher.label"),
          noOtherVersions: resolver("version.switcher.none"),
        },

        versionSwitcher: false,
      },
    };
  }

  return returned;
};
