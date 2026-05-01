<script setup lang="ts">
defineProps<{
  message: string;
}>();
</script>

<template>
  <div
    class="fixed left-1/2 top-[calc(env(safe-area-inset-top)+1rem)] z-50 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-md border bg-card px-4 py-3 text-center text-sm text-card-foreground shadow-lg"
    aria-live="polite"
  >
    {{ message }}
  </div>
</template>
