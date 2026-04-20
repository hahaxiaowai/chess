import type { GobangGameState, RoomSnapshot, SeatCamp } from "@chess/game-core";
import type { BoardMoveIntent, GameBoard } from "../shared/board";
import Draw from "./Draw";

interface BoardOption {
  id: string;
}

class Board implements GameBoard {
  draw: Draw;
  game?: GobangGameState;
  curGamer: SeatCamp;
  hasAutoOriented: boolean;
  submitMove?: (move: BoardMoveIntent) => void;

  constructor(option: BoardOption) {
    this.draw = new Draw(option.id);
    this.curGamer = "viewer";
    this.hasAutoOriented = false;
    this.draw.drawBoard();
    this.draw.initEvent((position) => {
      if (!this.canOperate() || !this.submitMove) {
        return;
      }

      this.draw.showHover(position);
      this.submitMove({ gameType: "gobang", position });
    });
  }

  setSnapshot(snapshot: RoomSnapshot) {
    if (snapshot.game.gameType !== "gobang") {
      return;
    }

    const shouldAutoOrient = !this.hasAutoOriented || this.curGamer !== snapshot.selfCamp;
    this.game = snapshot.game;
    this.curGamer = snapshot.selfCamp;

    if (shouldAutoOrient) {
      this.draw.resetCameraToFront(this.curGamer);
      this.hasAutoOriented = true;
    }

    this.draw.syncPieces(
      snapshot.game.moves.map((move) => ({
        id: `move-${move.moveNumber}`,
        camp: move.camp,
        position: move.position,
      })),
    );

    if (snapshot.game.status === "finished") {
      this.draw.clearHover();
    }
  }

  setCameraPosition(type: string) {
    this.draw.setCameraPosition(type, this.curGamer);
  }

  destroy() {
    this.draw.destroy();
  }

  private canOperate() {
    return (
      !!this.game &&
      this.game.status === "playing" &&
      this.curGamer !== "viewer" &&
      this.game.turn === this.curGamer
    );
  }
}

export default Board;
