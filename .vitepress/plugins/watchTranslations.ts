import * as path from "node:path";
import type { Plugin } from "vitepress";

export const watchTranslationsPlugin = (): Plugin => ({
  name: "watch-translations",
  enforce: "pre",

  configureServer(server) {
    server.watcher
      .add(path.resolve(import.meta.dirname, "..", "..", "**", "*_translations.json"))
      .on("change", (file) => {
        if (!file.endsWith("_translations.json")) return;

        server.config.logger.info(
          `${path.relative(process.cwd(), file)} changed, restarting server...\n`,
          { clear: true, timestamp: true }
        );
        server.restart();
      });
  },
});
