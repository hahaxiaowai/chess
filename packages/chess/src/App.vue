<script setup lang="ts">
import Board from './core/chinese-chess';
import { onMounted, Ref, ref, watch } from 'vue'
import { useConfig } from "./config";


const { camp, gamer, message, messageShow } = useConfig();
onMounted(() => {
  // const gamer = new Gamer(roomId)
  gamer.setBoard(new Board({ id: 'chess', model: 'online', message }))
})
watch(message, (newVal) => {
  if (newVal === '') return
  messageShow.value = true
  setTimeout(() => {
    messageShow.value = false
  }, 1500)
})
const statsKV = {
  disconnect: '未连接',
  ready: '已连接，未选择身份',
  run: '正在游戏',
}
const disable = ref(false)
const confirm = async () => {
  const flag = await gamer.setCamp(camp.value)
  disable.value = flag
}
const setView = (type: string) => {
  gamer.board?.setCameraPosition(type)
}
</script>

<template>
  <div v-if="messageShow" class="message-box">{{ message }}</div>
  <div class="config">
    <div class="stats">
      连接状态：{{ statsKV[gamer.stats.value] }}
    </div>
    <div class="gamer">
      选择身份：
      <a-radio-group :disabled="disable" v-model:value="camp">
        <a-radio-button value="red">红方</a-radio-button>
        <a-radio-button value="black">黑方</a-radio-button>
        <a-radio-button value="viewer">观众</a-radio-button>
      </a-radio-group>
      <a-button :disabled="disable" style="margin-left: 1rem;" type="primary" @click="confirm">确定</a-button>
    </div>
    <div class="operation">
      视角调整：
      <a-button type="primary" @click="setView('down')">俯视</a-button>
      <a-button style="margin-left: 1rem;" type="primary" @click="setView('front')">正视</a-button>
    </div>

  </div>

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

  .config {
    position: absolute;
    right: 0;
    top: 0;
    padding: 1rem;
    background-color: aliceblue;

    .stats {
      padding: 0.25rem 0rem;
    }

    .gamer {}

    .operation {
      padding: 0.25rem 0rem;
    }
  }
</style>
