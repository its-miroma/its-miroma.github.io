<script setup lang="ts">
import { useData } from "vitepress";
import { VPButton } from "vitepress/theme";
import { computed, useSlots } from "vue";
import type { Fabric } from "../../types.d.ts";

// TODO: ideally this component would not be needed. A better experience would be something like:
// ![Alt text for the downloadable image](@/assets/path/to/preview-image.png){download}
// ...which would replace this:
// <DownloadEntry visualURL="@/assets/path/to/preview-image.png" downloadURL="@/assets/path/to/preview-image.png">Alt text for the downloadable image</DownloadEntry>
//
// This is supported too:
// ![Alt text for the preview image](@/assets/path/to/preview-image.png){download=@/assets/path/to/download-image.png}
//
// This shouldn't be rendered as an image and a VPButton under.
// Instead, it would be great if it was an image with a download button hovering over it,
// similar to the copy button on code blocks (see FullscreenCode.vue).
// Such button should also exist in the medium-zoom overlay for downloadable images.
// I guess that overlay is also missing the close button that the fullscreen code dialog has...
//
// When looking through the usages in the pages, I found that most DownloadEntries have two images, one for the preview and one for the downloadable.
// Very few if not none use visualURL="". So maybe {download} should actually assume that it wants a different image.
// I don't know if it should be hosted under /download/path/to/image.png (given /assets/path/to/image.png), or maybe it should be
// /assets/path/to/image.download.png, or something predictable anyway. Also, I noticed that some downloadURLs are for .zip files,
// which are difficult to manage and analyze in a git repo. Is it possible to use the service for downloading a zip of a folder off GitHub instead?
// This way one would host the "zip" file uncompressed under /download/path/to/image.png/*, and zipping it would result in image.png.zip ig?? Idrk...
//
// anyway, TL;DR: this component needs rethinking because I'd like it to be smarter, more independent, and sturdy.

defineProps<{
  downloadURL: string;
  visualURL?: string;
}>();

const data = useData();

const title = useSlots().default?.() ?? [""];

const text = computed(() =>
  (data.theme.value.download as Fabric.DownloadOptions).text.replace(
    "%s",
    title.length > 0 ? ((title[0] as any).children ?? "") : "%s"
  )
);
</script>

<template>
  <div>
    <img v-if="visualURL" :src="visualURL ?? downloadURL" />
    <VPButton size="medium" theme="brand" :text :href="downloadURL" download />
  </div>
</template>

<style scoped>
div {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
}

img {
  pointer-events: none;
  z-index: 0;
  max-width: 100%;
  max-height: 300px;
}

/* TODO: this still isn't working as it should, it's still full-width */
.VPButton.medium {
  width: fit-content;
  max-width: 100%;
  padding-block: 8px;

  line-height: unset;
  text-decoration: none;
  text-wrap: balance;
  white-space: normal;

  &:hover {
    cursor: pointer;
  }
}
</style>
