import type { Camp, GameType, SeatCamp } from "@chess/game-core";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import ChineseChessBoard from "@/core/chinese-chess";
import { chineseChessThemes } from "@/core/chinese-chess/theme";
import GobangBoard from "@/core/gobang";
import { useConfig } from "@/config";

export type MobileMenuMode = "compact" | "expanded";
export type MobileMenuSection = "match" | "seat" | "view";
export type TurnTone = "waiting" | "self" | "opponent" | "finished" | "check";

export const statsKV = {
  disconnect: "未连接",
  ready: "已连接，当前为观战",
  run: "已连接，已入座",
} as const;

export function useChessGameViewModel() {
  const config = useConfig();
  const boardGameType = computed<GameType | null>(
    () => config.gamer.value?.roomSnapshot.value?.gameType ?? config.gameType.value,
  );
  const isMobileLayout = ref(typeof window !== "undefined" ? window.innerWidth <= 768 : false);
  const mobileMenuMode = ref<MobileMenuMode>("compact");
  const activeMenuSection = ref<MobileMenuSection>("match");
  const mobileOverlayHeight = ref(0);
  const isTurnIndicatorHighlighted = ref(false);

  let messageTimer: ReturnType<typeof window.setTimeout> | null = null;
  let turnIndicatorTimer: ReturnType<typeof window.setTimeout> | null = null;

  const updateViewportMode = () => {
    isMobileLayout.value = window.innerWidth <= 768;
  };

  const isMobileBoardMode = computed(() => config.hasSelectedGameType.value && isMobileLayout.value);
  const isMobileMenuExpanded = computed(
    () => isMobileBoardMode.value && mobileMenuMode.value === "expanded",
  );
  const boardStyles = computed(() =>
    isMobileBoardMode.value
      ? { "--mobile-overlay-height": `${mobileOverlayHeight.value}px` }
      : undefined,
  );

  const snapshot = computed(() => config.gamer.value?.roomSnapshot.value ?? null);
  const connectionStatus = computed(() => config.gamer.value?.stats.value ?? "disconnect");
  const shareButtonText = computed(() => "复制链接");
  const currentChineseTheme = computed(
    () =>
      chineseChessThemes.find((theme) => theme.id === config.chineseChessTheme.value) ??
      chineseChessThemes[0],
  );
  const gameTypeLabel = computed(() => {
    if (!boardGameType.value) {
      return "未选择";
    }

    return boardGameType.value === "gobang" ? "五子棋" : "中国象棋";
  });
  const chineseCheckState = computed(() => {
    const game = snapshot.value?.game;

    if (!game || game.gameType !== "chinese-chess") {
      return null;
    }

    return game.check;
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

  const seatStatusText = (seat: { playerId: string | null; connected: boolean }) => {
    if (!seat.playerId) {
      return "空位";
    }

    return seat.connected ? "已连接" : "断线保留中";
  };

  const seatSummaryText = computed(() => {
    const currentSnapshot = snapshot.value;

    if (!currentSnapshot) {
      return "等待房间同步";
    }

    return `${campText("red")}：${seatStatusText(currentSnapshot.seats.red)} / ${campText("black")}：${seatStatusText(currentSnapshot.seats.black)}`;
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

  const currentTurnText = computed(() => {
    const currentSnapshot = snapshot.value;

    if (!currentSnapshot) {
      return "等待中";
    }

    if (currentSnapshot.game.status === "finished") {
      if (currentSnapshot.game.winner === "draw") {
        return "平局";
      }

      return currentSnapshot.game.winner
        ? `${campText(currentSnapshot.game.winner)}获胜`
        : "对局结束";
    }

    if (currentSnapshot.game.status === "waiting") {
      return "等待开局";
    }

    return currentSnapshot.selfCamp !== "viewer" && currentSnapshot.game.turn === currentSnapshot.selfCamp
      ? "轮到你了"
      : `${campText(currentSnapshot.game.turn)}回合`;
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

    const checkState = chineseCheckState.value;

    if (checkState?.red || checkState?.black) {
      const checkedCamp = checkState.red ? "red" : "black";
      const isSelfChecked = currentSnapshot.selfCamp !== "viewer" && currentSnapshot.selfCamp === checkedCamp;
      const isOpponentChecked = currentSnapshot.selfCamp !== "viewer" && currentSnapshot.selfCamp !== checkedCamp;

      return {
        label: "对局警报",
        title: isSelfChecked ? "你被将军了" : `${campText(checkedCamp)}被将军`,
        detail: isSelfChecked
          ? "请立即应将，化解当前威胁"
          : isOpponentChecked
            ? "继续施压，别给对方缓手"
            : "将帅正处于受威胁状态",
        tone: "check",
      };
    }

    if (currentSnapshot.selfCamp !== "viewer" && currentSnapshot.game.turn === currentSnapshot.selfCamp) {
      return {
        label: "对局状态",
        title: "轮到你了",
        detail: config.isGobang.value ? "点击棋盘交叉点落子" : "请选择棋子并完成走子",
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
    const currentGamer = config.gamer.value;

    if (!currentGamer) {
      return;
    }

    if (nextGameType === "gobang") {
      currentGamer.setBoard(new GobangBoard({ id: "chess" }));
      return;
    }

    currentGamer.setBoard(new ChineseChessBoard({ id: "chess", themeId: config.chineseChessTheme.value }));
  }

  const confirm = async () => {
    await config.gamer.value?.setCamp(config.camp.value);
  };

  const setSelectedCamp = (nextCamp: SeatCamp) => {
    config.camp.value = nextCamp;
  };

  const setView = (type: string) => {
    config.gamer.value?.board?.setCameraPosition(type);
  };

  const requestRematch = async () => {
    await config.gamer.value?.requestRematch();
  };

  const respondRematch = async (accept: boolean) => {
    await config.gamer.value?.respondRematch(accept);
  };

  const setMobileOverlayHeight = (height: number) => {
    mobileOverlayHeight.value = isMobileBoardMode.value ? height : 0;
  };

  const syncMobileOverlay = () => {
    void nextTick(() => {
      if (!isMobileBoardMode.value) {
        mobileOverlayHeight.value = 0;
      }
    });
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

  const showTransientMessage = (text: string) => {
    if (messageTimer !== null) {
      window.clearTimeout(messageTimer);
      messageTimer = null;
    }

    config.messageShow.value = false;
    config.message.value = "";
    window.setTimeout(() => {
      config.message.value = text;
    }, 0);
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
    if (!config.canShareRoom.value || !config.shareUrl.value) {
      return;
    }

    const copied = await copyRoomLink(config.shareUrl.value);
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

    if (messageTimer !== null) {
      window.clearTimeout(messageTimer);
    }

    if (turnIndicatorTimer !== null) {
      window.clearTimeout(turnIndicatorTimer);
    }
  });

  watch([boardGameType, config.gamer], ([value, currentGamer], [previous]) => {
    if (value && currentGamer && (value !== previous || !currentGamer.board)) {
      createBoard(value);
    }
  });

  watch(config.chineseChessTheme, () => {
    if (boardGameType.value === "chinese-chess" && config.gamer.value) {
      createBoard("chinese-chess");
    }
  });

  watch(config.message, (newVal) => {
    if (newVal === "") {
      return;
    }

    if (messageTimer !== null) {
      window.clearTimeout(messageTimer);
    }

    config.messageShow.value = true;
    messageTimer = window.setTimeout(() => {
      config.messageShow.value = false;
      config.message.value = "";
      messageTimer = null;
    }, 1500);
  });

  watch(
    () => config.gamer.value?.roomSnapshot.value?.selfCamp,
    (selfCamp) => {
      if (selfCamp) {
        config.camp.value = selfCamp;
      }
    },
    { immediate: true },
  );

  watch(
    () => [config.hasSelectedGameType.value, isMobileLayout.value],
    () => {
      if (!isMobileBoardMode.value) {
        mobileMenuMode.value = "compact";
      }

      syncMobileOverlay();
    },
    { immediate: true },
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
      config.isGobang.value,
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
    { immediate: true },
  );

  return {
    ...config,
    activeMenuSection,
    boardGameType,
    boardStyles,
    canRequestRematch,
    campText,
    chineseChessThemes,
    connectionStatus,
    currentChineseTheme,
    currentTurnText,
    gameTypeLabel,
    isCampSelectable,
    isMobileBoardMode,
    isMobileMenuExpanded,
    isPendingForSelf,
    isTurnIndicatorHighlighted,
    matchPhaseText,
    rematchStatusText,
    seatSummaryText,
    selfCampText,
    shareButtonText,
    snapshot,
    statsKV,
    turnIndicator,
    confirm,
    requestRematch,
    respondRematch,
    selectMenuSection,
    setSelectedCamp,
    setMobileOverlayHeight,
    setView,
    shareRoom,
    toggleMobileMenu,
  };
}

export type ChessGameViewModel = ReturnType<typeof useChessGameViewModel>;
