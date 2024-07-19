<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import Board from './core/chinese-chess'
const message = ref('')
const messageShow = ref(false)
onMounted(() => {
  const board = new Board({ id: 'chess', model: 'local', message })
})
watch(message, (newVal) => {
  if (newVal === '') return
  messageShow.value = true
  setTimeout(() => {
    messageShow.value = false
  }, 1500)
})
</script>

<template>
  <div v-if="messageShow" class="message-box">{{ message }}</div>
  <div id="chess"></div>
</template>

<style scoped>
.message-box {
  position: absolute;
  top: 10vh;
  left: 45vw;
  width: 10vw;
  height: 5vh;
  background-color: aliceblue;
  text-align: center;
  line-height: 5vh;
  font-size: 2rem;
  border-radius: 1rem;
}
#chess {
  width: 100vw;
  height: 100vh;
}
</style>
