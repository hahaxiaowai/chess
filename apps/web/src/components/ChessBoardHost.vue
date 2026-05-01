<script setup lang="ts">
defineProps<{
  inactive: boolean;
  mobileLayout: boolean;
  boardStyles?: Record<string, string>;
}>();
</script>

<template>
  <div
    id="chess"
    :class="[
      'h-dvh w-screen bg-background',
      inactive && 'bg-[radial-gradient(circle_at_top,oklch(0.985_0_0),oklch(0.922_0_0))]',
      mobileLayout && 'h-[max(16rem,calc(100dvh-var(--mobile-overlay-height,0px)-env(safe-area-inset-bottom)-28px))]',
    ]"
    :style="boardStyles"
  />
</template>
