<script setup lang="ts">
import { computed, inject } from "vue";
import { tabsContextKey } from "./context";

const props = defineProps<{
  value: string;
}>();

const context = inject(tabsContextKey);

if (!context) {
  throw new Error("TabsContent must be used inside Tabs.");
}

const active = computed(() => context.modelValue.value === props.value);
</script>

<template>
  <div v-if="active" role="tabpanel" class="mt-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
    <slot />
  </div>
</template>
