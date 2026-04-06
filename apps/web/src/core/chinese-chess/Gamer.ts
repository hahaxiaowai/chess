import type {
  ClientToServerEvents,
  RoomSnapshot,
  SeatCamp,
  ServerAck,
  ServerToClientEvents,
  GameType,
} from "@chess/game-core";
import { io, Socket } from "socket.io-client";
import { ref, type Ref } from "vue";
import type { BoardMoveIntent, GameBoard } from "../shared/board";

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
  gameType: GameType;
  stats: Ref<"disconnect" | "ready" | "run">;
  playerId: string;
  roomSnapshot: Ref<RoomSnapshot | null>;
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  board?: GameBoard;
  message: Ref<string>;

  constructor(roomId: string, gameType: GameType, message: Ref<string>) {
    this.roomId = roomId;
    this.gameType = gameType;
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

  private campLabel(snapshot: RoomSnapshot, camp: "red" | "black") {
    if (snapshot.gameType === "gobang") {
      return camp === "red" ? "白方" : "黑方";
    }

    return camp === "red" ? "红方" : "黑方";
  }

  private handleSnapshot(snapshot: RoomSnapshot) {
    const previousSnapshot = this.roomSnapshot.value;
    this.roomSnapshot.value = snapshot;
    this.gameType = snapshot.gameType;
    this.stats.value = snapshot.selfCamp === "viewer" ? "ready" : "run";
    this.board?.setSnapshot(snapshot);

    if (snapshot.game.winner && previousSnapshot?.game.winner !== snapshot.game.winner) {
      if (snapshot.game.winner === "draw") {
        this.setMessage("平局");
      } else {
        this.setMessage(`${this.campLabel(snapshot, snapshot.game.winner)}获胜`);
      }
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
    this.socket.emit(
      "joinRoom",
      { roomId: this.roomId, playerId: this.playerId, gameType: this.gameType },
      (ack) => {
        this.handleAck(ack);
      },
    );
  }

  setCamp(camp: SeatCamp): Promise<boolean> {
    return new Promise((resolve) => {
      this.socket.emit(
        "setCamp",
        { roomId: this.roomId, playerId: this.playerId, gameType: this.gameType, camp },
        (ack) => resolve(this.handleAck(ack)),
      );
    });
  }

  setBoard(board: GameBoard) {
    this.board?.destroy?.();
    this.board = board;

    if (this.roomSnapshot.value) {
      this.board.setSnapshot(this.roomSnapshot.value);
    }

    this.board.submitMove = this.submitMove.bind(this);
  }

  submitMove(move: BoardMoveIntent) {
    if (move.gameType === "gobang") {
      this.socket.emit(
        "submitMove",
        {
          roomId: this.roomId,
          playerId: this.playerId,
          gameType: "gobang",
          position: move.position,
        },
        (ack) => {
          this.handleAck(ack);
        },
      );
      return;
    }

    this.socket.emit(
      "submitMove",
      {
        roomId: this.roomId,
        playerId: this.playerId,
        gameType: "chinese-chess",
        pieceId: move.pieceId,
        to: move.to,
      },
      (ack) => {
        this.handleAck(ack);
      },
    );
  }

  requestRematch(): Promise<boolean> {
    return new Promise((resolve) => {
      this.socket.emit(
        "requestRematch",
        { roomId: this.roomId, playerId: this.playerId, gameType: this.gameType },
        (ack) => resolve(this.handleAck(ack)),
      );
    });
  }

  respondRematch(accept: boolean): Promise<boolean> {
    return new Promise((resolve) => {
      this.socket.emit(
        "respondRematch",
        { roomId: this.roomId, playerId: this.playerId, gameType: this.gameType, accept },
        (ack) => resolve(this.handleAck(ack)),
      );
    });
  }
}

export default Gamer;

