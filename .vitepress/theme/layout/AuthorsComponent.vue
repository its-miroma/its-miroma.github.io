<script setup lang="ts">
import { useData } from "vitepress";
import { VPLink } from "vitepress/theme";
import { computed } from "vue";
import type { Fabric } from "../../types.d";

type Author = { name: string; noGitHub?: true };

const data = useData();

const options = computed(() => data.theme.value.authors as Fabric.AuthorsOptions);

const authors = computed<Author[]>(() =>
  [
    ...((data.frontmatter.value["authors"] || []) as string[]).map((name) => ({ name })),
    ...((data.frontmatter.value["authors-nogithub"] || []) as string[]).map((name) => ({
      name,
      noGitHub: true,
    })),
  ].sort((a, b) => a.name.localeCompare(b.name))
);

const getImageSrc = (author: Author) => {
  if (author.noGitHub) return "/assets/avatater.png";

  const url = new URL("https://wsrv.nl/");
  url.searchParams.set("af", "");
  url.searchParams.set("w", "32");
  url.searchParams.set("h", "32");
  url.searchParams.set("maxage", "7d");
  url.searchParams.set("url", `https://github.com/${author.name}.png?size=32`);
  url.searchParams.set("default", "https://docs.fabricmc.net/assets/avatater.png");
  return url.toString();
};
</script>

<template>
  <h2 v-if="authors.length">{{ options.heading }}</h2>
  <ul v-if="authors.length">
    <li v-for="a in authors" :key="a.noGitHub ? `${a.name}!` : a.name">
      <VPLink :href="a.noGitHub ? undefined : `https://github.com/${a.name}`" no-icon>
        <img
          :title="a.noGitHub ? options.noGitHub.replace('%s', a.name) : a.name"
          :src="getImageSrc(a)"
          :alt="a.name"
          loading="lazy"
        />
      </VPLink>
    </li>
  </ul>
</template>

<style scoped>
h2 {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--vp-c-divider);

  font-size: 12px;
  font-weight: bold;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

ul {
  display: flex;
  flex-flow: row wrap;
  gap: 8px;
  align-items: center;

  margin-top: 8px;

  a {
    transition: filter 0.2s ease-in-out;

    &:hover {
      filter: brightness(120%);
    }
  }

  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
}

.content-container {
  h2 {
    display: none;
  }

  ul {
    margin-bottom: 16px;
  }
}

@media (width >= 1280px) {
  .content-container > ul {
    display: none;
  }
}
</style>
