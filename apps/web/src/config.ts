import { computed, type Ref, ref } from "vue";
import { useRouter } from "vue-router";
import { shallowRef } from "vue";
import type { GameType, SeatCamp } from "@chess/game-core";
import Gamer from "./core/chinese-chess/Gamer";

export function getQueryByName(name: string, url = window.location.href) {
  name = name.replace(/[[\]]/g, "\\$&");
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
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
  const isGobang = computed(() => gameType.value === "gobang");
  const hasSelectedGameType = computed(() => gameType.value !== null);

  const syncRoute = (nextGameType: GameType | null) => {
    const query = nextGameType ? `/?roomId=${roomId.value}&gameType=${nextGameType}` : `/?roomId=${roomId.value}`;
    void router.replace(query);
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
    selectGameType,
  };
}
