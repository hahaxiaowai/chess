import test from "node:test";
import assert from "node:assert/strict";
import {
  applyChineseChessMove,
  applyGobangMove,
  createInitialChineseChessGame,
  createInitialGame,
  createInitialGobangGame,
  getGobangWinner,
  getLegalMoves,
  getPieceById,
  getWinner,
  serializeGame,
  type ChineseChessGameState,
  type GobangGameState,
} from "./index.js";

test("createInitialGame creates the full chinese chess layout", () => {
  const game = createInitialChineseChessGame();

  assert.equal(game.gameType, "chinese-chess");
  assert.equal(game.pieces.length, 32);
  assert.equal(getPieceById(game, "red_帅_0")?.position.join(","), "4,0");
  assert.equal(getPieceById(game, "black_将_0")?.position.join(","), "4,9");
  assert.equal(game.turn, "red");
  assert.equal(game.status, "waiting");
});

test("horse moves are blocked by leg pieces", () => {
  const game = createInitialChineseChessGame();
  game.status = "playing";

  const moves = getLegalMoves(game, "red_马_0").map((position) => position.join(","));

  assert.deepEqual(moves.sort(), ["0,2", "2,2"]);
});

test("cannon captures only after exactly one screen", () => {
  const game: ChineseChessGameState = {
    gameType: "chinese-chess",
    status: "playing",
    turn: "red",
    winner: null,
    pieces: [
      {
        id: "red_炮_0",
        role: "cannon",
        label: "炮",
        camp: "red",
        index: 0,
        position: [1, 2],
        alive: true,
      },
      {
        id: "red_screen",
        role: "soldier",
        label: "兵",
        camp: "red",
        index: 9,
        position: [1, 4],
        alive: true,
      },
      {
        id: "black_target",
        role: "soldier",
        label: "卒",
        camp: "black",
        index: 9,
        position: [1, 7],
        alive: true,
      },
    ],
  };

  const moves = getLegalMoves(game, "red_炮_0").map((position) => position.join(","));

  assert.ok(moves.includes("1,7"));
  assert.ok(!moves.includes("1,4"));
});

test("applyChineseChessMove captures pieces, flips turn, and marks winner", () => {
  const game: ChineseChessGameState = {
    gameType: "chinese-chess",
    status: "playing",
    turn: "red",
    winner: null,
    pieces: [
      {
        id: "red_车_0",
        role: "rook",
        label: "车",
        camp: "red",
        index: 0,
        position: [4, 8],
        alive: true,
      },
      {
        id: "red_帅_0",
        role: "general",
        label: "帅",
        camp: "red",
        index: 0,
        position: [4, 0],
        alive: true,
      },
      {
        id: "black_将_0",
        role: "general",
        label: "将",
        camp: "black",
        index: 0,
        position: [4, 9],
        alive: true,
      },
    ],
  };

  const result = applyChineseChessMove(game, "red_车_0", [4, 9]);

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.capturedPieceId, "black_将_0");
  assert.equal(result.game.turn, "black");
  assert.equal(result.game.status, "finished");
  assert.equal(result.game.winner, "red");
  assert.equal(getWinner(result.game), "red");
});

test("createInitialGobangGame initializes an empty 15x15 board", () => {
  const game = createInitialGobangGame();

  assert.equal(game.gameType, "gobang");
  assert.equal(game.moves.length, 0);
  assert.equal(game.turn, "black");
  assert.equal(game.size, 15);
  assert.equal(game.status, "waiting");
});

test("applyGobangMove alternates turns and rejects occupied cells", () => {
  const game = createInitialGobangGame();
  game.status = "playing";

  const firstMove = applyGobangMove(game, [7, 7]);
  assert.equal(firstMove.ok, true);

  if (!firstMove.ok) {
    return;
  }

  assert.equal(firstMove.game.turn, "red");
  assert.equal(firstMove.game.moves.length, 1);

  const occupiedMove = applyGobangMove(firstMove.game, [7, 7]);
  assert.equal(occupiedMove.ok, false);
  if (!occupiedMove.ok) {
    assert.equal(occupiedMove.code, "CELL_OCCUPIED");
  }
});

test("gobang detects five in a row horizontally", () => {
  const game: GobangGameState = {
    gameType: "gobang",
    status: "playing",
    turn: "red",
    winner: null,
    size: 15,
    moves: [
      { moveNumber: 1, camp: "red", position: [3, 7] },
      { moveNumber: 2, camp: "black", position: [0, 0] },
      { moveNumber: 3, camp: "red", position: [4, 7] },
      { moveNumber: 4, camp: "black", position: [1, 0] },
      { moveNumber: 5, camp: "red", position: [5, 7] },
      { moveNumber: 6, camp: "black", position: [2, 0] },
      { moveNumber: 7, camp: "red", position: [6, 7] },
      { moveNumber: 8, camp: "black", position: [3, 0] },
    ],
  };

  const result = applyGobangMove(game, [7, 7]);
  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.game.winner, "red");
  assert.equal(result.game.status, "finished");
  assert.equal(getGobangWinner(result.game), "red");
});

test("gobang can serialize union game states", () => {
  const chineseChess = serializeGame(createInitialGame("chinese-chess"));
  const gobang = serializeGame(createInitialGame("gobang"));

  assert.equal(chineseChess.gameType, "chinese-chess");
  assert.equal(gobang.gameType, "gobang");
  assert.ok("pieces" in chineseChess);
  assert.ok("moves" in gobang);
});
