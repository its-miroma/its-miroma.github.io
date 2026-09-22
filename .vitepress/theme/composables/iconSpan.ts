import { useIcon, withBase } from "vitepress";
import { MaybeRefOrGetter, toValue } from "vue";

// TODO: I am very suspicious of this being the correct solution for when I need the span in innerHTML or in v-html... seems jank
export const useIconSpan = (icon: MaybeRefOrGetter<string>) => {
  const iconClass = useIcon(icon as never).value;
  return import.meta.env.DEV
    ? `<span class="${iconClass}" style="--icon: url('${withBase(`/_vpi/${toValue(icon).replace(":", "/")}.svg`)}');"></span>`
    : `<span class="${iconClass}"></span>`;
};
