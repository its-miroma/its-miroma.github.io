import * as path from "node:path";
import * as process from "node:process";
import type { Plugin } from "vitepress";
import AT from "../constants/at.ts";

export const watchTranslationsPlugin = (): Plugin => ({
  name: "fabric-docs:watch-translations",
  enforce: "pre",

  configureServer(server) {
    server.watcher.add(path.resolve(AT, "**", "*_translations.json")).on("change", (file) => {
      if (!file.endsWith("_translations.json")) return;

      server.config.logger.info(
        `${path.relative(process.cwd(), file)} changed, restarting server...\n`,
        { clear: true, timestamp: true }
      );
      server.restart();
    });
  },
});
