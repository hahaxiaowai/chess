<script setup lang="ts">
import { computed, provide } from "vue";
import { tabsContextKey } from "./context";

defineOptions({
  name: "UiTabs",
});

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

provide(tabsContextKey, {
  modelValue: computed(() => props.modelValue),
  updateValue: (value) => emit("update:modelValue", value),
});
</script>

<template>
  <div>
    <slot />
  </div>
</template>
