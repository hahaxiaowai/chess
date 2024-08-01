import Board from "./Board";
import { io, Socket } from "socket.io-client";
import { ref, Ref } from "vue";
import { Chess } from "./Chess";
class Gamer {
  roomId: string;
  stats: Ref<"disconnect" | "ready" | "run">;
  camp?: "red" | "black" | "viewer";
  socket: Socket;
  board?: Board;
  constructor(roomId: string) {
    this.roomId = roomId;
    this.socket = io(import.meta.env.VITE_WS);
    this.stats = ref("disconnect");
    this.socket.on("connect", () => {
      this.joinRoom(this.roomId);
      this.socket.on("move", (res) => {
        this.board?.gamerMove(res.type, res.position, res.chessName);
      });
    });
  }
  joinRoom(roomId: string) {
    this.socket.emit("joinRoom", roomId, (res: boolean) => {
      console.log(res);
      if (res) {
        this.stats.value = "ready";
      }
    });
  }
  setCamp(camp: "red" | "black" | "viewer"): Promise<boolean> {
    return new Promise((resolve) => {
      this.socket.emit("setCamp", this.roomId, camp, (res: boolean) => {
        if (res) {
          this.camp = camp;
          this.board?.setGamerRuler(this.camp);
          this.stats.value = "run";
        }
        resolve(res);
      });
    });
  }
  setBoard(board: Board) {
    this.board = board;
    this.board.asyncMove = this.move.bind(this);
  }
  move(type: string, position?: [number, number], chessName?: string) {
    this.socket.emit("move", type, position, chessName, this.roomId);
  }
}
export default Gamer;
