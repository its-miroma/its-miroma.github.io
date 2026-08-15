<script setup lang="ts">
import {
  useDebounceFn,
  usePreferredReducedMotion,
  useRafFn,
  useResizeObserver,
} from "@vueuse/core";
import { useData } from "vitepress";
import { VPLink } from "vitepress/theme";
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import type { Fabric } from "../../types.d.ts";

const data = useData();
const prefersReducedMotion = usePreferredReducedMotion();

const root = ref<HTMLDivElement>();
const ball = ref<HTMLCanvasElement>();
const thread = ref<HTMLDivElement>();
const content = ref<HTMLDivElement>();

const isAnimating = ref(true);
const showContent = ref(false);

const random = Math.random();
const options = computed(() => {
  const { quotes, pooh, title, ...rest } = data.theme.value.notFound as Fabric.NotFoundOptions;
  const i = Math.floor(random * quotes.length);

  return {
    title: i === quotes.length - 1 ? pooh : title,
    quote: quotes[i],
    ...rest,
  };
});

// TODO: would it be possible to refactor these to be immutable (const)?
let values: ReturnType<typeof getValues>;
let tPattern: string;

const getValues = () => {
  const rRect = root.value!.getBoundingClientRect();
  const cRect = content.value!.getBoundingClientRect();
  const px = Math.floor((cRect.height * 1.5) / TEXTURE.length);
  const cMiddleX = cRect.width / 2;
  const bDiameter = TEXTURE.length * px;
  const bStartX = -bDiameter - 32;
  const bTotalX = rRect.width + 32 - bStartX;
  const bTopY = (rRect.height - bDiameter) / 2;
  const tTopY = bTopY + 12 * px;

  return { px, bDiameter, bStartX, bTotalX, bTopY, cMiddleX, tTopY };
};

const drawBall = (b: HTMLCanvasElement) => {
  b.width = b.height = TEXTURE.length;
  b.style.width = b.style.height = `${values.bDiameter}px`;
  b.style.zIndex = "2";
  b.style.imageRendering = "pixelated";
  b.style.position = "absolute";
  b.style.top = `${values.bTopY}px`;
  b.style.left = "0px";
  b.style.transform = `translateX(${values.bStartX}px) rotate(0deg)`;

  const context = b.getContext("2d", { alpha: true })!;
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, b.width, b.height);

  for (let x = 0; x < TEXTURE.length; x++) {
    for (let y = 0; y < TEXTURE[x].length; y++) {
      const color = COLORS[TEXTURE[y][x]];
      if (!color) continue;
      context.fillStyle = color;
      context.fillRect(x, y, 1, 1);
    }
  }
};

const createThreadPattern = () => {
  if (tPattern) return;

  const pattern = document.createElement("canvas");
  pattern.width = TEXTURE.length;
  pattern.height = 1;

  const context = pattern.getContext("2d", { alpha: true })!;
  context.imageSmoothingEnabled = false;

  for (let x = 0; x < TEXTURE.length; x++) {
    context.fillStyle = COLORS[Math.floor(Math.random() * (COLORS.length - 1) + 1)]!;
    context.fillRect(x, 0, 1, 1);
  }

  tPattern = pattern.toDataURL();
};

const drawThread = (t: HTMLDivElement) => {
  createThreadPattern();
  t.style.backgroundImage = `url(${tPattern})`;
  t.style.backgroundRepeat = "repeat-x";
  t.style.backgroundSize = `${values.bDiameter}px ${values.px}px`;
  t.style.top = `${values.tTopY}px`;
  t.style.left = `0px`;
  t.style.zIndex = "1";
  t.style.height = `${values.px}px`;
  t.style.width = `${isAnimating.value ? 0 : values.bTotalX}px`;
  t.style.imageRendering = "pixelated";
  t.style.position = "absolute";
};

// TODO: ditto
let startTime = 0;
let totalTime = 0;

const { pause, resume } = useRafFn(
  ({ timestamp }) => {
    const time = Math.min(1, Math.max(0, timestamp - startTime) / totalTime);
    const bStartXNow = values.bStartX + values.bTotalX * (1 - Math.pow(1 - time, 3));
    const bMiddleXNow = bStartXNow + values.bDiameter / 2;

    thread.value!.style.width = `${Math.min(values.bTotalX, bMiddleXNow)}px`;

    // show content when the ball crosses the midpoint
    if (!showContent.value && bMiddleXNow >= values.cMiddleX) {
      showContent.value = true;
    }

    const bCircumference = Math.PI * values.bDiameter;
    const bRotationDeg = ((bStartXNow - values.bStartX) * 360) / bCircumference;
    ball.value!.style.transform = `translateX(${bStartXNow}px) translateZ(0) rotate(${bRotationDeg}deg)`;

    if (time >= 1) {
      isAnimating.value = false;
      pause();
    }
  },
  { immediate: false }
);

const start = () => {
  if (prefersReducedMotion.value === "reduce") {
    showContent.value = true;
    isAnimating.value = false;
    return;
  }

  values = getValues();

  drawBall(ball.value!);
  drawThread(thread.value!);

  totalTime = Math.max(600, 3 * values.bTotalX);
  startTime = performance.now();

  resume();
};

const handleResize = useDebounceFn(() => {
  values = getValues();
  // even after the animation, thread must fill the width
  if (!isAnimating.value) drawThread(thread.value!);
}, 100);
useResizeObserver([root, content], handleResize);

onMounted(async () => {
  await nextTick();
  start();
});

onBeforeUnmount(() => handleResize.cancel());

// extracted from https://github.com/FabricMC/community/blob/57106dcfe85da0f9209b327d19f4e206abd10d76/media/unascribed/png/yarn.png

// prettier-ignore
const COLORS = [ null, "#051842", "#2A6CD9", "#388BF6", "#337FEC", "#235DC0", "#2666CA", "#2764CF", "#1A49A6", "#041439", "#2059BB", "#1847A9", "#1D51B2", "#15409E", "#235CC1", "#123789", "#2A6CD3", "#2E76DD", "#1C4EAE", "#04153C", "#3D95FF", "#1844A0", "#1C4FB1", "#1947A7", "#143C94", "#031133"] as const;

// prettier-ignore
const TEXTURE = [
  [0,  0,  0,  0,  0,  1,  1,  1,  1,  0,  0,  0,  0,  0],
  [0,  0,  0,  1,  1,  2,  3,  4,  2,  1,  1,  0,  0,  0],
  [0,  0,  1,  4,  3,  2,  3,  4,  2,  5,  6,  1,  0,  0],
  [0,  1,  4,  4,  4,  3,  2,  4,  3,  2,  5,  6,  1,  0],
  [0,  1,  3,  3,  3,  4,  2,  4,  3,  2,  5,  6,  1,  0],
  [1,  7,  7,  7,  4,  3,  2,  4,  3,  2,  5,  8,  8,  9],
  [1,  3,  3,  3,  7,  7,  2,  3,  4,  2,  8, 10, 11,  9],
  [1,  4,  4,  4,  4,  4,  2,  3,  4,  2, 12, 12, 13,  9],
  [1,  7,  7,  7,  3,  3,  2,  3,  4, 14, 10, 15, 15,  9],
  [0,  1,  3,  4,  7,  7,  2, 16, 17, 18, 15, 13, 19,  0],
  [0,  1, 20,  3,  4,  2, 17, 16, 18, 10, 13, 11, 19,  0],
  [0,  0,  1,  3, 16, 14,  6,  5, 21, 13, 11, 19,  0,  0],
  [0,  0,  0, 19, 25, 17, 22, 23, 24, 25, 19,  0,  0,  0],
  [0,  0,  0,  0,  0, 19, 19, 19, 19,  0,  0,  0,  0,  0],
] as const;
</script>

<template>
  <div ref="root" class="not-found" aria-live="polite">
    <div class="yarn" aria-hidden="true">
      <canvas ref="ball" v-show="isAnimating" />
      <div ref="thread" />
    </div>

    <div
      ref="content"
      :style="{
        opacity: showContent ? 1 : 0,
        pointerEvents: showContent ? 'auto' : 'none',
      }"
      :aria-hidden="!showContent"
    >
      <code>{{ options.code }}</code>
      <h1>{{ options.title.toLocaleUpperCase(data.lang.value) }}</h1>
      <blockquote>{{ options.quote }}</blockquote>

      <VPLink
        :href="data.site.value.locales[data.localeIndex.value].link"
        :aria-label="options.linkLabel"
      >
        {{ options.linkText }}
      </VPLink>
      <br />
      <VPLink
        v-if="data.localeIndex.value !== 'root'"
        :href="data.page.value.relativePath.replace(data.localeIndex.value, 'en_us')"
        :aria-label="options.englishLinkLabel"
      >
        {{ options.englishLinkText }}
      </VPLink>
      <br />
      <VPLink
        v-if="data.localeIndex.value !== 'root'"
        :href="String((data.theme.value as Fabric.ThemeConfig).editLink!.pattern)"
        :aria-label="options.crowdinLinkLabel"
      >
        {{ options.crowdinLinkText }}
      </VPLink>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  position: relative;
  overflow: hidden;
  padding: 64px 24px 96px;
  text-align: center;

  @media (width >= 768px) {
    padding: 96px 32px 168px;
  }
}

.yarn {
  pointer-events: none;

  position: absolute;
  top: 0;
  left: 0;

  overflow: visible;

  width: 100%;
  height: 100%;
}

code {
  font-size: 64px;
  font-weight: 600;
  line-height: 64px;
}

h1 {
  padding: 12px 0;

  font-size: 20px;
  font-weight: bold;
  line-height: 20px;
  letter-spacing: 2px;
}

blockquote {
  max-width: 512px;
  margin: 0 auto;
  padding-bottom: 20px;

  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.VPLink {
  display: inline-block;

  margin: 8px;
  padding: 3px 16px;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 16px;

  font-size: 14px;
  font-weight: 500;

  &,
  &.vp-external-link-icon:not(.no-icon)::after {
    color: var(--vp-c-brand-1);
    transition:
      border-color 0.25s,
      color 0.25s;
  }

  &:hover,
  &.vp-external-link-icon:not(.no-icon):hover::after {
    border-color: var(--vp-c-brand-2);
    color: var(--vp-c-brand-2);
  }
}
</style>
