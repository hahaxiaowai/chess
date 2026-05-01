<script setup lang="ts">
import { computed, provide, toRef } from "vue";
import { cn } from "@/lib/utils";
import { radioGroupContextKey } from "./context";

const props = withDefaults(
  defineProps<{
    modelValue: string | null;
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const currentValue = computed(() => props.modelValue);

provide(radioGroupContextKey, {
  modelValue: currentValue,
  disabled: toRef(props, "disabled"),
  updateValue: (value) => emit("update:modelValue", value),
});
</script>

<template>
  <div :class="cn('grid gap-2')" role="radiogroup">
    <slot />
  </div>
</template>
