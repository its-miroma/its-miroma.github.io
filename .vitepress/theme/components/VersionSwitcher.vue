<script setup lang="ts">
import { Icon, loadIcon } from "@iconify/vue";
import { computedAsync } from "@vueuse/core";
import { useData } from "vitepress";
import VPFlyout from "vitepress/dist/client/theme-default/components/VPFlyout.vue";
import { VPLink } from "vitepress/theme";
import { computed, ref } from "vue";
import type { Fabric } from "../../types.d.ts";

// TODO: should this me moved to ../layout/, seeing as it's only used in the layout not in the pages?
// although, maybe it needs to be registered with app.component? Or.. can I add it to a slot in DefaultTheme.Layout?

const props = defineProps<{
  versioningPlugin: { versions: string[]; latestVersion: string };
  screenMenu?: boolean;
}>();

const data = useData();
const collator = new Intl.Collator(undefined, { numeric: true });

const env = computed(() => data.theme.value.env as Fabric.EnvOptions);
const options = computed(() => data.theme.value.version as Fabric.VersionOptions);
const currentV = computed(() => {
  if (data.frontmatter.value.version) return data.frontmatter.value.version as string;

  const split = data.page.value.relativePath.split("/");
  if (/^[0-9.]+$/.test(split[0])) return split[0];
  if (/^.._..$/.test(split[0]) && /^[0-9.]+$/.test(split[1])) return split[1];
  return props.versioningPlugin.latestVersion;
});

const body = computedAsync(async () => (await loadIcon("lucide:git-graph")).body);

const button = computed(() => {
  if (!body.value) return;

  const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">${body.value}</svg>`;
  return `<span style="display:flex;align-items:center;gap:4px">${icon} ${currentV.value}</span>`;
});

// TODO(not-for-llm): add future versions to the supported pages
const versions = computed(() => [
  props.versioningPlugin.latestVersion,
  ...(typeof env.value === "number"
    ? []
    : props.versioningPlugin.versions.toSorted(collator.compare).reverse()),
]);

const open = ref(false);

/**
route format: `[locale/][version/]path/to/[file-name]`
- `[locale/]` is not added for pages in English
- `[version/]` is not added for the latest version
- `[file-name]` is not added for index.md files
*/
const getRoute = (newVersion: string) => {
  if (newVersion === data.frontmatter.value.version) return;

  return [
    "",
    data.localeIndex.value !== "root" ? data.localeIndex.value : undefined,
    newVersion !== props.versioningPlugin.latestVersion ? newVersion : undefined,
    data.frontmatter.value.purePath,
  ]
    .filter((s) => s !== undefined)
    .join("/")
    .replace(/((?<=^|[/])index)?[.]md$/, "");
};
</script>

<template>
  <component
    :is="screenMenu ? 'div' : VPFlyout"
    :class="{ open }"
    :button
    :label="options.switcherLabel.replace('%s', currentV)"
  >
    <button v-if="screenMenu" :aria-expanded="open" @click="open = !open">
      <span>
        <Icon icon="lucide:git-graph" width="16" height="16" />
        {{ options.switcherLabel.replace("%s", currentV) }}
      </span>
      <span class="vpi-plus" />
    </button>

    <ul>
      <li v-for="v in versions" :key="v">
        <VPLink :href="getRoute(v)">{{ options.switcherLabel.replace("%s", v) }}</VPLink>
      </li>
      <li v-if="versions.length <= 1" class="none">
        <VPLink>{{ options.noOtherVersions }}</VPLink>
      </li>
    </ul>
  </component>
</template>

<style scoped>
div:not(.VPFlyout) {
  overflow: hidden;
  height: 48px;
  border-bottom: 1px solid var(--vp-c-divider);
  transition: border-color 0.5s;

  button {
    display: flex;
    align-items: center;
    justify-content: space-between;

    width: 100%;
    padding: 12px 4px 11px 0;

    font-size: 14px;
    font-weight: 500;
    line-height: 24px;
    color: var(--vp-c-text-1);

    transition: color 0.25s;

    span {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .vpi-plus {
      transition: transform 0.25s;
    }

    &:hover {
      color: var(--vp-c-brand-1);
    }
  }
}

.open:not(.VPFlyout) {
  height: auto;
  padding-bottom: 10px;

  button {
    color: var(--vp-c-brand-1);
  }

  .vpi-plus {
    transform: rotate(45deg);
  }
}

li:not(.none) > span.VPLink {
  font-weight: bold;
}

li.none > span.VPLink {
  font-style: italic;
}

.VPLink {
  display: block;

  padding: 0 12px;
  border-radius: 6px;

  font-size: 14px;
  font-weight: 500;
  line-height: 32px;
  color: var(--vp-c-text-1);
  white-space: nowrap;

  transition:
    background-color 0.25s,
    color 0.25s;
}

a.VPLink:hover {
  color: var(--vp-c-brand-1);
  background-color: var(--vp-c-default-soft);
}
</style>
