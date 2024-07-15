import Draw from "./Draw";
import { Bing, Chess, Jiang, Ju, Ma, Pao, Shi, Xiang } from "./Chess";
interface BoardOption {
  id: string;
  chessOption: object;
}
class Board {
  draw: Draw;
  chesses: Chess[];
  constructor(option: BoardOption) {
    this.draw = new Draw(option.id);
    this.initBoard(option);
    this.chesses = [];
    this.initChess(option.chessOption);
  }
  initBoard(option: BoardOption) {
    this.draw.drawBoard();
  }
  initChess(option: object) {
    // 帥，将
    this.chesses.push(
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
    this.chesses.push(
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
    this.chesses.push(
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
    this.chesses.push(
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
    this.chesses.push(
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
    this.chesses.push(
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
      this.chesses.push(
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
  }
  judgeRule() {}
}

export default Board;
