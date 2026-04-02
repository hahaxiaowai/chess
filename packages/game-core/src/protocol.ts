import type { Camp, Position, SeatCamp, SerializedGameState } from "./game.js";

export interface JoinRoomPayload {
  roomId: string;
  playerId: string;
}

export interface SetCampPayload extends JoinRoomPayload {
  camp: SeatCamp;
}

export interface SubmitMovePayload extends JoinRoomPayload {
  pieceId: string;
  to: Position;
}

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
  selfCamp: SeatCamp;
  game: SerializedGameState;
  seats: Record<Camp, SeatSnapshot>;
  rematch: RematchSnapshot;
  disconnectGraceMs: number;
}

export type AckCode =
  | "INVALID_SESSION"
  | "ROOM_NOT_FOUND"
  | "SEAT_TAKEN"
  | "ROOM_NOT_READY"
  | "NOT_PLAYER"
  | "NOT_YOUR_TURN"
  | "ILLEGAL_MOVE"
  | "GAME_FINISHED"
  | "GAME_NOT_ACTIVE"
  | "PIECE_NOT_FOUND"
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
