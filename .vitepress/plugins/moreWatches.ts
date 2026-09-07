import * as path from "node:path";
import type { Plugin } from "vitepress";
import AT from "../constants/at.ts";

export const moreWatchesPlugin = (): Plugin => ({
  name: "fabric-docs:watch-translations",
  enforce: "pre",

  configureServer(server) {
    const buildGradle = path.resolve(AT, "reference", "latest", "build.gradle");
    const translations = path.resolve(AT, "**", "*_translations.json");

    server.watcher.add([buildGradle, translations]).on("change", (f) => {
      if (f !== buildGradle && !f.endsWith("_translations.json")) return;

      server.config.logger.info(`${path.relative(AT, f)} changed, restarting server...\n`, {
        clear: true,
        timestamp: true,
      });
      server.restart();
    });
  },
});
