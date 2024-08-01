import Draw from "./Draw";
import { Bing, Chess, Jiang, Ju, Ma, Pao, Shi, Xiang } from "./Chess";
import { includes } from "./Common";
import { Ref } from "vue";
import Gamer from "./Gamer";
interface BoardOption {
  id: string;
  chessOption?: object;
  model: "local" | "online";
  message: Ref<string>;
}
class Board {
  draw: Draw;
  chessArray: Chess[];
  chessMap: Map<string, Chess>;
  activeChess?: Chess;
  activeGamer: "red" | "black";
  model: "local" | "online";
  message: Ref<string>;
  curGamer?: "red" | "black" | "viewer";
  asyncMove?: Function;
  constructor(option: BoardOption) {
    this.draw = new Draw(option.id);
    this.initBoard(option);
    this.chessArray = [];
    this.chessMap = new Map();
    this.model = option.model;
    this.activeGamer = "red";
    this.message = option.message;
    this.initChess(option?.chessOption);
    this.initEvent();
  }

  initBoard(option?: BoardOption) {
    this.draw.drawBoard();
  }
  initChess(option?: object) {
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
    const cb = (
      type: string,
      position?: [number, number],
      chessName?: string
    ) => {
      if (this.curGamer !== this.activeGamer) return;
      const flag = type === "range" && this.activeChess && position;
      const flag2 = chessName && this.activeChess && position;
      if (flag || flag2) {
        if (this.asyncMove) this.asyncMove(type, position, chessName);
      } else {
        this.showRangeAndTarget(type);
      }
    };
    this.draw.initEvent(cb);
  }
  setGamerRuler(camp: "red" | "black" | "viewer") {
    this.curGamer = camp;
  }
  gamerMove(type: string, position?: [number, number], chessName?: string) {
    if (type === "range" && this.activeChess && position) {
      this.move(this.activeChess, position);
    } else if (chessName && this.activeChess && position) {
      this.chessMap.get(chessName)?.beKilled();
      this.isWin();
      this.move(this.activeChess, position);
    } else {
      this.showRangeAndTarget(type);
    }
  }
  move(chess: string | Chess, position: [number, number]) {
    if (typeof chess === "string") {
      if (this.chessMap.has(chess)) {
        this.chessMap.get(chess)?.move(position);
      }
    } else {
      chess.move(position);
    }
    // if (this.model === "online" && this.asyncMove) {
    //   this.asyncMove(typeof chess === "string" ? chess : chess.name, position);
    // }
    this.activeGamer = this.activeGamer === "red" ? "black" : "red";
    this.draw.clearRange();
  }
  showRangeAndTarget(chess: string | Chess) {
    let c: Chess;
    if (typeof chess === "string") {
      if (this.chessMap.has(chess)) {
        c = this.chessMap.get(chess)!;
      } else {
        return;
      }
    } else {
      c = chess;
    }
    const { moveRange, stop } = c.getMoveRange();
    const chesses = this._getChessByPosition(moveRange, stop);
    const filterMoveRange = c.getFilterMoveRange(
      chesses.chess,
      chesses.stopChess
    );
    if (c.camp !== this.activeGamer) return;
    this.activeChess = c;
    this.draw.showRangeAndTarget(
      filterMoveRange.moveRange,
      filterMoveRange.target
    );
  }
  _getChessByPosition(position: number[][], stop: number[][]) {
    const res: Chess[] = [];
    const stopRes: Chess[] = [];
    for (let i = 0; i < this.chessArray.length; i++) {
      if (
        this.chessArray[i].alive &&
        includes(position, this.chessArray[i].position)
      ) {
        res.push(this.chessArray[i]);
      }
      if (
        this.chessArray[i].alive &&
        includes(stop, this.chessArray[i].position)
      ) {
        stopRes.push(this.chessArray[i]);
      }
    }
    return { chess: res, stopChess: stopRes };
  }
  isWin() {
    const jiang = this.chessMap.get("black_将_0");
    if (jiang && !jiang.alive) {
      console.log("红方赢");
      this.message.value = "红方赢";
    }
    const jiang2 = this.chessMap.get("red_帥_0");
    if (jiang2 && !jiang2.alive) {
      console.log("黑方赢");
      this.message.value = "黑方赢";
    }
  }
}

export default Board;
