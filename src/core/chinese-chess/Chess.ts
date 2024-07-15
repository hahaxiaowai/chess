import Draw from "./Draw";

interface ChessOption {
  type: ChessTypes;
  camp: ChessCamp;
  draw: Draw;
  index: number;
}

class Chess {
  draw: Draw;
  type: ChessTypes;
  camp: ChessCamp;
  name: string;
  position: [number, number];
  index: number; // 大部分棋子是复数，用这个区分开
  constructor(option: ChessOption) {
    // this.name = "";
    this.draw = option.draw;
    this.type = option.type;
    this.camp = option.camp;
    this.position = [0, 0];
    this.index = option.index;
    this.name = this.type + "_" + this.index;
    this.initChess();
  }
  initChess() {
    this.draw.drawChess(this.type, this.camp, this.name);
    this.draw.setPosition(this.name, this.position);
  }
  getMoveRange() {}
  move(position: [number, number]) {
    this.position = position;
    this.draw.setPosition(this.name, this.position);
  }
  kill() {}
}

class Jiang extends Chess {
  constructor(option: ChessOption) {
    super(option);
    if (this.camp === "red") {
      this.position = [4, 0];
    } else {
      this.position = [4, 9];
    }
    this.move(this.position);
  }
}
class Shi extends Chess {
  constructor(option: ChessOption) {
    super(option);
    if (this.camp === "red") {
      this.position = this.index ? [5, 0] : [3, 0];
    } else {
      this.position = this.index ? [5, 9] : [3, 9];
    }
    this.move(this.position);
  }
}
class Xiang extends Chess {
  constructor(option: ChessOption) {
    super(option);
    if (this.camp === "red") {
      this.position = this.index ? [6, 0] : [2, 0];
    } else {
      this.position = this.index ? [6, 9] : [2, 9];
    }
    this.move(this.position);
  }
}
class Ma extends Chess {
  constructor(option: ChessOption) {
    super(option);
    if (this.camp === "red") {
      this.position = this.index ? [7, 0] : [1, 0];
    } else {
      this.position = this.index ? [7, 9] : [1, 9];
    }
    this.move(this.position);
  }
}
class Ju extends Chess {
  constructor(option: ChessOption) {
    super(option);
    if (this.camp === "red") {
      this.position = this.index ? [8, 0] : [0, 0];
    } else {
      this.position = this.index ? [8, 9] : [0, 9];
    }
    this.move(this.position);
  }
}
class Pao extends Chess {
  constructor(option: ChessOption) {
    super(option);
    if (this.camp === "red") {
      this.position = this.index ? [7, 2] : [1, 2];
    } else {
      this.position = this.index ? [7, 7] : [1, 7];
    }
    this.move(this.position);
  }
}
class Bing extends Chess {
  constructor(option: ChessOption) {
    super(option);
    if (this.camp === "red") {
      this.position = [this.index * 2, 3];
    } else {
      this.position = [this.index * 2, 6];
    }
    this.move(this.position);
  }
}
export { Chess, Jiang, Shi, Xiang, Ma, Ju, Pao, Bing };
