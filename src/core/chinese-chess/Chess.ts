import Draw from "./Draw";

class Chess {
  draw: Draw;
  type: ChessTypes;
  camp: ChessCamp;
  constructor(type: ChessTypes, camp: ChessCamp, d: Draw) {
    this.draw = d;
    this.type = type;
    this.camp = camp;
    this.initChess();
  }
  initChess() {
    this.draw.drawChess(this.type, this.camp);
  }
  getMoveRange() {}
  move() {}
  kill() {}
}

class General extends Chess {
  constructor(type: ChessTypes, camp: ChessCamp, d: Draw) {
    super(type, camp, d);
  }
  // initChess(): void {}
}
export { Chess, General };
