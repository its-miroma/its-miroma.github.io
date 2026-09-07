<script setup lang="ts">
import "vidstack/player";
import "vidstack/player/layouts/default";
import "vidstack/player/styles/default/layouts/video.css";
import "vidstack/player/styles/default/theme.css";
import "vidstack/player/ui";
import { useData } from "vitepress";
import { VPButton } from "vitepress/theme";
import { computed, ref, useSlots } from "vue";
import type { ThemeConfig } from "../../types.d.ts";

const props = defineProps<{
  src: string;
  warn?: boolean;
}>();

const data = useData<ThemeConfig>();
const slots = useSlots();

const options = computed(() => data.theme.value.video);

const videoTitle = String(slots.default?.()?.[0]?.children || "");

const showWarning = ref(props.warn);
</script>

<template>
  <media-player load="visible" view-type="video" stream-type="on-demand" :title="videoTitle" :src>
    <media-provider />
    <media-video-layout />

    <dialog v-if="showWarning">
      <h3>{{ options.title }}</h3>
      <p>{{ options.description }}</p>
      <VPButton @click="showWarning = !showWarning">{{ options.button }}</VPButton>
    </dialog>
  </media-player>
</template>

<style scoped>
dialog {
  z-index: 10;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  width: 100%;
  height: 100%;
  padding: 2rem;
  border-radius: 6px;

  /* TODO: are these the right colors to use? or should I use some variables from vp? the background should always be black even in light mode, and text should be white too */
  color: #fff;
  text-align: center;

  background-color: #000e;
}

h3 {
  margin-top: 0;
}
</style>
