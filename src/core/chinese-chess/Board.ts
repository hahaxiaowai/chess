import Draw from "./Draw";
import { Bing, Chess, Jiang, Ju, Ma, Pao, Shi, Xiang } from "./Chess";
interface BoardOption {
  id: string;
  chessOption: object;
}
class Board {
  draw: Draw;
  chessArray: Chess[];
  chessMap: Map<string, Chess>;
  activeChess?: Chess;
  constructor(option: BoardOption) {
    this.draw = new Draw(option.id);
    this.initBoard(option);
    this.chessArray = [];
    this.chessMap = new Map();
    this.initChess(option.chessOption);
    this.initEvent();
  }
  initBoard(option: BoardOption) {
    this.draw.drawBoard();
  }
  initChess(option: object) {
    // 帥，将
    this.chessArray.push(
      new Jiang({
        type: "帥",
        camp: "red",
        draw: this.draw,
        index: 0,
      }),
      new Jiang({
        type: "将",
        camp: "black",
        draw: this.draw,
        index: 0,
      })
    );
    // 仕，士
    this.chessArray.push(
      new Shi({
        type: "仕",
        camp: "red",
        draw: this.draw,
        index: 0,
      }),
      new Shi({
        type: "士",
        camp: "black",
        draw: this.draw,
        index: 0,
      }),
      new Shi({
        type: "仕",
        camp: "red",
        draw: this.draw,
        index: 1,
      }),
      new Shi({
        type: "士",
        camp: "black",
        draw: this.draw,
        index: 1,
      })
    );
    // 相，象
    this.chessArray.push(
      new Xiang({
        type: "相",
        camp: "red",
        draw: this.draw,
        index: 0,
      }),
      new Xiang({
        type: "象",
        camp: "black",
        draw: this.draw,
        index: 0,
      }),
      new Xiang({
        type: "相",
        camp: "red",
        draw: this.draw,
        index: 1,
      }),
      new Xiang({
        type: "象",
        camp: "black",
        draw: this.draw,
        index: 1,
      })
    );
    // 馬
    this.chessArray.push(
      new Ma({
        type: "馬",
        camp: "red",
        draw: this.draw,
        index: 0,
      }),
      new Ma({
        type: "馬",
        camp: "black",
        draw: this.draw,
        index: 0,
      }),
      new Ma({
        type: "馬",
        camp: "red",
        draw: this.draw,
        index: 1,
      }),
      new Ma({
        type: "馬",
        camp: "black",
        draw: this.draw,
        index: 1,
      })
    );
    // 車
    this.chessArray.push(
      new Ju({
        type: "車",
        camp: "red",
        draw: this.draw,
        index: 0,
      }),
      new Ju({
        type: "車",
        camp: "black",
        draw: this.draw,
        index: 0,
      }),
      new Ju({
        type: "車",
        camp: "red",
        draw: this.draw,
        index: 1,
      }),
      new Ju({
        type: "車",
        camp: "black",
        draw: this.draw,
        index: 1,
      })
    );
    // 炮
    this.chessArray.push(
      new Pao({
        type: "炮",
        camp: "red",
        draw: this.draw,
        index: 0,
      }),
      new Pao({
        type: "炮",
        camp: "black",
        draw: this.draw,
        index: 0,
      }),
      new Pao({
        type: "炮",
        camp: "red",
        draw: this.draw,
        index: 1,
      }),
      new Pao({
        type: "炮",
        camp: "black",
        draw: this.draw,
        index: 1,
      })
    );
    // 兵
    for (let i = 0; i < 5; i++) {
      this.chessArray.push(
        new Bing({
          type: "兵",
          camp: "red",
          draw: this.draw,
          index: i,
        }),
        new Bing({
          type: "卒",
          camp: "black",
          draw: this.draw,
          index: i,
        })
      );
    }
    // Map
    for (let i = 0; i < this.chessArray.length; i++) {
      this.chessMap.set(this.chessArray[i].name, this.chessArray[i]);
    }
  }
  initEvent() {
    // 这里有点绕，仅是为了让draw不参与业务逻辑，仅实现绘制逻辑
    // 可以考虑把draw.initEvent提到Board里
    const cb = (obj: string | Chess, position?: [number, number]) => {
      if (obj === "range" && this.activeChess && position) {
        this.move(this.activeChess, position);
      } else {
        this.showMoveRange(obj);
      }
    };
    this.draw.initEvent(cb);
  }
  move(chess: string | Chess, position: [number, number]) {
    if (typeof chess === "string") {
      if (this.chessMap.has(chess)) {
        this.chessMap.get(chess)?.move(position);
      }
    } else {
      chess.move(position);
    }
    this.draw.clearRange();
  }
  showMoveRange(chess: string | Chess) {
    console.log(chess);
    let c: Chess;
    let res: number[][] = [];

    if (typeof chess === "string") {
      if (this.chessMap.has(chess)) {
        c = this.chessMap.get(chess)!;
      } else {
        return;
      }
    } else {
      c = chess;
    }
    res = c.getMoveRange();
    const { moveRange, target } = c.getFilterMoveRange(
      res,
      this._getChessByPosition(res)
    );
    res = moveRange;
    this.activeChess = c;
    this.draw.showRangeAndTarget(res, target);
  }
  _getChessByPosition(position: number[][]) {
    const strPosition = position.map((p) => p.toString());
    const res: Chess[] = [];
    for (let i = 0; i < this.chessArray.length; i++) {
      const strP = this.chessArray[i].position.toString();
      if (strPosition.includes(strP)) {
        res.push(this.chessArray[i]);
      }
    }
    return res;
  }
}

export default Board;
