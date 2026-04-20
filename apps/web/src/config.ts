import { computed, type Ref, ref, shallowRef, watch } from "vue";
import { useRouter } from "vue-router";
import type { GameType, SeatCamp } from "@chess/game-core";
import Gamer from "./core/chinese-chess/Gamer";

export function getQueryByName(name: string, url = window.location.href) {
  return new URL(url).searchParams.get(name);
}

function parseGameType(value: string | null): GameType | null {
  if (value === "gobang" || value === "chinese-chess") {
    return value;
  }

  return null;
}

export function useConfig() {
  const camp: Ref<SeatCamp> = ref("viewer");
  const router = useRouter();
  const roomId = ref(getQueryByName("roomId") ?? "");
  const gameType = ref<GameType | null>(parseGameType(getQueryByName("gameType")));

  if (!roomId.value) {
    roomId.value = Date.now().toString();
  }

  const message = ref("");
  const messageShow = ref(false);
  const gamer = shallowRef<Gamer | null>(null);
  const resolvedGameType = computed<GameType | null>(() => gamer.value?.roomSnapshot.value?.gameType ?? gameType.value);
  const isGobang = computed(() => resolvedGameType.value === "gobang");
  const hasSelectedGameType = computed(() => resolvedGameType.value !== null);

  const buildRoomUrl = (nextGameType: GameType | null) => {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("roomId", roomId.value);

    if (nextGameType) {
      url.searchParams.set("gameType", nextGameType);
    }

    return url;
  };

  const shareUrl = computed(() => {
    if (!resolvedGameType.value) {
      return "";
    }

    return buildRoomUrl(resolvedGameType.value).toString();
  });

  const canShareRoom = computed(() => shareUrl.value !== "");

  const syncRoute = (nextGameType: GameType | null) => {
    const nextUrl = buildRoomUrl(nextGameType);
    void router.replace(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
  };

  const ensureGamer = (nextGameType: GameType) => {
    if (gamer.value?.gameType === nextGameType) {
      return gamer.value;
    }

    gamer.value?.board?.destroy?.();
    gamer.value?.socket.disconnect();
    gamer.value = new Gamer(roomId.value, nextGameType, message);
    return gamer.value;
  };

  const selectGameType = (nextGameType: GameType) => {
    gameType.value = nextGameType;
    syncRoute(nextGameType);
    ensureGamer(nextGameType);
  };

  watch(
    () => gamer.value?.roomSnapshot.value?.gameType,
    (nextGameType) => {
      if (!nextGameType || gameType.value === nextGameType) {
        return;
      }

      gameType.value = nextGameType;
      syncRoute(nextGameType);
    },
  );

  syncRoute(gameType.value);

  if (gameType.value) {
    ensureGamer(gameType.value);
  }

  return {
    camp,
    roomId,
    gameType,
    hasSelectedGameType,
    isGobang,
    gamer,
    message,
    messageShow,
    shareUrl,
    canShareRoom,
    selectGameType,
  };
}
