<!-- TODO: why this ColorSwatch component? only used in one page (text-and-translations.md), and I would've expected that page to just use some CSS: the hex code is already in the table, so if the table row has a hex code in the last cell the first can just get the background that is that color, no? I don't care that this is a square. -->

<script setup lang="ts">
defineProps<{ color: string }>();
</script>

<template>
  <div :style="`background-color: ${color}`" />
</template>

<style scoped>
div {
  width: 100%;
  margin: auto;
  padding: 50%;
  border-color: #888;
  border-width: 1px;
  border-radius: 0.25rem;
}
</style>
