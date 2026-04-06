import type { Camp, GameType, Position, SeatCamp, SerializedGameState } from "./game.js";

export interface JoinRoomPayload {
  roomId: string;
  playerId: string;
  gameType: GameType;
}

export interface SetCampPayload extends JoinRoomPayload {
  camp: SeatCamp;
}

export interface ChineseChessSubmitMovePayload extends JoinRoomPayload {
  gameType: "chinese-chess";
  pieceId: string;
  to: Position;
}

export interface GobangSubmitMovePayload extends JoinRoomPayload {
  gameType: "gobang";
  position: Position;
}

export type SubmitMovePayload = ChineseChessSubmitMovePayload | GobangSubmitMovePayload;
export type RequestRematchPayload = JoinRoomPayload;

export interface RespondRematchPayload extends JoinRoomPayload {
  accept: boolean;
}

export interface SeatSnapshot {
  playerId: string | null;
  connected: boolean;
  reservedUntil: number | null;
}

export interface RematchSnapshot {
  requester: Camp | null;
  pendingFor: Camp | null;
}

export interface RoomSnapshot {
  roomId: string;
  gameType: GameType;
  selfCamp: SeatCamp;
  game: SerializedGameState;
  seats: Record<Camp, SeatSnapshot>;
  rematch: RematchSnapshot;
  disconnectGraceMs: number;
}

export type AckCode =
  | "INVALID_SESSION"
  | "ROOM_NOT_FOUND"
  | "ROOM_GAME_TYPE_MISMATCH"
  | "SEAT_TAKEN"
  | "ROOM_NOT_READY"
  | "NOT_PLAYER"
  | "NOT_YOUR_TURN"
  | "ILLEGAL_MOVE"
  | "GAME_FINISHED"
  | "GAME_NOT_ACTIVE"
  | "PIECE_NOT_FOUND"
  | "CELL_OCCUPIED"
  | "REMATCH_NOT_AVAILABLE"
  | "REMATCH_ALREADY_PENDING"
  | "INVALID_REMATCH_RESPONSE";

export type ServerAck =
  | {
      ok: true;
      snapshot?: RoomSnapshot;
      message?: string;
    }
  | {
      ok: false;
      code: AckCode;
      message: string;
      snapshot?: RoomSnapshot;
    };

export interface ServerToClientEvents {
  roomSnapshot: (snapshot: RoomSnapshot) => void;
}

export interface ClientToServerEvents {
  joinRoom: (payload: JoinRoomPayload, cb: (ack: ServerAck) => void) => void;
  setCamp: (payload: SetCampPayload, cb: (ack: ServerAck) => void) => void;
  submitMove: (payload: SubmitMovePayload, cb: (ack: ServerAck) => void) => void;
  requestRematch: (payload: RequestRematchPayload, cb: (ack: ServerAck) => void) => void;
  respondRematch: (payload: RespondRematchPayload, cb: (ack: ServerAck) => void) => void;
}
