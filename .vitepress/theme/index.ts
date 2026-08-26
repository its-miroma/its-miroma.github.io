/// <reference types="vitepress/client" />
import type { Theme } from "vitepress";
import { enhanceAppWithTabs } from "vitepress-plugin-tabs/client";
import DefaultTheme from "vitepress/theme";
import type { Component } from "vue";
import Layout from "./Layout.vue";
import "./style.css";

const modules = import.meta.glob<{ default: Component }>("./components/*.vue", { eager: true });

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp: ({ app }) => {
    enhanceAppWithTabs(app);

    for (const [path, module] of Object.entries(modules)) {
      app.component(path.match(/[/]([^/]+)[.]vue$/)![1], module.default);
    }
  },
} satisfies Theme;
