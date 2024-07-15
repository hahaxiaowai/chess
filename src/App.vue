<script setup lang="ts">
import { onMounted } from 'vue'
import Board from './core/chinese-chess'
onMounted(() => {
  const board = new Board({ id: 'chess' })
})
</script>

<template>
  <div id="chess"></div>
</template>

<style scoped>
#chess {
  width: 100vw;
  height: 100vh;
}
</style>
