import Draw from "./Draw";
import { Chess, General } from "./Chess";
interface BoardOption {
  id: string;
  chessOption: object;
}
class Board {
  draw: Draw;
  redChesses: Chess[];
  blackChesses: Chess[];
  constructor(option: BoardOption) {
    this.draw = new Draw(option.id);
    this.initBoard(option);
    this.redChesses = [];
    this.blackChesses = [];
    this.initChess(option.chessOption);
  }
  initBoard(option: BoardOption) {
    this.draw.drawBoard();
  }
  initChess(option: object) {
    this.redChesses.push(new General("帅", "red", this.draw));
  }
  judgeRule() {}
}

export default Board;
