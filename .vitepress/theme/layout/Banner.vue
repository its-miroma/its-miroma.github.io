<script setup lang="ts">
import { useElementSize } from "@vueuse/core";
import { useData } from "vitepress";
import { VPLink } from "vitepress/theme";
import { computed, onMounted, ref, watchEffect } from "vue";
import type { ThemeConfig } from "../../types.d.ts";

// TODO: make it so that the HTML page having a scrollbar or not does not affect the banner. In other words: the scrollbar's top edge should be under the banner - the banner should span from left to right 100% width despite the scrollbar, the banner should not cover the scrollbar.
// TODO: can we use <template> or <slot> in the value of options.pr?

const data = useData<ThemeConfig>();
const banner = ref<HTMLDivElement>();
const { height } = useElementSize(banner);

const env = computed(() => data.theme.value.env);
const options = computed(() => data.theme.value.banner);

const strings = computed(() => {
  switch (env.value) {
    case "github":
    case "netlify":
      return [];

    case "build":
      return [options.value.local.build];

    case "dev":
      return [options.value.local.dev];

    default: {
      const split = options.value.pr.text.split("%s").filter(Boolean);
      return [split[0], String(env.value), split.slice(1).join("%s")];
    }
  }
});

onMounted(() =>
  watchEffect(() => {
    document.documentElement.style.setProperty(
      "--vp-layout-top-height",
      `${strings.value.length > 0 ? height.value + 16 : 0}px`
    );
  })
);
</script>

<template>
  <div v-show="strings.length" ref="banner">
    {{ strings[0]
    }}<VPLink
      v-if="strings[1]"
      :href="`https://github.com/FabricMC/fabric-docs/pull/${strings[1]}`"
      >{{ options.pr.link.replace("%d", strings[1]) }}</VPLink
    >{{ strings[2] }}
  </div>
</template>

<style scoped>
div {
  position: fixed;
  z-index: var(--vp-z-index-layout-top);
  right: 0;
  left: 0;

  align-items: center;

  padding: 8px;

  font-family: var(--vp-font-family-mono);
  font-weight: 600;
  color: #fff;
  text-align: center;

  background: rgb(207 114 21);
}

a {
  text-decoration: underline;
}
</style>
