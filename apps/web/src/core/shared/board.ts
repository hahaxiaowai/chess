import type { Position, RoomSnapshot } from "@chess/game-core";

export type BoardMoveIntent =
  | {
      gameType: "chinese-chess";
      pieceId: string;
      to: Position;
    }
  | {
      gameType: "gobang";
      position: Position;
    };

export interface GameBoard {
  submitMove?: (move: BoardMoveIntent) => void;
  setSnapshot(snapshot: RoomSnapshot): void;
  setCameraPosition(type: string): void;
  destroy?(): void;
}
