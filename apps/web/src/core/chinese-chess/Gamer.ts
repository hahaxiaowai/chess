import Board from "./Board";
import {
  type ClientToServerEvents,
  type Position,
  type RoomSnapshot,
  type SeatCamp,
  type ServerAck,
  type ServerToClientEvents,
} from "@chess/game-core";
import { io, Socket } from "socket.io-client";
import { ref, type Ref } from "vue";

const PLAYER_ID_KEY = "chess:player-id";

function createPlayerId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getPlayerId() {
  const stored = window.localStorage.getItem(PLAYER_ID_KEY);

  if (stored) {
    return stored;
  }

  const nextId = createPlayerId();
  window.localStorage.setItem(PLAYER_ID_KEY, nextId);
  return nextId;
}

function getSocketUrl() {
  const configured = import.meta.env.VITE_WS?.trim();

  if (import.meta.env.DEV) {
    return configured || window.location.origin;
  }

  return configured || undefined;
}

class Gamer {
  roomId: string;
  stats: Ref<"disconnect" | "ready" | "run">;
  playerId: string;
  roomSnapshot: Ref<RoomSnapshot | null>;
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  board?: Board;
  message: Ref<string>;
  constructor(roomId: string, message: Ref<string>) {
    this.roomId = roomId;
    this.playerId = getPlayerId();
    this.message = message;
    this.socket = io(getSocketUrl());
    this.stats = ref("disconnect");
    this.roomSnapshot = ref(null);

    this.socket.on("connect", () => {
      this.stats.value = "ready";
      this.joinRoom();
    });

    this.socket.on("disconnect", () => {
      this.stats.value = "disconnect";
    });

    this.socket.on("roomSnapshot", (snapshot) => {
      this.handleSnapshot(snapshot);
    });
  }

  private setMessage(text?: string) {
    if (!text) {
      return;
    }

    this.message.value = text;
  }

  private handleSnapshot(snapshot: RoomSnapshot) {
    const previousSnapshot = this.roomSnapshot.value;
    this.roomSnapshot.value = snapshot;
    this.stats.value = snapshot.selfCamp === "viewer" ? "ready" : "run";
    this.board?.setSnapshot(snapshot);

    if (snapshot.game.winner && previousSnapshot?.game.winner !== snapshot.game.winner) {
      this.setMessage(snapshot.game.winner === "red" ? "红方赢" : "黑方赢");
    }

    if (
      snapshot.rematch.pendingFor === snapshot.selfCamp &&
      previousSnapshot?.rematch.pendingFor !== snapshot.rematch.pendingFor
    ) {
      this.setMessage("对方申请重开");
    }
  }

  private handleAck(ack: ServerAck) {
    if (ack.snapshot) {
      this.handleSnapshot(ack.snapshot);
    }

    if (!ack.ok) {
      this.setMessage(ack.message);
      return false;
    }

    this.setMessage(ack.message);
    return true;
  }

  joinRoom() {
    this.socket.emit("joinRoom", { roomId: this.roomId, playerId: this.playerId }, (ack) => {
      this.handleAck(ack);
    });
  }

  setCamp(camp: SeatCamp): Promise<boolean> {
    return new Promise((resolve) => {
      this.socket.emit(
        "setCamp",
        { roomId: this.roomId, playerId: this.playerId, camp },
        (ack) => resolve(this.handleAck(ack)),
      );
    });
  }

  setBoard(board: Board) {
    this.board = board;

    if (this.roomSnapshot.value) {
      this.board.setSnapshot(this.roomSnapshot.value);
    }

    this.board.submitMove = this.submitMove.bind(this);
  }

  submitMove(pieceId: string, to: Position) {
    this.socket.emit(
      "submitMove",
      { roomId: this.roomId, playerId: this.playerId, pieceId, to },
      (ack) => {
        this.handleAck(ack);
      },
    );
  }

  requestRematch(): Promise<boolean> {
    return new Promise((resolve) => {
      this.socket.emit(
        "requestRematch",
        { roomId: this.roomId, playerId: this.playerId },
        (ack) => resolve(this.handleAck(ack)),
      );
    });
  }

  respondRematch(accept: boolean): Promise<boolean> {
    return new Promise((resolve) => {
      this.socket.emit(
        "respondRematch",
        { roomId: this.roomId, playerId: this.playerId, accept },
        (ack) => resolve(this.handleAck(ack)),
      );
    });
  }
}

export default Gamer;
