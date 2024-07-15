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
  moveRange: number[][];
  index: number; // 大部分棋子是复数，用这个区分开
  constructor(option: ChessOption) {
    // this.name = "";
    this.draw = option.draw;
    this.type = option.type;
    this.camp = option.camp;
    this.position = [0, 0];
    this.moveRange = [];
    this.index = option.index;
    this.name = this.type + "_" + this.index;
    this.initChess();
  }
  initChess() {
    this.draw.drawChess(this.type, this.camp, this.name);
    this.draw.setPosition(this.name, this.position);
  }
  // 返回不限制移动范围
  getMoveRange() {}
  // 返回限制移动范围
  getFilterMoveRange(chessPostions: [[number, number]]) {}
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
  getMoveRange(): number[][] {
    // 只能在九宫格走
    // 范围是x:4~6 y:0~2 | 7~9
    // 可移动情况较少，所以直接穷举出来
    const res = [];
    const x = this.position[0];
    const y = this.position[1];
    // 横向
    switch (x) {
      case 4:
      case 6:
        res.push([5, y]);
        break;
      case 5:
        res.push([4, y]);
        res.push([6, y]);
        break;
      default:
        break;
    }
    // 纵向
    switch (y) {
      case 0:
      case 2:
        res.push([x, 1]);
        break;
      case 1:
        res.push([x, 0]);
        res.push([x, 2]);
        break;
      case 9:
      case 7:
        res.push([x, 8]);
        break;
      case 8:
        res.push([x, 7]);
        res.push([x, 9]);
        break;
      default:
        break;
    }
    return res;
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
  getMoveRange(): number[][] {
    // 只能在九宫格走
    // 范围是x:4~6 y:0~2 | 7~9
    // 可移动情况较少，所以直接穷举出来
    const res = [];
    const x = this.position[0];
    const y = this.position[1];

    switch (x) {
      case 4:
      case 6:
        res.push([5, this.camp === "red" ? 1 : 8]);
        break;
      case 5:
        res.push([4, y + 1]);
        res.push([4, y - 1]);
        res.push([6, y + 1]);
        res.push([6, y - 1]);
        break;
      default:
        break;
    }
    return res;
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
  getMoveRange(): number[][] {
    // 仅在7个点移动
    // 范围是x:偶数 y:0,2,4 | 5,7,9
    // 可移动情况较少，所以直接穷举出来
    const res = [];
    const x = this.position[0];
    const yRange = this.camp === "red" ? [0, 2, 4] : [9, 7, 5];
    switch (x) {
      case 0:
        res.push([2, yRange[0]]);
        res.push([2, yRange[2]]);
        break;
      case 8:
        res.push([6, yRange[0]]);
        res.push([6, yRange[2]]);
        break;
      case 2:
      case 6:
        res.push([x - 2, yRange[1]]);
        res.push([x + 2, yRange[1]]);
        break;
      case 4:
        res.push([x - 2, yRange[0]]);
        res.push([x + 2, yRange[0]]);
        res.push([x - 2, yRange[2]]);
        res.push([x + 2, yRange[2]]);
        break;
      default:
        break;
    }
    return res;
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
