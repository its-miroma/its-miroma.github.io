<script setup lang="ts">
import "vidstack/player";
import "vidstack/player/layouts/default";
import "vidstack/player/styles/default/layouts/video.css";
import "vidstack/player/styles/default/theme.css";
import "vidstack/player/ui";
import { useData } from "vitepress";
import { VPButton } from "vitepress/theme";
import { computed, ref, useSlots } from "vue";
import type { Fabric } from "../../types.d.ts";

const props = defineProps<{
  src: string;
  warn?: boolean;
}>();

const data = useData();
const slots = useSlots();

const markdown = computed(() => data.site.value.locales[data.localeIndex.value].markdown!);
const options = computed(() => data.theme.value.video as Fabric.VideoOptions);

const videoTitle = String(slots.default?.()?.[0]?.children ?? "");

const showWarning = ref(props.warn);
</script>

<template>
  <media-player load="visible" view-type="video" stream-type="on-demand" :title="videoTitle" :src>
    <media-provider />
    <media-video-layout />

    <dialog v-if="showWarning">
      <h3>{{ markdown.container!.warningLabel }}</h3>
      <p>{{ options.description }}</p>
      <VPButton @click="showWarning = !showWarning">{{ options.button }}</VPButton>
    </dialog>
  </media-player>
</template>

<style scoped>
dialog {
  z-index: 10;
  width: 100%;
  height: 100%;
  background-color: #000e;
  padding: 2rem;
  border-radius: 6px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

h3 {
  margin-top: 0;
}

p {
  text-wrap: balance;
}
</style>
