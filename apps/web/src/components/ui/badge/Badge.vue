<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";

defineOptions({
  name: "UiBadge",
});

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const props = withDefaults(
  defineProps<{
    variant?: BadgeVariant;
  }>(),
  {
    variant: "default",
  },
);

const variants: Record<BadgeVariant, string> = {
  default: "border-transparent bg-primary text-primary-foreground",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  destructive: "border-transparent bg-destructive text-white",
  outline: "text-foreground",
};

const badgeClass = computed(() =>
  cn(
    "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors",
    variants[props.variant],
  ),
);
</script>

<template>
  <div :class="badgeClass">
    <slot />
  </div>
</template>
