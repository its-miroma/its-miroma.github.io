<script setup lang="ts">
import { type DefaultTheme, useData, useRoute } from "vitepress";
import VPNavMenuGroup from "vitepress/dist/client/theme-default/components/VPNavMenuGroup.vue";
import { computed } from "vue";
import type { ThemeConfig } from "../../types.d.ts";
import { useIconSpan } from "../composables/iconSpan.ts";

/*
TODO: there is a warning message in console:

[Vue warn]: onMounted is called when there is no active component instance to be associated with. Lifecycle injection APIs can only be used during execution of setup(). If you are using async setup(), make sure to register lifecycle hooks before the first await statement.
*/

const props = defineProps<{
  screenMenu?: boolean;
  versioningPlugin: {
    versions: string[];
    latestVersion: string;
  };
}>();

const data = useData<ThemeConfig>();
const route = useRoute();

const options = computed(() => data.theme.value.version);

// TODO: revert the removal of version checking.
const currentV = computed(
  () => (data.frontmatter.value.version as string) || props.versioningPlugin.latestVersion
);

const _currentV = computed(() => {
  if (data.frontmatter.value.version) return data.frontmatter.value.version as string;

  const split = data.page.value.relativePath.split("/");
  if (/^[0-9.]+$/.test(split[0])) return split[0];
  if (/^.._..$/.test(split[0]) && /^[0-9.]+$/.test(split[1])) return split[1];
  return props.versioningPlugin.latestVersion;
});

// TODO: the icon is not rendered correctly by VPMenuGroup, which uses {{ text }}, not v-html. this is an upstream issue, and ideally NavItem should support an icon (now made easy by vitepress' icon pipeline)
const text = computed(() => `${useIconSpan("lucide:git-graph")} ${currentV.value}`);

// TODO(not-for-llm): add future versions to the supported pages
const collator = new Intl.Collator(undefined, { numeric: true });
const versions = computed(() => [
  props.versioningPlugin.latestVersion,
  ...(data.theme.value.excludeVersions
    ? []
    : props.versioningPlugin.versions.toSorted(collator.compare).reverse()),
]);

/**
route format: `/[locale/][version/]path/to/[file-name]`
- `[locale/]` is not added for pages in English
- `[version/]` is not added for the latest version
- `[file-name]` is not added for index.md files
*/
const getRoute = (v: string) => {
  if (v === data.frontmatter.value.version) return route.hash || ".";

  return `/${[
    data.localeIndex.value !== "root" ? data.localeIndex.value : undefined,
    v !== props.versioningPlugin.latestVersion ? v : undefined,
    data.frontmatter.value.purePath,
  ]
    .filter(Boolean)
    .join("/")}`;
};

const items = computed(
  () =>
    [
      ...versions.value.map((v) => ({
        text: options.value.switcherLabel.replace("%s", v),
        link: getRoute(v),
        activeMatch: v === currentV.value ? "(?=)" : "(?!)",
      })),
      versions.value.length <= 1 && {
        text: options.value.noOtherVersions,
        link: "",
      },
    ].filter(Boolean) as DefaultTheme.NavItemWithLink[]
);
</script>

<template>
  <VPNavMenuGroup :item="{ text, items, activeMatch: '(?!)' }" :screen="screenMenu" />
</template>

<style scoped>
:deep(span.VPLink) {
  padding-inline: 0.75rem;
  font-size: 0.875rem;
  font-style: italic;
  color: var(--vp-c-text-1);
}
</style>
