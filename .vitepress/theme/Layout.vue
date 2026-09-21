<script setup lang="ts">
import { watchImmediate } from "@vueuse/core";
import mediumZoom from "medium-zoom";
import { inBrowser, useRouter } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { nextTick } from "vue";
import AuthorsComponent from "./layout/AuthorsComponent.vue";
import BannerComponent from "./layout/BannerComponent.vue";
import FullscreenCode from "./layout/FullscreenCode.vue";
import NotFoundComponent from "./layout/NotFoundComponent.vue";
import References from "./layout/References.vue";

// TODO: rename all files under ./layout and ./components to not end with `Component` (warning: must rename all usages.)

const router = useRouter();

// Replace data-gen head script, which updates head tags
router.onAfterRouteChange = () => {
  const oldScript = document.querySelector("script[data-gen]");
  if (!oldScript) return;

  const newScript = document.createElement("script");
  newScript.innerHTML = oldScript.innerHTML;
  newScript.setAttribute("data-gen", "");
  oldScript.parentNode!.replaceChild(newScript, oldScript);
};

// Medium zoom handler
watchImmediate(
  () => router.route.path,
  () =>
    nextTick(() => {
      if (!inBrowser) return;
      mediumZoom(".main img", { background: "var(--vp-c-bg)" });
    })
);
</script>

<template>
  <DefaultTheme.Layout>
    <template #doc-footer-before>
      <References />
    </template>

    <template #doc-before>
      <AuthorsComponent />
    </template>

    <template #aside-outline-after>
      <AuthorsComponent />
      <References />
    </template>

    <template #not-found>
      <NotFoundComponent />
    </template>

    <template #layout-top>
      <BannerComponent />
    </template>

    <template #layout-bottom>
      <FullscreenCode />
    </template>
  </DefaultTheme.Layout>
</template>
