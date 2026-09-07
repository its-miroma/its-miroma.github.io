import { UserConfig } from "vitepress";
import { Versioned } from "vitepress-versioning-plugin";

// TODO: worth exploration: Is there a way to use a .ts file instead of website_translations.json?
// with this we would reduce the duplication stemming from @default here + values in .json
// the only question is whether Crowdin supports translating .ts files, or
// whether we shall generate the files in CI before pushing - trivial with fs.writeFileSync(JSON.stringify(...)).
// This can also open the door to not having sidebar_translations.json and localizing the sidebar files directly.

export interface Translations {
  sidebar: typeof import("../sidebar_translations.json");
  website: typeof import("../website_translations.json");
}

export type SidebarItem =
  | string
  | (Omit<Versioned.SidebarItem, "text" | "link" | "base" | "items">
      & (
        | { text: string; link?: never; base?: never; items: SidebarItem[] }
        | { text?: never; link: string; base: string; items?: SidebarItem[] }
        | { text?: never; link?: never; base: string; items: SidebarItem[] }
        | { text?: never; link: string; base?: never; items?: SidebarItem[] }
      ));

export interface ThemeConfig extends Versioned.ThemeConfig {
  authors: {
    /**
     * @default "Page Authors"
     */
    heading: string;

    /**
     * @default "%s (not from GitHub)"
     */
    noGitHub: string;
  };

  banner: {
    local: {
      /**
       * @default "This is a local build"
       */
      build: string;

      /**
       * @default "This is a local preview"
       */
      dev: string;
    };

    pr: {
      /**
       * @default "This is a preview of %s"
       */
      text: string;

      /**
       * @default "Pull Request #%d"
       */
      link: string;
    };
  };

  code: {
    /**
     * @default "Full Screen"
     */
    enterFullscreen: string;

    /**
     * @default "Exit Full Screen"
     */
    exitFullscreen: string;

    /**
     * @default "Toggle Wrap Code"
     */
    wrap: string;
  };

  /** @deprecated TODO(not-for-llm): remove */
  download: unknown;

  env: typeof import("./constants/env.ts").default;

  excludeVersions: boolean;

  notFound: {
    /**
     * @default "404"
     */
    code: string;

    /**
     * Set aria label for Crowdin link.
     *
     * @default "Open the Crowdin editor"
     */
    crowdinLinkLabel: string;

    /**
     * Set custom Crowdin link text.
     *
     * @default "Localize on Crowdin"
     */
    crowdinLinkText: string;

    /**
     * Set aria label for English link.
     *
     * @default "Open the English version"
     */
    englishLinkLabel: string;

    /**
     * Set custom English link text.
     *
     * @default "Read in English"
     */
    englishLinkText: string;

    /**
     * Set aria label for home link.
     *
     * @default "Go to the home page"
     */
    linkLabel: string;

    /**
     * Set custom home link text.
     *
     * @default "Take Me Home"
     */
    linkText: string;

    /**
     * The possible different quotes.
     */
    quotes: string[];

    /**
     * Set custom not found message.
     *
     * @default "Page not found"
     */
    title: string;

    /**
     * Special not found message.
     *
     * @default "Page knot found"
     */
    pooh: string;
  };

  references: {
    /**
     * @default "Files Referenced"
     */
    files: string;

    /**
     * @default "Sources & Resources"
     */
    resources: string;
  };

  sidebar: Record<string, SidebarItem[]>;

  version: {
    /**
     * @default "Minecraft %s"
     */
    switcherLabel: string;

    /**
     * @default "No other versions"
     */
    noOtherVersions: string;
  };

  video: {
    /**
     * @default "Warning"
     */
    title: string;

    /**
     * @default "This video contains flashing lights."
     */
    description: string;

    /**
     * @default "Proceed"
     */
    button: string;
  };
}

export type Config = UserConfig<ThemeConfig> & Versioned.Config;
