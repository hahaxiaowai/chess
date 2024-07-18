import { includes, indexOf } from "./Common";
import Draw from "./Draw";

interface ChessOption {
  type: ChessType;
  camp: ChessCamp;
  draw: Draw;
  index: number;
}

class Chess {
  draw: Draw;
  type: ChessType;
  camp: ChessCamp;
  name: string;
  position: [number, number];
  moveRange: number[][];
  _stop: number[][]; //array转string
  index: number; // 大部分棋子是复数，用这个区分开
  constructor(option: ChessOption) {
    // this.name = "";
    this.draw = option.draw;
    this.type = option.type;
    this.camp = option.camp;
    this.position = [0, 0];
    this.moveRange = [];
    this._stop = [];
    this.index = option.index;
    this.name = this.camp + "_" + this.type + "_" + this.index;
    this.initChess();
  }
  initChess() {
    this.draw.drawChess(this.type, this.camp, this.name);
    this.draw.setPosition(this.name, this.position);
  }
  // 返回不限制移动范围
  getMoveRange(): { moveRange: number[][]; stop: number[][] } {
    return { moveRange: [], stop: this._stop };
  }
  // 返回限制移动范围
  getFilterMoveRange(
    chess: Chess[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _stopChess?: Chess[]
  ): {
    moveRange: number[][];
    target: Chess[];
  } {
    // 返回两个数组，一个是可移动范围，一个是攻击目标
    const targetRes: Chess[] = [];
    for (let i = 0; i < chess.length; i++) {
      // 放进目标数组
      if (chess[i].camp !== this.camp) {
        targetRes.push(chess[i]);
      }
      // 在moveRange中删除
      const index = indexOf(this.moveRange, chess[i].position);
      this.moveRange.splice(index, 1);
    }
    return { moveRange: this.moveRange, target: targetRes };
  }
  move(position: [number, number]) {
    this.position = position;
    this.draw.setPosition(this.name, this.position);
  }
  beKilled() {
    this.draw.hidden(this.name);
  }
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

  getMoveRange(): { moveRange: number[][]; stop: number[][] } {
    // 只能在九宫格走
    // 范围是x:3~5 y:0~2 | 7~9
    // 可移动情况较少，所以直接穷举出来
    const res = [];
    const x = this.position[0];
    const y = this.position[1];
    // 横向
    switch (x) {
      case 3:
      case 5:
        res.push([4, y]);
        break;
      case 4:
        res.push([3, y]);
        res.push([5, y]);
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
    this.moveRange = res;
    return { moveRange: this.moveRange, stop: this._stop };
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
  getMoveRange(): { moveRange: number[][]; stop: number[][] } {
    // 只能在九宫格走
    // 范围是x:3~5 y:0~2 | 7~9
    // 可移动情况较少，所以直接穷举出来
    const res = [];
    const x = this.position[0];
    const y = this.position[1];

    switch (x) {
      case 3:
      case 5:
        res.push([4, this.camp === "red" ? 1 : 8]);
        break;
      case 4:
        res.push([3, y + 1]);
        res.push([3, y - 1]);
        res.push([5, y + 1]);
        res.push([5, y - 1]);
        break;
      default:
        break;
    }
    this.moveRange = res;
    return { moveRange: this.moveRange, stop: this._stop };
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
  getMoveRange(): { moveRange: number[][]; stop: number[][] } {
    // 仅在7个点移动
    // 范围是x:偶数 y:0,2,4 | 5,7,9
    // 可移动情况较少，所以直接穷举出来
    const res = [];
    const x = this.position[0];
    const y = this.position[1];
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
    this.moveRange = res;
    this._stop = [];
    for (let i = 0; i < this.moveRange.length; i++) {
      this._stop.push([
        (x + this.moveRange[i][0]) / 2,
        (y + this.moveRange[i][1]) / 2,
      ]);
    }
    return { moveRange: this.moveRange, stop: this._stop };
  }

  getFilterMoveRange(
    chess: Chess[],
    stopChess?: Chess[]
  ): {
    moveRange: number[][];
    target: Chess[];
  } {
    // 返回两个数组，一个是可移动范围，一个是攻击目标
    const targetRes: Chess[] = [];
    // 蹩腿
    if (stopChess) {
      const deleteIndex = [];
      for (let i = 0; i < stopChess.length; i++) {
        const index = indexOf(this._stop, stopChess[i].position);
        if (index >= 0) {
          deleteIndex.push(index);
        }
      }
      const temp = [];
      for (let i = 0; i < this.moveRange.length; i++) {
        if (deleteIndex.indexOf(i) < 0) {
          temp.push(this.moveRange[i]);
        }
      }
      this.moveRange = temp;
    }
    // moveRange被筛选，chess也需要筛选一次
    for (let i = 0; i < chess.length; i++) {
      const index = indexOf(this.moveRange, chess[i].position);
      if (index < 0) {
        continue;
      } else {
        // 在moveRange中删除
        this.moveRange.splice(index, 1);
      }
      // 放进目标数组
      if (chess[i].camp !== this.camp) {
        targetRes.push(chess[i]);
      }
    }

    return { moveRange: this.moveRange, target: targetRes };
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
  getMoveRange(): { moveRange: number[][]; stop: number[][] } {
    // 仅考虑正常的可移动位置，不考虑蹩马腿的情况
    // 可移动情况较少，所以直接穷举出来
    // 先不考虑超出范围
    const res = [];
    const x = this.position[0];
    const y = this.position[1];
    res.push([x + 2, y + 1]);
    res.push([x + 2, y - 1]);
    res.push([x - 2, y + 1]);
    res.push([x - 2, y - 1]);
    res.push([x + 1, y + 2]);
    res.push([x - 1, y + 2]);
    res.push([x + 1, y - 2]);
    res.push([x - 1, y - 2]);
    this.moveRange = res;
    // this.moveRange = res.filter(
    //   (position) =>
    // position[0] >= 0 &&
    // position[0] <= 8 &&
    // position[1] >= 0 &&
    // position[1] <= 9
    // );
    this._stop = [];
    this._stop.push([x + 1, y]);
    this._stop.push([x - 1, y]);
    this._stop.push([x, y + 1]);
    this._stop.push([x, y - 1]);
    return { moveRange: this.moveRange, stop: this._stop };
  }
  getFilterMoveRange(
    chess: Chess[],
    stopChess?: Chess[]
  ): {
    moveRange: number[][];
    target: Chess[];
  } {
    // 返回两个数组，一个是可移动范围，一个是攻击目标
    const targetRes: Chess[] = [];
    // 蹩腿+范围
    if (stopChess) {
      const deleteIndex = [];
      for (let i = 0; i < stopChess.length; i++) {
        const index = indexOf(this._stop, stopChess[i].position);
        if (index >= 0) {
          deleteIndex.push(index * 2, index * 2 + 1);
        }
      }
      const temp = [];
      for (let i = 0; i < this.moveRange.length; i++) {
        if (
          deleteIndex.indexOf(i) < 0 &&
          this.moveRange[i][0] >= 0 &&
          this.moveRange[i][0] <= 8 &&
          this.moveRange[i][1] >= 0 &&
          this.moveRange[i][1] <= 9
        ) {
          temp.push(this.moveRange[i]);
        }
      }
      this.moveRange = temp;
    }
    // moveRange被筛选，chess也需要筛选一次
    for (let i = 0; i < chess.length; i++) {
      const index = indexOf(this.moveRange, chess[i].position);
      if (index < 0) {
        continue;
      } else {
        // 在moveRange中删除
        this.moveRange.splice(index, 1);
      }
      // 放进目标数组
      if (chess[i].camp !== this.camp) {
        targetRes.push(chess[i]);
      }
    }

    return { moveRange: this.moveRange, target: targetRes };
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
  getMoveRange(): { moveRange: number[][]; stop: number[][] } {
    const res = [];
    const x = this.position[0];
    const y = this.position[1];
    for (let i = 0; i < 10; i++) {
      if (i !== y) res.push([x, i]);
    }
    for (let i = 0; i < 9; i++) {
      if (i !== x) res.push([i, y]);
    }
    this.moveRange = res;
    return { moveRange: this.moveRange, stop: this._stop };
  }
  getFilterMoveRange(
    chess: Chess[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _stopChess?: Chess[]
  ): {
    moveRange: number[][];
    target: Chess[];
  } {
    const x = this.position[0];
    const y = this.position[1];
    // 返回两个数组，一个是可移动范围，一个是攻击目标
    this.moveRange = [];
    const targetRes: Chess[] = [];
    const chessPosition = chess.map((c) => c.position);
    for (let i = x - 1; i >= 0; i--) {
      const index = indexOf(chessPosition, [i, y]);
      if (index >= 0) {
        if (chess[index].camp !== this.camp) {
          targetRes.push(chess[index]);
        }
        break;
      }
      this.moveRange.push([i, y]);
    }
    for (let i = x + 1; i <= 8; i++) {
      const index = indexOf(chessPosition, [i, y]);
      if (index >= 0) {
        if (chess[index].camp !== this.camp) {
          targetRes.push(chess[index]);
        }
        break;
      }
      this.moveRange.push([i, y]);
    }
    for (let i = y - 1; i >= 0; i--) {
      const index = indexOf(chessPosition, [x, i]);
      if (index >= 0) {
        if (chess[index].camp !== this.camp) {
          targetRes.push(chess[index]);
        }
        break;
      }
      this.moveRange.push([x, i]);
    }
    for (let i = y + 1; i <= 9; i++) {
      const index = indexOf(chessPosition, [x, i]);
      if (index >= 0) {
        if (chess[index].camp !== this.camp) {
          targetRes.push(chess[index]);
        }
        break;
      }
      this.moveRange.push([x, i]);
    }

    return { moveRange: this.moveRange, target: targetRes };
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
  getMoveRange(): { moveRange: number[][]; stop: number[][] } {
    const res = [];
    const x = this.position[0];
    const y = this.position[1];
    for (let i = 0; i < 10; i++) {
      if (i !== y) res.push([x, i]);
    }
    for (let i = 0; i < 9; i++) {
      if (i !== x) res.push([i, y]);
    }
    this.moveRange = res;
    return { moveRange: this.moveRange, stop: this._stop };
  }
  getFilterMoveRange(
    chess: Chess[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _stopChess?: Chess[]
  ): {
    moveRange: number[][];
    target: Chess[];
  } {
    const x = this.position[0];
    const y = this.position[1];
    // 返回两个数组，一个是可移动范围，一个是攻击目标
    this.moveRange = [];
    const targetRes: Chess[] = [];
    const chessPosition = chess.map((c) => c.position);
    let overChess = false;
    for (let i = x - 1; i >= 0; i--) {
      const index = indexOf(chessPosition, [i, y]);
      if (index >= 0) {
        if (overChess && chess[index].camp !== this.camp) {
          targetRes.push(chess[index]);
          break;
        }
        overChess = true;
      }
      if (!overChess) this.moveRange.push([i, y]);
    }
    overChess = false;
    for (let i = x + 1; i <= 8; i++) {
      const index = indexOf(chessPosition, [i, y]);
      if (index >= 0) {
        if (overChess && chess[index].camp !== this.camp) {
          targetRes.push(chess[index]);
          break;
        }
        overChess = true;
      }
      if (!overChess) this.moveRange.push([i, y]);
    }
    overChess = false;
    for (let i = y - 1; i >= 0; i--) {
      const index = indexOf(chessPosition, [x, i]);
      if (index >= 0) {
        if (overChess && chess[index].camp !== this.camp) {
          targetRes.push(chess[index]);
          break;
        }
        overChess = true;
      }
      if (!overChess) this.moveRange.push([x, i]);
    }
    overChess = false;
    for (let i = y + 1; i <= 9; i++) {
      const index = indexOf(chessPosition, [x, i]);
      if (index >= 0) {
        if (overChess && chess[index].camp !== this.camp) {
          targetRes.push(chess[index]);
          break;
        }
        overChess = true;
      }
      if (!overChess) this.moveRange.push([x, i]);
    }

    return { moveRange: this.moveRange, target: targetRes };
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
  getMoveRange(): { moveRange: number[][]; stop: number[][] } {
    const res = [];
    const x = this.position[0];
    const y = this.position[1];
    if (this.camp === "red") {
      if (y <= 8) res.push([x, y + 1]);
      if (y > 4) {
        if (x !== 8) res.push([x + 1, y]);
        if (x !== 0) res.push([x - 1, y]);
      }
    } else {
      if (y >= 1) res.push([x, y - 1]);
      if (y <= 4) {
        if (x !== 8) res.push([x + 1, y]);
        if (x !== 0) res.push([x - 1, y]);
      }
    }
    this.moveRange = res;
    return { moveRange: this.moveRange, stop: this._stop };
  }
}
export { Chess, Jiang, Shi, Xiang, Ma, Ju, Pao, Bing };
