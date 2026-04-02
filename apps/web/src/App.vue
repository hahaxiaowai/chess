<script setup lang="ts">
import Board from "./core/chinese-chess";
import type { SeatCamp } from "@chess/game-core";
import { computed, onMounted, watch } from "vue";
import { useConfig } from "./config";

const { camp, gamer, message, messageShow, roomId } = useConfig();

onMounted(() => {
  gamer.setBoard(new Board({ id: "chess" }));
});

watch(message, (newVal) => {
  if (newVal === "") return;
  messageShow.value = true;
  setTimeout(() => {
    messageShow.value = false;
  }, 1500);
});

watch(
  () => gamer.roomSnapshot.value?.selfCamp,
  (selfCamp) => {
    if (selfCamp) {
      camp.value = selfCamp;
    }
  },
  {
    immediate: true,
  },
);

const statsKV = {
  disconnect: "未连接",
  ready: "已连接，当前为观战",
  run: "已连接，已入座",
} as const;

const snapshot = computed(() => gamer.roomSnapshot.value);

const confirm = async () => {
  await gamer.setCamp(camp.value);
};

const setView = (type: string) => {
  gamer.board?.setCameraPosition(type);
};

const seatStatusText = (seat: { playerId: string | null; connected: boolean; reservedUntil: number | null }) => {
  if (!seat.playerId) {
    return "空位";
  }

  if (seat.connected) {
    return "已连接";
  }

  return "断线保留中";
};

const selfCampText = computed(() => {
  const selfCamp = snapshot.value?.selfCamp ?? "viewer";

  switch (selfCamp) {
    case "red":
      return "红方";
    case "black":
      return "黑方";
    default:
      return "观战";
  }
});

const isCampSelectable = (targetCamp: SeatCamp) => {
  if (gamer.stats.value === "disconnect") {
    return false;
  }

  if (targetCamp === "viewer") {
    return true;
  }

  const seat = snapshot.value?.seats[targetCamp];
  const selfCamp = snapshot.value?.selfCamp ?? "viewer";

  return !seat?.playerId || selfCamp === targetCamp;
};

const canRequestRematch = computed(() => {
  const currentSnapshot = snapshot.value;

  if (!currentSnapshot || currentSnapshot.game.status !== "finished") {
    return false;
  }

  if (currentSnapshot.selfCamp === "viewer" || currentSnapshot.rematch.requester) {
    return false;
  }

  return (
    !!currentSnapshot.seats.red.playerId &&
    !!currentSnapshot.seats.black.playerId &&
    currentSnapshot.seats.red.connected &&
    currentSnapshot.seats.black.connected
  );
});

const isPendingForSelf = computed(() => {
  const currentSnapshot = snapshot.value;

  return (
    !!currentSnapshot &&
    currentSnapshot.selfCamp !== "viewer" &&
    currentSnapshot.rematch.pendingFor === currentSnapshot.selfCamp
  );
});

const requestRematch = async () => {
  await gamer.requestRematch();
};

const respondRematch = async (accept: boolean) => {
  await gamer.respondRematch(accept);
};
</script>

<template>
  <div v-if="messageShow" class="message-box">{{ message }}</div>
  <div class="config">
    <div class="stats">房间号：{{ roomId }}</div>
    <div class="stats">连接状态：{{ statsKV[gamer.stats.value] }}</div>
    <div class="stats">当前身份：{{ selfCampText }}</div>
    <div class="stats" v-if="snapshot">
      红方：{{ seatStatusText(snapshot.seats.red) }} / 黑方：{{ seatStatusText(snapshot.seats.black) }}
    </div>
    <div class="stats" v-if="snapshot">
      当前回合：
      {{
        snapshot.game.status === "finished"
          ? "对局结束"
          : snapshot.game.turn === "red"
            ? "红方"
            : "黑方"
      }}
    </div>
    <div class="gamer">
      选择身份：
      <a-radio-group v-model:value="camp">
        <a-radio-button value="red" :disabled="!isCampSelectable('red')">红方</a-radio-button>
        <a-radio-button value="black" :disabled="!isCampSelectable('black')">黑方</a-radio-button>
        <a-radio-button value="viewer" :disabled="!isCampSelectable('viewer')">观众</a-radio-button>
      </a-radio-group>
      <a-button style="margin-left: 1rem;" type="primary" @click="confirm">确定</a-button>
    </div>
    <div class="operation">
      视角调整：
      <a-button type="primary" @click="setView('down')">俯视</a-button>
      <a-button style="margin-left: 1rem;" type="primary" @click="setView('front')">正视</a-button>
    </div>
    <div class="operation" v-if="snapshot?.game.status === 'finished'">
      重开对局：
      <a-button v-if="canRequestRematch" type="primary" @click="requestRematch">申请重开</a-button>
      <template v-else-if="isPendingForSelf">
        <a-button type="primary" @click="respondRematch(true)">接受</a-button>
        <a-button style="margin-left: 1rem;" @click="respondRematch(false)">拒绝</a-button>
      </template>
      <span v-else-if="snapshot?.rematch.requester" class="rematch-hint">等待对方确认</span>
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
}

.stats,
.operation {
  padding: 0.25rem 0;
}

.rematch-hint {
  margin-left: 0.5rem;
}
</style>
