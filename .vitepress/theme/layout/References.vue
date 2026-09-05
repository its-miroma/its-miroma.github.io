<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { useData } from "vitepress";
import { VPLink } from "vitepress/theme";
import { computed } from "vue";
import type { Fabric } from "../../types.d.ts";

// TODO: on mobile (narrow viewport) references should be placed akin to "On this page", instead of at the footer.

const data = useData<Fabric.ThemeConfig>();

const options = computed(() => data.theme.value.references);

const resources = computed(() =>
  Object.entries(data.frontmatter.value.resources || {}).map(([href, title]) => {
    const newHref = new URL(href, "https://a.com").href.replace("https://a.com", "");
    return [newHref, (title as string) || newHref] as const;
  })
);

const files = computed(() => (data.frontmatter.value.files || []) as string[]);

const shortestUniquePaths = computed(() =>
  files.value.map((file, i) => {
    const parts = file.split("/");
    for (let len = 1; len <= parts.length; len++) {
      const current = parts.slice(-len).join("/");
      const isUnique = files.value.every(
        (other, j) => i === j || other.split("/").slice(-len).join("/") !== current
      );
      if (isUnique) return current;
    }
    return file;
  })
);

const getImageSrc = (href: string) =>
  `https://www.google.com/s2/favicons?domain=${new URL(href, "https://docs.fabricmc.net").hostname}&sz=16`;

const getFileHref = (filePath: string) =>
  filePath.replace(/^@/, "https://github.com/FabricMC/fabric-docs/blob/-");

const getFileTitle = (filePath: string) =>
  filePath.replace(/^@[/]reference[/][^/]+[/]/, "").replace("com/example/docs", "...");

const getFileExtension = (filePath: string) =>
  filePath
    .replace("fabric.mod.json", "minecraft-fabric")
    .replace(/^.*[.]([^.]+)$/, "$1")
    .replace(/^classtweaker$/, "minecraft-fabric")
    .replace(/^md$/, "markdown");
</script>

<template>
  <template v-if="resources.length">
    <h2>{{ options.resources }}</h2>
    <ul>
      <li v-for="[href, title] in resources" :key="href">
        <VPLink :href>
          <img :src="getImageSrc(href)" alt="" width="16" height="16" />
          <span>{{ title }}</span>
        </VPLink>
      </li>
    </ul>
  </template>

  <template v-if="files.length">
    <h2>{{ options.files }}</h2>
    <ul>
      <li v-for="(f, i) in files" :key="f">
        <VPLink :href="getFileHref(f)" :title="getFileTitle(f)" no-icon>
          <Icon :icon="`material-icon-theme:${getFileExtension(f)}`" />
          <code>
            <template v-for="(seg, j) in shortestUniquePaths[i].split('/')" :key="j">
              <template v-if="j !== 0">/<wbr /></template>{{ seg }}
            </template>
          </code>
        </VPLink>
      </li>
    </ul>
  </template>
</template>

<style scoped>
h2 {
  margin-top: 20px;
  margin-bottom: 8px;

  font-size: 12px;
  font-weight: bold;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.06em;

  &:not(:first-child) {
    padding-top: 16px;
    border-top: 1px solid var(--vp-c-divider);
  }
}

ul:last-of-type:has(+ *:not(div.spacer)) {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--vp-c-divider);
}

li {
  margin-bottom: 4px;
}

.VPLink {
  display: flex;
  gap: 0.3em;
  align-items: flex-start;

  font-size: 12px;
  line-height: 1.5;
  color: var(--vp-c-text-2);

  transition: color 0.15s;

  &:hover {
    color: var(--vp-c-text-1);
  }
}

svg {
  flex-shrink: 0;
  margin-top: 2px;
}

img {
  margin-top: 1px;
}

@media (width >= 1280px) {
  .VPDocFooter {
    * {
      display: none;
    }
  }
}
</style>
