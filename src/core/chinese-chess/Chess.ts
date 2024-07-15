import Draw from "./Draw";

class Chess {
  draw: Draw;
  constructor(d: Draw) {
    this.draw = d;
    this.initChess();
  }
  initChess() {
    this.draw.drawChess();
  }
  getMoveRange() {}
  move() {}
  kill() {}
}

class General extends Chess {
  constructor(d: Draw) {
    super(d);
  }
  initChess(): void {}
}
export { Chess, General };
