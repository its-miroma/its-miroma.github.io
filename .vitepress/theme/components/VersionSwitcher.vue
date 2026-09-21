<script setup lang="ts">
import { type DefaultTheme, useData, useRoute } from "vitepress";
import VPNavMenuGroup from "vitepress/dist/client/theme-default/components/VPNavMenuGroup.vue";
import { computed } from "vue";
import type { ThemeConfig } from "../../types.d.ts";
import { useIconSpan } from "../composables/iconSpan.ts";

/*
TODO: there is a warning message in console:

[Vue warn]: onMounted is called when there is no active component instance to be associated with. Lifecycle injection APIs can only be used during execution of setup(). If you are using async setup(), make sure to register lifecycle hooks before the first await statement.

might be related to useIconSpan.
*/

const props = defineProps<{
  h1?: boolean;
  screenMenu?: boolean;
  versioningPlugin: {
    versions: string[];
    latestVersion: string;
  };
}>();

const data = useData<ThemeConfig>();
const route = useRoute();

const options = computed(() => data.theme.value.version);

const currentV = computed(() => {
  if (data.frontmatter.value.version) return data.frontmatter.value.version as string;

  const split = data.page.value.relativePath.split("/");
  if (/^.._..$/.test(split[0])) split.splice(0, 1);
  if (/^[0-9]+[.][0-9]+([.][0-9]+)?$/.test(split[0])) return split[0];
  return props.versioningPlugin.latestVersion;
});

// TODO(upstream): the icon is not rendered correctly by VPMenuGroup, which uses {{ text }}, not v-html. ideally NavItem should support an icon (now made easy by vitepress' icon pipeline)
const text = computed(() => `${useIconSpan("material-icon-theme:minecraft")} ${currentV.value}`);

// TODO(not-for-llm): add future versions to the supported pages
const collator = new Intl.Collator(undefined, { numeric: true });
const versions = computed(() => [
  props.versioningPlugin.latestVersion,
  ...props.versioningPlugin.versions
    .filter((v) => !data.theme.value.excludedVersions.includes(v))
    .toSorted(collator.compare)
    .reverse(),
]);

/**
route format: `/[locale/][version/]path/to/[file-name]`
- `[locale/]` is not added for pages in English
- `[version/]` is not added for the latest version
- `[file-name]` is not added for index.md files
*/
const getRoute = (v: string) => {
  if (v === data.frontmatter.value.version) return route.hash || "#";

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
  <VPNavMenuGroup
    :item="{ text, items, activeMatch: '(?!)' }"
    :screen="screenMenu"
    :class="h1 && ['VPBadge', currentV === versioningPlugin.latestVersion ? 'info' : 'warning']"
  />
</template>

<style scoped>
:deep([class^="vpi-"]:not([class$="-icon"])) {
  font-size: 1.5rem;
  vertical-align: middle;
  margin-bottom: 1px;
}

:deep(span.VPLink) {
  padding-inline: 0.75rem;
  font-size: 0.875rem;
  font-style: italic;
  font-weight: 400;
  color: var(--vp-c-text-1);
}

.VPBadge.VPFlyout {
  z-index: 1;
  padding: 0;
  letter-spacing: 0;

  &:deep(.button) {
    height: auto;
    padding-inline: 0.5rem;

    .text {
      line-height: 2.5rem;
    }
  }

  &:deep(.menu) {
    top: 2.5rem;
    right: revert;

    ul {
      list-style: none;
      padding-left: 0;
      margin: 0;

      li {
        margin-top: 0;

        a {
          text-decoration: unset;
        }
      }
    }
  }
}
</style>
