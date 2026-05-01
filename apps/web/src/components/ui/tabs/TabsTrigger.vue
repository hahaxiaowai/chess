<script setup lang="ts">
import { computed, inject } from "vue";
import { cn } from "@/lib/utils";
import { tabsContextKey } from "./context";

const props = defineProps<{
  value: string;
}>();

const context = inject(tabsContextKey);

if (!context) {
  throw new Error("TabsTrigger must be used inside Tabs.");
}

const active = computed(() => context.modelValue.value === props.value);
</script>

<template>
  <button
    type="button"
    role="tab"
    :aria-selected="active"
    :class="cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
      active && 'bg-background text-foreground shadow',
    )"
    @click="context.updateValue(value)"
  >
    <slot />
  </button>
</template>
