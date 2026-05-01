<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";

defineOptions({
  name: "UiButton",
});

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    size?: ButtonSize;
    type?: "button" | "submit" | "reset";
  }>(),
  {
    variant: "default",
    size: "default",
    type: "button",
  },
);

const variants: Record<ButtonVariant, string> = {
  default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
  destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90",
  outline: "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
};

const sizes: Record<ButtonSize, string> = {
  default: "h-9 px-4 py-2",
  sm: "h-8 rounded-md px-3 text-xs",
  lg: "h-10 rounded-md px-6",
  icon: "size-9",
};

const buttonClass = computed(() =>
  cn(
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
    variants[props.variant],
    sizes[props.size],
  ),
);
</script>

<template>
  <button :type="type" :class="buttonClass">
    <slot />
  </button>
</template>
