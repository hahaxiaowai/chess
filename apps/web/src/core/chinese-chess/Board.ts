import Draw from "./Draw";
import {
  createInitialGame,
  getLegalMoves,
  getPieceAtPosition,
  type Position,
  type RoomSnapshot,
  type SeatCamp,
  type SerializedGameState,
} from "@chess/game-core";

interface BoardOption {
  id: string;
}

type SubmitMoveHandler = (pieceId: string, position: Position) => void;

type HighlightTarget = {
  id: string;
  position: Position;
};

class Board {
  draw: Draw;
  game?: SerializedGameState;
  curGamer: SeatCamp;
  selectedPieceId?: string;
  submitMove?: SubmitMoveHandler;

  constructor(option: BoardOption) {
    this.draw = new Draw(option.id);
    this.curGamer = "viewer";
    this.initBoard();
    this.drawPieces();
    this.initEvent();
  }

  initBoard() {
    this.draw.drawBoard();
  }

  drawPieces() {
    for (const piece of createInitialGame().pieces) {
      this.draw.drawChess(piece.label, piece.camp, piece.id);
    }
  }

  initEvent() {
    this.draw.initEvent((type, position) => {
      if (type === "range" || type === "target") {
        if (position) {
          this.handleMove(position);
        }
        return;
      }

      this.handlePieceSelection(type);
    });
  }

  setSnapshot(snapshot: RoomSnapshot) {
    this.game = snapshot.game;
    this.curGamer = snapshot.selfCamp;
    this.selectedPieceId = undefined;
    this.draw.setChessRotation(this.curGamer);
    this.syncPieces();
    this.draw.clearRange();
  }

  setCameraPosition(type: string) {
    this.draw.flyTo(type, this.curGamer);
  }

  private syncPieces() {
    if (!this.game) {
      return;
    }

    for (const piece of this.game.pieces) {
      this.draw.setPosition(piece.id, piece.position);
      this.draw.setVisible(piece.id, piece.alive);
    }
  }

  private canOperate() {
    return (
      !!this.game &&
      this.game.status === "playing" &&
      this.curGamer !== "viewer" &&
      this.game.turn === this.curGamer
    );
  }

  private handlePieceSelection(pieceId: string) {
    if (!this.game || !this.canOperate()) {
      this.selectedPieceId = undefined;
      this.draw.clearRange();
      return;
    }

    const piece = this.game.pieces.find((item) => item.id === pieceId);

    if (!piece || !piece.alive || piece.camp !== this.curGamer) {
      this.selectedPieceId = undefined;
      this.draw.clearRange();
      return;
    }

    this.selectedPieceId = pieceId;
    this.showLegalMoves(pieceId);
  }

  private handleMove(position: Position) {
    if (!this.game || !this.selectedPieceId || !this.submitMove || !this.canOperate()) {
      return;
    }

    const legalMoves = getLegalMoves(this.game, this.selectedPieceId);
    const isLegal = legalMoves.some(
      (candidate) => candidate[0] === position[0] && candidate[1] === position[1],
    );

    if (!isLegal) {
      return;
    }

    this.submitMove(this.selectedPieceId, position);
  }

  private showLegalMoves(pieceId: string) {
    if (!this.game) {
      return;
    }

    const legalMoves = getLegalMoves(this.game, pieceId);
    const moveRange: Position[] = [];
    const targets: HighlightTarget[] = [];

    for (const position of legalMoves) {
      const target = getPieceAtPosition(this.game, position);

      if (target) {
        targets.push({
          id: target.id,
          position,
        });
      } else {
        moveRange.push(position);
      }
    }

    this.draw.showRangeAndTarget(moveRange, targets);
  }
}

export default Board;
