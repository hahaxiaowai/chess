import type { InjectionKey, Ref } from "vue";

export interface RadioGroupContext {
  modelValue: Ref<string | null>;
  disabled: Ref<boolean>;
  updateValue: (value: string) => void;
}

export const radioGroupContextKey = Symbol("RadioGroupContext") as InjectionKey<RadioGroupContext>;
