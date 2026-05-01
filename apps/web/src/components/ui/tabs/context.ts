import type { InjectionKey, Ref } from "vue";

export interface TabsContext {
  modelValue: Ref<string>;
  updateValue: (value: string) => void;
}

export const tabsContextKey = Symbol("TabsContext") as InjectionKey<TabsContext>;
