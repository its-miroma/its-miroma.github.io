<script setup lang="ts">
import "@videojs/html/audio/player";
import "@videojs/html/audio/skin";
import "@videojs/html/media/youtube-video";
import "@videojs/html/video/player";
import "@videojs/html/video/skin";

defineProps<{
  type: "audio" | "video" | "youtube";
  src: string;
  title?: string;
}>();
</script>

<template>
  <audio-player v-if="type === 'audio'" :content-title="title">
    <audio-skin>
      <audio :src preload="metadata"></audio>
    </audio-skin>
  </audio-player>

  <video-player v-else :content-title="title">
    <video-skin>
      <youtube-video v-if="type === 'youtube'" :src playsinline></youtube-video>
      <video v-else :src preload="metadata" playsinline></video>
    </video-skin>
  </video-player>
</template>

<style scoped>
audio-player,
video-player {
  display: block;
  margin-block: 1rem;
}

video-skin {
  display: block;
}

youtube-video {
  display: block;
  aspect-ratio: 16 / 9;
  width: 100%;
}
</style>
