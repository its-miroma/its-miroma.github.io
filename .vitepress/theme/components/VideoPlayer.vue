<script setup lang="ts">
import { resolveAdapterType } from "@videojs/html";
import { computed, useSlots } from "vue";
import MediaPlayer from "./MediaPlayer.vue";

const props = defineProps<{ src: string }>();

const type = computed(() => resolveAdapterType(props.src) as "audio" | "video" | "youtube");

const title = String(useSlots().default?.()?.[0]?.children || "");
</script>

<template>
  <MediaPlayer :type :src :title />
</template>
