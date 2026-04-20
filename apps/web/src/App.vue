<script setup lang="ts">
import ChineseChessBoard from "./core/chinese-chess";
import GobangBoard from "./core/gobang";
import type { Camp, GameType, SeatCamp } from "@chess/game-core";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useConfig } from "./config";

type MobileMenuMode = "compact" | "expanded";
type MobileMenuSection = "match" | "seat" | "view";
type TurnTone = "waiting" | "self" | "opponent" | "finished";

const {
  camp,
  gameType,
  gamer,
  hasSelectedGameType,
  isGobang,
  message,
  messageShow,
  roomId,
  shareUrl,
  canShareRoom,
  selectGameType,
} = useConfig();

const boardGameType = computed<GameType | null>(() => gamer.value?.roomSnapshot.value?.gameType ?? gameType.value);
const isMobileLayout = ref(typeof window !== "undefined" ? window.innerWidth <= 768 : false);
const mobileMenuMode = ref<MobileMenuMode>("compact");
const activeMenuSection = ref<MobileMenuSection>("match");
const mobileOverlayRef = ref<HTMLElement | null>(null);
const mobileOverlayHeight = ref(0);
const isTurnIndicatorHighlighted = ref(false);

let messageTimer: ReturnType<typeof window.setTimeout> | null = null;
let turnIndicatorTimer: ReturnType<typeof window.setTimeout> | null = null;
let mobileOverlayResizeObserver: ResizeObserver | null = null;

const statsKV = {
  disconnect: "未连接",
  ready: "已连接，当前为观战",
  run: "已连接，已入座",
} as const;

const updateViewportMode = () => {
  isMobileLayout.value = window.innerWidth <= 768;
};

const isMobileBoardMode = computed(() => hasSelectedGameType.value && isMobileLayout.value);
const isMobileMenuExpanded = computed(
  () => isMobileBoardMode.value && mobileMenuMode.value === "expanded",
);

const updateMobileOverlayHeight = () => {
  if (!isMobileBoardMode.value) {
    mobileOverlayHeight.value = 0;
    return;
  }

  mobileOverlayHeight.value = mobileOverlayRef.value?.offsetHeight ?? 0;
};

const observeMobileOverlay = () => {
  mobileOverlayResizeObserver?.disconnect();
  mobileOverlayResizeObserver = null;

  if (typeof ResizeObserver === "undefined" || !mobileOverlayRef.value) {
    return;
  }

  mobileOverlayResizeObserver = new ResizeObserver(() => {
    updateMobileOverlayHeight();
  });
  mobileOverlayResizeObserver.observe(mobileOverlayRef.value);
};

const syncMobileOverlay = () => {
  void nextTick(() => {
    observeMobileOverlay();
    updateMobileOverlayHeight();
  });
};

const boardStyles = computed(() =>
  isMobileBoardMode.value
    ? { "--mobile-overlay-height": `${mobileOverlayHeight.value}px` }
    : undefined,
);

const shareButtonText = computed(() => "复制链接");
const snapshot = computed(() => gamer.value?.roomSnapshot.value ?? null);
const connectionStatus = computed(() => gamer.value?.stats.value ?? "disconnect");

const gameTypeLabel = computed(() => {
  if (!boardGameType.value) {
    return "未选择";
  }

  return boardGameType.value === "gobang" ? "五子棋" : "中国象棋";
});

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

const seatStatusText = (seat: { playerId: string | null; connected: boolean; reservedUntil: number | null }) => {
  if (!seat.playerId) {
    return "空位";
  }

  if (seat.connected) {
    return "已连接";
  }

  return "断线保留中";
};

const seatSummaryText = computed(() => {
  const currentSnapshot = snapshot.value;

  if (!currentSnapshot) {
    return "等待房间同步";
  }

  return `${campText("red")}：${seatStatusText(currentSnapshot.seats.red)} / ${campText("black")}：${seatStatusText(currentSnapshot.seats.black)}`;
});

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

  if (currentSnapshot.game.status === "waiting") {
    return "等待开局";
  }

  return currentSnapshot.selfCamp !== "viewer" && currentSnapshot.game.turn === currentSnapshot.selfCamp
    ? "轮到你了"
    : `${campText(currentSnapshot.game.turn)}回合`;
});

const matchPhaseText = computed(() => {
  const currentSnapshot = snapshot.value;

  if (!currentSnapshot) {
    return "等待连接";
  }

  switch (currentSnapshot.game.status) {
    case "playing":
      return "进行中";
    case "finished":
      return "已结束";
    default:
      return "等待双方入座";
  }
});

const turnIndicator = computed<{
  label: string;
  title: string;
  detail: string;
  tone: TurnTone;
}>(() => {
  const currentSnapshot = snapshot.value;

  if (!currentSnapshot) {
    return {
      label: "对局状态",
      title: "等待连接",
      detail: "进入房间后开始同步对局",
      tone: "waiting",
    };
  }

  if (currentSnapshot.game.status === "finished") {
    if (currentSnapshot.game.winner === "draw") {
      return {
        label: "对局状态",
        title: "本局平局",
        detail: "可以发起下一局",
        tone: "finished",
      };
    }

    if (currentSnapshot.game.winner) {
      const isSelfWinner =
        currentSnapshot.selfCamp !== "viewer" && currentSnapshot.selfCamp === currentSnapshot.game.winner;

      return {
        label: "对局状态",
        title: `${campText(currentSnapshot.game.winner)}获胜`,
        detail: isSelfWinner ? "这一局你赢下来了" : "本局已经结束",
        tone: "finished",
      };
    }

    return {
      label: "对局状态",
      title: "对局结束",
      detail: "可以查看结果或开始下一局",
      tone: "finished",
    };
  }

  if (currentSnapshot.game.status === "waiting") {
    return {
      label: "对局状态",
      title: "等待开局",
      detail: "双方入座并连线后开始",
      tone: "waiting",
    };
  }

  if (currentSnapshot.selfCamp !== "viewer" && currentSnapshot.game.turn === currentSnapshot.selfCamp) {
    return {
      label: "对局状态",
      title: "轮到你了",
      detail: isGobang.value ? "点击棋盘交叉点落子" : "请选择棋子并完成走子",
      tone: "self",
    };
  }

  return {
    label: "对局状态",
    title: `${campText(currentSnapshot.game.turn)}回合`,
    detail: currentSnapshot.selfCamp === "viewer" ? "你正在观战本局对弈" : `你当前为${selfCampText.value}`,
    tone: "opponent",
  };
});

const turnBannerClasses = computed(() => [
  `turn-banner--${turnIndicator.value.tone}`,
  { "turn-banner--pulse": isTurnIndicatorHighlighted.value },
]);

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

const rematchStatusText = computed(() => {
  const currentSnapshot = snapshot.value;

  if (!currentSnapshot || currentSnapshot.game.status !== "finished") {
    return "";
  }

  if (isPendingForSelf.value) {
    return "等待你确认";
  }

  if (currentSnapshot.rematch.requester) {
    return "等待对方确认";
  }

  return "本局已结束";
});

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

const confirm = async () => {
  if (!gamer.value) {
    return;
  }

  await gamer.value.setCamp(camp.value);
};

const setView = (type: string) => {
  gamer.value?.board?.setCameraPosition(type);
};

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

const showTransientMessage = (text: string) => {
  if (messageTimer !== null) {
    window.clearTimeout(messageTimer);
    messageTimer = null;
  }

  messageShow.value = false;
  message.value = "";
  window.setTimeout(() => {
    message.value = text;
  }, 0);
};

const setMobileMenuMode = (nextMode: MobileMenuMode) => {
  if (!isMobileBoardMode.value) {
    return;
  }

  mobileMenuMode.value = nextMode;
};

const toggleMobileMenu = () => {
  setMobileMenuMode(isMobileMenuExpanded.value ? "compact" : "expanded");
};

const selectMenuSection = (section: MobileMenuSection) => {
  activeMenuSection.value = section;
  setMobileMenuMode("expanded");
};

const copyRoomLink = async (text: string) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the DOM copy fallback when clipboard access is unavailable.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  textarea.style.inset = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
};

const shareRoom = async () => {
  if (!canShareRoom.value || !shareUrl.value) {
    return;
  }

  const copied = await copyRoomLink(shareUrl.value);
  showTransientMessage(copied ? "房间链接已复制" : "复制失败，请手动复制链接");
};

const triggerTurnIndicatorHighlight = () => {
  if (turnIndicatorTimer !== null) {
    window.clearTimeout(turnIndicatorTimer);
    turnIndicatorTimer = null;
  }

  isTurnIndicatorHighlighted.value = false;
  window.requestAnimationFrame(() => {
    isTurnIndicatorHighlighted.value = true;
    turnIndicatorTimer = window.setTimeout(() => {
      isTurnIndicatorHighlighted.value = false;
      turnIndicatorTimer = null;
    }, 1400);
  });
};

onMounted(() => {
  updateViewportMode();
  window.addEventListener("resize", updateViewportMode);
  syncMobileOverlay();

  if (boardGameType.value) {
    createBoard(boardGameType.value);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateViewportMode);
  mobileOverlayResizeObserver?.disconnect();

  if (messageTimer !== null) {
    window.clearTimeout(messageTimer);
  }

  if (turnIndicatorTimer !== null) {
    window.clearTimeout(turnIndicatorTimer);
  }
});

watch([boardGameType, gamer], ([value, currentGamer], [previous]) => {
  if (value && currentGamer && (value !== previous || !currentGamer.board)) {
    createBoard(value);
  }
});

watch(message, (newVal) => {
  if (newVal === "") {
    return;
  }

  if (messageTimer !== null) {
    window.clearTimeout(messageTimer);
  }

  messageShow.value = true;
  messageTimer = window.setTimeout(() => {
    messageShow.value = false;
    message.value = "";
    messageTimer = null;
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

watch(
  () => [hasSelectedGameType.value, isMobileLayout.value],
  () => {
    if (!isMobileBoardMode.value) {
      mobileMenuMode.value = "compact";
    }

    syncMobileOverlay();
  },
  {
    immediate: true,
  },
);

watch(
  () => [
    mobileMenuMode.value,
    activeMenuSection.value,
    snapshot.value?.game.status,
    snapshot.value?.game.turn,
    snapshot.value?.rematch.requester,
    snapshot.value?.rematch.pendingFor,
    connectionStatus.value,
    isGobang.value,
  ],
  () => {
    syncMobileOverlay();
  },
);

watch(
  () => snapshot.value?.game.status,
  (status, previousStatus) => {
    if (status === "finished" && previousStatus !== "finished") {
      activeMenuSection.value = "match";
    }
  },
);

watch(
  () => [
    snapshot.value?.game.turn,
    snapshot.value?.game.status,
    snapshot.value?.game.winner,
    snapshot.value?.selfCamp,
  ],
  () => {
    if (snapshot.value) {
      triggerTurnIndicatorHighlight();
    }
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <div v-if="messageShow" class="message-box">{{ message }}</div>

  <div
    id="chess"
    :class="{ 'chess--inactive': !hasSelectedGameType, 'chess--mobile-layout': isMobileBoardMode }"
    :style="boardStyles"
  ></div>

  <template v-if="hasSelectedGameType">
    <div v-if="!isMobileBoardMode" class="config config--desktop">
      <div class="panel-header">
        <div class="panel-intro">
          <span class="panel-kicker">{{ gameTypeLabel }}</span>
          <strong class="panel-room">房间 {{ roomId }}</strong>
        </div>
        <div class="header-actions">
          <a-button v-if="canShareRoom" class="action-button" type="primary" @click="shareRoom">
            {{ shareButtonText }}
          </a-button>
        </div>
      </div>

      <div class="turn-banner" :class="turnBannerClasses">
        <span class="turn-banner__label">{{ turnIndicator.label }}</span>
        <strong class="turn-banner__title">{{ turnIndicator.title }}</strong>
        <span class="turn-banner__detail">{{ turnIndicator.detail }}</span>
      </div>

      <div class="panel-section info-grid">
        <div class="info-item">
          <span class="info-label">连接状态</span>
          <span class="info-value">{{ statsKV[connectionStatus] }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">当前身份</span>
          <span class="info-value">{{ selfCampText }}</span>
        </div>
        <div class="info-item info-item--wide">
          <span class="info-label">座位状态</span>
          <span class="info-value">{{ seatSummaryText }}</span>
        </div>
        <div class="info-item info-item--wide">
          <span class="info-label">当前回合</span>
          <span class="info-value">{{ currentTurnText }}</span>
          <span class="info-detail">{{ matchPhaseText }}</span>
        </div>
      </div>

      <div class="panel-section control-section">
        <div class="section-title">对局</div>
        <div class="button-group" v-if="snapshot?.game.status === 'finished' && canRequestRematch">
          <a-button class="action-button" type="primary" @click="requestRematch">申请重开</a-button>
        </div>
        <div class="button-group" v-else-if="snapshot?.game.status === 'finished' && isPendingForSelf">
          <a-button class="action-button" type="primary" @click="respondRematch(true)">接受</a-button>
          <a-button class="action-button" @click="respondRematch(false)">拒绝</a-button>
        </div>
        <span v-else-if="snapshot?.game.status === 'finished'" class="status-hint">{{ rematchStatusText }}</span>
        <div class="panel-note" v-if="isGobang">提示：黑方先手，点击棋盘交叉点即可落子</div>
      </div>

      <div class="panel-section control-section">
        <div class="section-title">身份</div>
        <div class="control-row control-row--stack">
          <a-radio-group v-model:value="camp" class="seat-radio-group">
            <a-radio-button value="red" :disabled="!isCampSelectable('red')">{{ campText("red") }}</a-radio-button>
            <a-radio-button value="black" :disabled="!isCampSelectable('black')">{{ campText("black") }}</a-radio-button>
            <a-radio-button value="viewer" :disabled="!isCampSelectable('viewer')">观众</a-radio-button>
          </a-radio-group>
          <a-button class="action-button action-button--confirm" type="primary" @click="confirm">确定</a-button>
        </div>
      </div>

      <div class="panel-section control-section">
        <div class="section-title">视角</div>
        <div class="button-group">
          <a-button class="action-button" type="primary" @click="setView('down')">俯视</a-button>
          <a-button class="action-button" type="primary" @click="setView('front')">正视</a-button>
        </div>
      </div>
    </div>

    <div v-else ref="mobileOverlayRef" class="mobile-overlay" :class="{ 'mobile-overlay--expanded': isMobileMenuExpanded }">
      <div class="mobile-summary">
        <div class="summary-header">
          <div class="summary-heading">
            <span class="summary-kicker">{{ gameTypeLabel }}</span>
            <strong class="summary-room">房间 {{ roomId }}</strong>
          </div>
          <div class="summary-identity">
            <span class="summary-identity__label">身份</span>
            <span class="summary-identity__value">{{ selfCampText }}</span>
          </div>
        </div>

        <div class="turn-banner turn-banner--compact" :class="turnBannerClasses">
          <span class="turn-banner__label">{{ turnIndicator.label }}</span>
          <strong class="turn-banner__title">{{ turnIndicator.title }}</strong>
          <span class="turn-banner__detail">{{ turnIndicator.detail }}</span>
        </div>

        <div class="summary-actions">
          <template v-if="snapshot?.game.status === 'finished'">
            <a-button v-if="canRequestRematch" class="action-button action-button--summary" type="primary" @click="requestRematch">
              申请重开
            </a-button>
            <template v-else-if="isPendingForSelf">
              <a-button class="action-button action-button--summary" type="primary" @click="respondRematch(true)">
                接受
              </a-button>
              <a-button class="action-button action-button--summary" @click="respondRematch(false)">拒绝</a-button>
            </template>
            <span v-else class="summary-status">{{ rematchStatusText }}</span>
          </template>
          <template v-else>
            <a-button v-if="canShareRoom" class="action-button action-button--summary" @click="shareRoom">
              {{ shareButtonText }}
            </a-button>
          </template>

          <a-button class="action-button action-button--summary" type="primary" @click="toggleMobileMenu">
            {{ isMobileMenuExpanded ? "收起菜单" : "展开菜单" }}
          </a-button>
        </div>
      </div>

      <div v-if="isMobileMenuExpanded" class="mobile-panel">
        <div class="mobile-section-tabs">
          <button
            type="button"
            class="section-tab"
            :class="{ 'section-tab--active': activeMenuSection === 'match' }"
            @click="selectMenuSection('match')"
          >
            对局
          </button>
          <button
            type="button"
            class="section-tab"
            :class="{ 'section-tab--active': activeMenuSection === 'seat' }"
            @click="selectMenuSection('seat')"
          >
            身份
          </button>
          <button
            type="button"
            class="section-tab"
            :class="{ 'section-tab--active': activeMenuSection === 'view' }"
            @click="selectMenuSection('view')"
          >
            视角
          </button>
        </div>

        <div class="mobile-panel__content">
          <div v-if="activeMenuSection === 'match'" class="panel-section">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">连接状态</span>
                <span class="info-value">{{ statsKV[connectionStatus] }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">当前身份</span>
                <span class="info-value">{{ selfCampText }}</span>
              </div>
              <div class="info-item info-item--wide">
                <span class="info-label">座位状态</span>
                <span class="info-value">{{ seatSummaryText }}</span>
              </div>
              <div class="info-item info-item--wide">
                <span class="info-label">当前回合</span>
                <span class="info-value">{{ currentTurnText }}</span>
                <span class="info-detail">{{ matchPhaseText }}</span>
              </div>
            </div>

            <div class="button-group" v-if="snapshot?.game.status === 'finished' && canRequestRematch">
              <a-button class="action-button action-button--full" type="primary" @click="requestRematch">
                申请重开
              </a-button>
            </div>
            <div class="button-group" v-else-if="snapshot?.game.status === 'finished' && isPendingForSelf">
              <a-button class="action-button action-button--full" type="primary" @click="respondRematch(true)">
                接受
              </a-button>
              <a-button class="action-button action-button--full" @click="respondRematch(false)">拒绝</a-button>
            </div>
            <span v-else-if="snapshot?.game.status === 'finished'" class="status-hint">{{ rematchStatusText }}</span>

            <a-button v-if="canShareRoom" class="action-button action-button--full" @click="shareRoom">
              复制房间链接
            </a-button>

            <div class="panel-note" v-if="isGobang">提示：黑方先手，点击棋盘交叉点即可落子</div>
          </div>

          <div v-if="activeMenuSection === 'seat'" class="panel-section control-section">
            <div class="section-title">选择身份</div>
            <div class="control-row control-row--stack">
              <a-radio-group v-model:value="camp" class="seat-radio-group">
                <a-radio-button value="red" :disabled="!isCampSelectable('red')">{{ campText("red") }}</a-radio-button>
                <a-radio-button value="black" :disabled="!isCampSelectable('black')">{{ campText("black") }}</a-radio-button>
                <a-radio-button value="viewer" :disabled="!isCampSelectable('viewer')">观众</a-radio-button>
              </a-radio-group>
              <a-button class="action-button action-button--confirm action-button--full" type="primary" @click="confirm">
                确定
              </a-button>
            </div>
          </div>

          <div v-if="activeMenuSection === 'view'" class="panel-section control-section">
            <div class="section-title">视角调整</div>
            <div class="button-group">
              <a-button class="action-button action-button--full" type="primary" @click="setView('down')">俯视</a-button>
              <a-button class="action-button action-button--full" type="primary" @click="setView('front')">正视</a-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>

  <div v-else class="config config--selection">
    <div class="selection-title">进入房间前请选择玩法</div>
    <div class="selection-room">房间号：{{ roomId }}</div>
    <div class="game-type-picker">
      <a-radio-group :value="gameType" class="game-type-group" @update:value="selectGameType">
        <a-radio-button value="chinese-chess">中国象棋</a-radio-button>
        <a-radio-button value="gobang">五子棋</a-radio-button>
      </a-radio-group>
    </div>
    <div class="selection-hint">选择后会创建对应房间并进入对局</div>
  </div>
</template>

<style scoped>
.message-box {
  position: fixed;
  top: calc(env(safe-area-inset-top) + 1rem);
  left: 50%;
  transform: translateX(-50%);
  min-width: 10rem;
  max-width: calc(100vw - 2rem);
  padding: 0.75rem 1rem;
  background-color: rgba(255, 251, 243, 0.96);
  color: #4f3b21;
  text-align: center;
  font-size: 0.98rem;
  border-radius: 1rem;
  box-shadow: 0 0.75rem 2rem rgba(80, 57, 26, 0.18);
  z-index: 5;
}

#chess {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
}

.chess--inactive {
  background:
    radial-gradient(circle at top, rgba(255, 251, 240, 0.95), rgba(232, 216, 183, 0.88)),
    linear-gradient(135deg, #f4e6c4, #d2b07f);
}

.chess--mobile-layout {
  height: max(16rem, calc(100dvh - var(--mobile-overlay-height, 0px) - env(safe-area-inset-bottom) - 28px));
}

.config {
  position: absolute;
  width: min(25rem, calc(100vw - 2rem));
  padding: 1rem;
  background: linear-gradient(180deg, rgba(255, 250, 241, 0.96), rgba(246, 236, 216, 0.94));
  border: 1px solid rgba(120, 84, 38, 0.12);
  border-radius: 1.4rem;
  box-shadow: 0 1rem 2.5rem rgba(80, 57, 26, 0.18);
  backdrop-filter: blur(16px);
  z-index: 3;
}

.config--desktop {
  top: 1rem;
  right: 1rem;
  max-height: calc(100dvh - 2rem);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.config--selection {
  top: 50%;
  left: 50%;
  right: auto;
  transform: translate(-50%, -50%);
  text-align: center;
  width: min(22rem, calc(100vw - 2rem));
}

.panel-header,
.summary-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.9rem;
}

.panel-intro,
.summary-heading {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.panel-kicker,
.summary-kicker,
.turn-banner__label,
.info-label,
.section-title,
.selection-room,
.selection-hint,
.summary-identity__label {
  color: rgba(88, 64, 33, 0.72);
}

.panel-kicker,
.summary-kicker,
.turn-banner__label,
.info-label,
.summary-identity__label {
  font-size: 0.8rem;
}

.panel-room,
.summary-room,
.turn-banner__title,
.info-value,
.summary-identity__value,
.selection-title {
  color: #342312;
}

.panel-room,
.summary-room {
  font-size: 1.05rem;
}

.panel-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.panel-section + .panel-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(120, 84, 38, 0.12);
}

.turn-banner {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
  margin-top: 1rem;
  padding: 0.9rem 1rem;
  border-radius: 1.15rem;
  color: #fff9f1;
  overflow: hidden;
  box-shadow: 0 0.75rem 1.8rem rgba(80, 57, 26, 0.16);
}

.turn-banner::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.22), transparent 55%);
  pointer-events: none;
}

.turn-banner__title {
  position: relative;
  z-index: 1;
  color: #fffdf9;
  font-size: 1.2rem;
  line-height: 1.2;
}

.turn-banner__detail {
  position: relative;
  z-index: 1;
  font-size: 0.88rem;
  color: rgba(255, 249, 241, 0.86);
  line-height: 1.45;
}

.turn-banner--compact {
  margin-top: 0.85rem;
}

.turn-banner--waiting {
  background: linear-gradient(135deg, #5d7280, #8ea3ae);
}

.turn-banner--self {
  background: linear-gradient(135deg, #982d1a, #d07034);
}

.turn-banner--opponent {
  background: linear-gradient(135deg, #534129, #8a6a3f);
}

.turn-banner--finished {
  background: linear-gradient(135deg, #315f52, #77a287);
}

.turn-banner--pulse {
  animation: turnPulse 1.2s ease;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.info-item {
  min-width: 0;
  padding: 0.8rem 0.85rem;
  background: rgba(255, 255, 255, 0.56);
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item--wide {
  grid-column: 1 / -1;
}

.info-value {
  font-weight: 600;
}

.info-detail {
  font-size: 0.82rem;
  color: rgba(88, 64, 33, 0.68);
  line-height: 1.45;
}

.control-section {
  gap: 0.8rem;
}

.section-title {
  font-size: 0.92rem;
  font-weight: 600;
}

.control-row,
.button-group,
.summary-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.control-row--stack {
  align-items: stretch;
}

.action-button {
  min-width: 6.5rem;
  min-height: 2.8rem;
  border-radius: 0.9rem;
}

.action-button--summary {
  flex: 1 1 9rem;
}

.action-button--full {
  width: 100%;
}

.panel-note,
.status-hint,
.summary-status,
.selection-hint {
  color: rgba(70, 49, 24, 0.8);
  line-height: 1.5;
}

.status-hint,
.summary-status {
  display: inline-flex;
  min-height: 2.8rem;
  align-items: center;
}

.mobile-overlay {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: calc(env(safe-area-inset-bottom) + 12px);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  z-index: 4;
}

.mobile-summary,
.mobile-panel {
  background: linear-gradient(180deg, rgba(255, 249, 240, 0.97), rgba(245, 233, 209, 0.95));
  border: 1px solid rgba(120, 84, 38, 0.12);
  border-radius: 1.4rem;
  box-shadow: 0 1rem 2.5rem rgba(80, 57, 26, 0.18);
  backdrop-filter: blur(18px);
}

.mobile-summary {
  padding: 0.9rem;
}

.summary-identity {
  min-width: 5.8rem;
  padding: 0.7rem 0.8rem;
  background: rgba(255, 255, 255, 0.58);
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
}

.summary-identity__value {
  font-weight: 600;
}

.mobile-panel {
  padding: 0.85rem;
  max-height: min(26rem, 46dvh);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.mobile-panel__content {
  padding-top: 0.85rem;
}

.mobile-section-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
}

.section-tab {
  min-height: 2.8rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid rgba(120, 84, 38, 0.14);
  border-radius: 0.95rem;
  background: rgba(255, 255, 255, 0.52);
  color: #5a4324;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.section-tab--active {
  background: linear-gradient(135deg, rgba(145, 96, 34, 0.16), rgba(204, 125, 48, 0.24));
  border-color: rgba(145, 96, 34, 0.22);
  color: #3f2a15;
}

.game-type-picker {
  padding: 0.8rem 0 0.45rem;
}

.selection-title {
  font-size: 1.12rem;
  font-weight: 700;
}

.selection-room {
  margin-top: 0.75rem;
}

:deep(.seat-radio-group),
:deep(.game-type-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

:deep(.seat-radio-group .ant-radio-button-wrapper),
:deep(.game-type-group .ant-radio-button-wrapper) {
  flex: 1 1 calc(33.333% - 0.5rem);
  min-width: 5.5rem;
  height: auto;
  padding: 0.65rem 0.85rem;
  line-height: 1.4;
  text-align: center;
  border-radius: 0.9rem;
  border-inline-start-width: 1px;
}

:deep(.seat-radio-group .ant-radio-button-wrapper:not(:first-child)::before),
:deep(.game-type-group .ant-radio-button-wrapper:not(:first-child)::before) {
  display: none;
}

@keyframes turnPulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(255, 255, 255, 0);
  }

  35% {
    transform: scale(1.015);
    box-shadow: 0 0 0.9rem rgba(255, 255, 255, 0.24);
  }

  100% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(255, 255, 255, 0);
  }
}

@media (max-width: 768px) {
  .message-box {
    max-width: calc(100vw - 1.5rem);
  }

  .panel-header,
  .summary-header {
    flex-direction: column;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .action-button,
  .action-button--summary,
  :deep(.seat-radio-group .ant-radio-button-wrapper),
  :deep(.game-type-group .ant-radio-button-wrapper) {
    width: 100%;
  }

  .mobile-section-tabs {
    grid-template-columns: 1fr;
  }

  .mobile-panel {
    max-height: min(28rem, 52dvh);
  }
}
</style>
