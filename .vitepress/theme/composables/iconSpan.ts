import { useIcon, withBase } from "vitepress";
import { MaybeRefOrGetter, toValue } from "vue";

// TODO: I am very suspicious of this being the correct solution for when I need the span in innerHTML or in v-html... seems jank
export const useIconSpan = (icon: MaybeRefOrGetter<string>) => {
  const iconClass = useIcon(icon).value;
  const span = `<span class="${iconClass}" style="--icon: url('${withBase(`/_vpi/${toValue(icon).replace(":", "/")}.svg`)}');"></span>`;
  return span;
};

// TODO: should this repo use composables for other things?
