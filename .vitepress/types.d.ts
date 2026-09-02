import type { DefaultTheme, UserConfig } from "vitepress";
import type { Versioned } from "vitepress-versioning-plugin";

// TODO: worth exploration: Is there a way to use a .ts file instead of website_translations.json?
// with this we would reduce the duplication stemming from @default here + values in .json
// the only question is whether Crowdin supports translating .ts files, or
// whether we shall generate the files in CI before pushing - trivial with fs.writeFileSync(JSON.stringify(...)).
// This can also open the door to not having sidebar_translations.json and localizing the sidebar files directly.

// TODO: explore whether we should simplify this file's exports by using Fabric.ThemeConfig["video"] instead of VideoOptions. There is also a possibility that we can use 'useData<Fabric.ThemeConfig>()' instead of 'as Fabric.ThemeConfig'

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
  }

  export interface Translations {
    sidebar: typeof import("../sidebar_translations.json");
    website: typeof import("../website_translations.json");
  }

  type _SidebarItemRest = Omit<Versioned.SidebarItem, "text" | "link" | "base" | "items">;

  export type SidebarItem =
    | string
    | (_SidebarItemRest & { text: string; link?: never; base?: never; items: SidebarItem[] })
    | (_SidebarItemRest & { text?: never; link: string; base: string; items?: SidebarItem[] })
    | (_SidebarItemRest & { text?: never; link?: never; base: string; items: SidebarItem[] })
    | (_SidebarItemRest & { text?: never; link: string; base?: never; items?: SidebarItem[] });

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
