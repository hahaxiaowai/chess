import { type Ref, ref } from "vue";
import { useRouter } from "vue-router";
import Gamer from "./core/chinese-chess/Gamer";
import type { SeatCamp } from "@chess/game-core";

export function getQueryByName(name: string, url = window.location.href) {
  // eslint-disable-next-line
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

export function useConfig() {
  const camp: Ref<SeatCamp> = ref("viewer");
  const router = useRouter();
  const roomId = ref(getQueryByName("roomId") ?? "");

  if (!roomId.value) {
    roomId.value = Date.now().toString();
    void router.replace("/?roomId=" + roomId.value);
  }

  const message = ref("");
  const messageShow = ref(false);
  const gamer = new Gamer(roomId.value, message);

  return {
    camp,
    roomId,
    gamer,
    message,
    messageShow,
  };
}
