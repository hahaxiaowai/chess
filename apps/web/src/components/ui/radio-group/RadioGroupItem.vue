<script setup lang="ts">
import { computed, inject } from "vue";
import { cn } from "@/lib/utils";
import { radioGroupContextKey } from "./context";

const props = withDefaults(
  defineProps<{
    value: string;
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const context = inject(radioGroupContextKey);

if (!context) {
  throw new Error("RadioGroupItem must be used inside RadioGroup.");
}

const checked = computed(() => context.modelValue.value === props.value);
const isDisabled = computed(() => context.disabled.value || props.disabled);

const itemClass = computed(() =>
  cn(
    "aspect-square size-4 rounded-full border border-primary text-primary shadow-sm",
    "focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  ),
);
</script>

<template>
  <button
    type="button"
    role="radio"
    :aria-checked="checked"
    :disabled="isDisabled"
    :class="itemClass"
    @click="context.updateValue(value)"
  >
    <span v-if="checked" class="flex items-center justify-center">
      <span class="size-2.5 rounded-full bg-primary" />
    </span>
  </button>
</template>
