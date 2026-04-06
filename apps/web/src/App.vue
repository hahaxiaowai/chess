<script setup lang="ts">
import ChineseChessBoard from "./core/chinese-chess";
import GobangBoard from "./core/gobang";
import type { Camp, GameType, SeatCamp } from "@chess/game-core";
import { computed, onMounted, watch } from "vue";
import { useConfig } from "./config";

const { camp, gameType, gamer, hasSelectedGameType, isGobang, message, messageShow, roomId, selectGameType } =
  useConfig();

const boardGameType = computed<GameType | null>(() => gamer.value?.roomSnapshot.value?.gameType ?? gameType.value);

function createBoard(nextGameType: GameType) {
  const currentGamer = gamer.value;

  if (!currentGamer) {
    return;
  }

  if (nextGameType === "gobang") {
    currentGamer.setBoard(new GobangBoard({ id: "chess" }));
    return;
  }

  currentGamer.setBoard(new ChineseChessBoard({ id: "chess" }));
}

onMounted(() => {
  if (boardGameType.value) {
    createBoard(boardGameType.value);
  }
});

watch([boardGameType, gamer], ([value, currentGamer], [previous]) => {
  if (value && currentGamer && (value !== previous || !currentGamer.board)) {
    createBoard(value);
  }
});

watch(message, (newVal) => {
  if (newVal === "") return;
  messageShow.value = true;
  setTimeout(() => {
    messageShow.value = false;
  }, 1500);
});

watch(
  () => gamer.value?.roomSnapshot.value?.selfCamp,
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

const snapshot = computed(() => gamer.value?.roomSnapshot.value ?? null);

const connectionStatus = computed(() => gamer.value?.stats.value ?? "disconnect");

const gameTypeLabel = computed(() => {
  if (!boardGameType.value) {
    return "未选择";
  }

  return boardGameType.value === "gobang" ? "五子棋" : "中国象棋";
});

const confirm = async () => {
  if (!gamer.value) {
    return;
  }

  await gamer.value.setCamp(camp.value);
};

const setView = (type: string) => {
  gamer.value?.board?.setCameraPosition(type);
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

const campText = (targetCamp: Camp) => {
  if (boardGameType.value === "gobang") {
    return targetCamp === "red" ? "白方" : "黑方";
  }

  return targetCamp === "red" ? "红方" : "黑方";
};

const selfCampText = computed(() => {
  const selfCamp = snapshot.value?.selfCamp ?? "viewer";

  switch (selfCamp) {
    case "red":
      return campText("red");
    case "black":
      return campText("black");
    default:
      return "观战";
  }
});

const isCampSelectable = (targetCamp: SeatCamp) => {
  if (connectionStatus.value === "disconnect") {
    return false;
  }

  if (targetCamp === "viewer") {
    return true;
  }

  const seat = snapshot.value?.seats[targetCamp];
  const selfCamp = snapshot.value?.selfCamp ?? "viewer";

  return !seat?.playerId || selfCamp === targetCamp;
};

const currentTurnText = computed(() => {
  const currentSnapshot = snapshot.value;

  if (!currentSnapshot) {
    return "等待中";
  }

  if (currentSnapshot.game.status === "finished") {
    if (currentSnapshot.game.winner === "draw") {
      return "平局";
    }

    return currentSnapshot.game.winner ? `${campText(currentSnapshot.game.winner)}获胜` : "对局结束";
  }

  return campText(currentSnapshot.game.turn);
});

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
  if (!gamer.value) {
    return;
  }

  await gamer.value.requestRematch();
};

const respondRematch = async (accept: boolean) => {
  if (!gamer.value) {
    return;
  }

  await gamer.value.respondRematch(accept);
};
</script>

<template>
  <div v-if="messageShow" class="message-box">{{ message }}</div>
  <div class="config">
    <div class="stats">玩法：{{ gameTypeLabel }}</div>
    <div class="stats">房间号：{{ roomId }}</div>
    <template v-if="hasSelectedGameType">
      <div class="stats">连接状态：{{ statsKV[connectionStatus] }}</div>
      <div class="stats">当前身份：{{ selfCampText }}</div>
      <div class="stats" v-if="snapshot">
        {{ campText('red') }}：{{ seatStatusText(snapshot.seats.red) }} / {{ campText('black') }}：{{ seatStatusText(snapshot.seats.black) }}
      </div>
      <div class="stats" v-if="snapshot">当前回合：{{ currentTurnText }}</div>
      <div class="gamer">
        选择身份：
        <a-radio-group v-model:value="camp">
          <a-radio-button value="red" :disabled="!isCampSelectable('red')">{{ campText('red') }}</a-radio-button>
          <a-radio-button value="black" :disabled="!isCampSelectable('black')">{{ campText('black') }}</a-radio-button>
          <a-radio-button value="viewer" :disabled="!isCampSelectable('viewer')">观众</a-radio-button>
        </a-radio-group>
        <a-button style="margin-left: 1rem" type="primary" @click="confirm">确定</a-button>
      </div>
      <div class="operation">
        视角调整：
        <a-button type="primary" @click="setView('down')">俯视</a-button>
        <a-button style="margin-left: 1rem" type="primary" @click="setView('front')">正视</a-button>
      </div>
      <div class="operation" v-if="snapshot?.game.status === 'finished'">
        重开对局：
        <a-button v-if="canRequestRematch" type="primary" @click="requestRematch">申请重开</a-button>
        <template v-else-if="isPendingForSelf">
          <a-button type="primary" @click="respondRematch(true)">接受</a-button>
          <a-button style="margin-left: 1rem" @click="respondRematch(false)">拒绝</a-button>
        </template>
        <span v-else-if="snapshot?.rematch.requester" class="rematch-hint">等待对方确认</span>
      </div>
      <div class="stats" v-if="isGobang">提示：黑方先手，点击棋盘交叉点即可落子</div>
    </template>
    <template v-else>
      <div class="stats">进入房间前请选择玩法</div>
      <div class="game-type-picker">
        <a-radio-group :value="gameType" @update:value="selectGameType">
          <a-radio-button value="chinese-chess">中国象棋</a-radio-button>
          <a-radio-button value="gobang">五子棋</a-radio-button>
        </a-radio-group>
      </div>
      <div class="stats selection-hint">选择后会创建对应房间并进入对局</div>
    </template>
  </div>

  <div id="chess" :class="{ 'chess--inactive': !hasSelectedGameType }"></div>
</template>

<style scoped>
.message-box {
  position: absolute;
  top: 10vh;
  left: 50%;
  transform: translateX(-50%);
  min-width: 10rem;
  padding: 0.75rem 1rem;
  background-color: rgba(240, 248, 255, 0.95);
  text-align: center;
  font-size: 1rem;
  border-radius: 1rem;
  z-index: 3;
}

#chess {
  width: 100vw;
  height: 100vh;
}

.chess--inactive {
  background:
    radial-gradient(circle at top, rgba(255, 251, 240, 0.95), rgba(232, 216, 183, 0.88)),
    linear-gradient(135deg, #f4e6c4, #d2b07f);
}

.config {
  position: absolute;
  right: 0;
  top: 0;
  padding: 1rem;
  background-color: rgba(240, 248, 255, 0.92);
  z-index: 2;
}

.stats,
.operation {
  padding: 0.25rem 0;
}

.game-type-picker {
  padding: 0.5rem 0 0.25rem;
}

.selection-hint {
  color: rgba(58, 43, 26, 0.72);
}

.rematch-hint {
  margin-left: 0.5rem;
}
</style>
