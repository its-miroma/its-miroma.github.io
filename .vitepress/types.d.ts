import type { DefaultTheme, UserConfig } from "vitepress";
import type { Versioned } from "vitepress-versioning-plugin";

export namespace Fabric {
  export interface AuthorsOptions {
    /**
     * @default "Page Authors"
     */
    heading: string;

    /**
     * @default "%s (not from GitHub)"
     */
    noGitHub: string;
  }

  export interface BannerOptions {
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
  }

  export interface FullscreenCodeOptions {
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
  }

  export interface DownloadOptions {
    /**
     * Set custom text for download button.
     *
     * @default "Download %s"
     */
    text: string;
  }

  export type EnvOptions = "build" | "dev" | "github" | number;

  export interface NotFoundOptions {
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
  }

  export interface ReferencesOptions {
    /**
     * @default "Files Referenced"
     */
    files: string;

    /**
     * @default "Sources & Resources"
     */
    resources: string;
  }

  export interface VersionOptions {
    /**
     * @default "Minecraft %s"
     */
    switcherLabel: string;

    /**
     * @default "No other versions"
     */
    noOtherVersions: string;
  }

  export interface VideoOptions {
    /**
     * @default "This video contains flashing lights."
     */
    description: string;

    /**
     * @default "Proceed"
     */
    button: string;
  }

  export interface Translations {
    sidebar: typeof import("../sidebar_translations.json");
    website: typeof import("../website_translations.json");
  }

  // TODO: types of sidebar item:
  // - `text: string`, which have not `base` nor `link` but must have `items`
  // - `base: string` and `link: string`: level 0 and when overriding earlier bases. can have items
  // - `base: string`: section title; must have items
  // - `link: string`: verbose syntax, only when it has items
  // - `string`: compact syntax, when it's a link only
  // What needs to be done is threefold:
  // 1. Verify that all these 5 types are real and exist
  // 2. Verify that no SidebarItem breaks these five types
  // 3. Figure out the cleverest and most compact way to represent this in types (doesn't have to be 1:1, but it preferrably should get close)
  export type SidebarItem =
    string | (Omit<Versioned.SidebarItem, "items"> & { items?: SidebarItem[] });

  export interface Sidebar extends DefaultTheme.SidebarMulti {
    [path: string]: SidebarItem[];
  }

  export interface ThemeConfig extends Versioned.ThemeConfig {
    authors: AuthorsOptions;
    banner: BannerOptions;
    code: FullscreenCodeOptions;
    download: DownloadOptions;
    env: EnvOptions;
    notFound: NotFoundOptions;
    references: ReferencesOptions;
    sidebar: Sidebar;
    version: VersionOptions;
    video: VideoOptions;
  }

  export type Config = UserConfig<ThemeConfig> & Versioned.Config;
}
