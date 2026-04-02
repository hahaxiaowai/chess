import test from "node:test";
import assert from "node:assert/strict";
import {
  applyMove,
  createInitialGame,
  getLegalMoves,
  getPieceById,
  getWinner,
  type GameState,
} from "./index.js";

test("createInitialGame creates the full initial layout", () => {
  const game = createInitialGame();

  assert.equal(game.pieces.length, 32);
  assert.equal(getPieceById(game, "red_帥_0")?.position.join(","), "4,0");
  assert.equal(getPieceById(game, "black_将_0")?.position.join(","), "4,9");
  assert.equal(game.turn, "red");
  assert.equal(game.status, "waiting");
});

test("horse moves are blocked by leg pieces", () => {
  const game = createInitialGame();
  game.status = "playing";

  const moves = getLegalMoves(game, "red_馬_0").map((position) => position.join(","));

  assert.deepEqual(moves.sort(), ["0,2", "2,2"]);
});

test("cannon captures only after exactly one screen", () => {
  const game: GameState = {
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

test("applyMove captures pieces, flips turn, and marks winner", () => {
  const game: GameState = {
    status: "playing",
    turn: "red",
    winner: null,
    pieces: [
      {
        id: "red_車_0",
        role: "rook",
        label: "車",
        camp: "red",
        index: 0,
        position: [4, 8],
        alive: true,
      },
      {
        id: "red_帥_0",
        role: "general",
        label: "帥",
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

  const result = applyMove(game, "red_車_0", [4, 9]);

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
