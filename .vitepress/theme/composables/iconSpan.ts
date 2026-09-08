import { useIcon, withBase } from "vitepress";
import { MaybeRefOrGetter, toValue } from "vue";

// TODO: I am very suspicious of this being the correct solution for when I need the span in innerHTML or in v-html... seems jank
// TODO: I just found out about import.meta.env. I should check out the usages of ENV in the source code and maybe replace them with this import.meta.env where possible. Maybe we can even assign a value to import.meta.env, for example import.meta.env.DESTINATION = "local" | "github" | "netlify" | number
export const useIconSpan = (icon: MaybeRefOrGetter<string>) => {
  const iconClass = useIcon(icon).value;
  return import.meta.env.DEV
    ? `<span class="${iconClass}" style="--icon: url('${withBase(`/_vpi/${toValue(icon).replace(":", "/")}.svg`)}');"></span>`
    : `<span class="${iconClass}"></span>`;
};

// TODO: should this repo use composables for other things?
