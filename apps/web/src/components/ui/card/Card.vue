<script setup lang="ts">
defineOptions({
  name: "UiCard",
});
</script>

<template>
  <div class="rounded-xl border bg-card text-card-foreground shadow">
    <slot />
  </div>
</template>
