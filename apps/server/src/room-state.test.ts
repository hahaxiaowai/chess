import test from "node:test";
import assert from "node:assert/strict";
import { createInitialChineseChessGame, createInitialGobangGame } from "@chess/game-core";
import { DISCONNECT_GRACE_MS, RoomManager } from "./room-state.js";

test("players can join, claim unique seats, and start a chinese chess game", () => {
  const manager = new RoomManager();

  const joinA = manager.joinRoom("socket-a", {
    roomId: "room-1",
    playerId: "player-a",
    gameType: "chinese-chess",
  }, 1);
  const joinB = manager.joinRoom("socket-b", {
    roomId: "room-1",
    playerId: "player-b",
    gameType: "chinese-chess",
  }, 1);

  assert.equal(joinA.ack.ok, true);
  assert.equal(joinB.ack.ok, true);

  const redSeat = manager.setCamp("socket-a", {
    roomId: "room-1",
    playerId: "player-a",
    gameType: "chinese-chess",
    camp: "red",
  });
  const blackSeat = manager.setCamp("socket-b", {
    roomId: "room-1",
    playerId: "player-b",
    gameType: "chinese-chess",
    camp: "black",
  });
  const duplicateRed = manager.setCamp("socket-b", {
    roomId: "room-1",
    playerId: "player-b",
    gameType: "chinese-chess",
    camp: "red",
  });

  assert.equal(redSeat.ack.ok, true);
  assert.equal(blackSeat.ack.ok, true);
  assert.equal(duplicateRed.ack.ok, false);
  assert.equal(manager.getRoomState("room-1")?.game.status, "playing");
});

test("joining an existing room with another game type is rejected", () => {
  const manager = new RoomManager();

  manager.joinRoom("socket-a", {
    roomId: "room-mixed",
    playerId: "player-a",
    gameType: "chinese-chess",
  }, 1);

  const joinMismatch = manager.joinRoom("socket-b", {
    roomId: "room-mixed",
    playerId: "player-b",
    gameType: "gobang",
  }, 1);

  assert.equal(joinMismatch.ack.ok, false);
  if (!joinMismatch.ack.ok) {
    assert.equal(joinMismatch.ack.code, "ROOM_GAME_TYPE_MISMATCH");
  }
});

test("legal chinese chess moves update game state and turn order", () => {
  const manager = new RoomManager();

  manager.joinRoom("socket-a", { roomId: "room-2", playerId: "player-a", gameType: "chinese-chess" }, 1);
  manager.joinRoom("socket-b", { roomId: "room-2", playerId: "player-b", gameType: "chinese-chess" }, 1);
  manager.setCamp("socket-a", { roomId: "room-2", playerId: "player-a", gameType: "chinese-chess", camp: "red" });
  manager.setCamp("socket-b", { roomId: "room-2", playerId: "player-b", gameType: "chinese-chess", camp: "black" });

  const move = manager.submitMove("socket-a", {
    roomId: "room-2",
    playerId: "player-a",
    gameType: "chinese-chess",
    pieceId: "red_兵_0",
    to: [0, 4],
  });
  const illegalRepeat = manager.submitMove("socket-a", {
    roomId: "room-2",
    playerId: "player-a",
    gameType: "chinese-chess",
    pieceId: "red_兵_1",
    to: [2, 4],
  });

  assert.equal(move.ack.ok, true);
  assert.equal(illegalRepeat.ack.ok, false);
  const room = manager.getRoomState("room-2");
  assert.equal(room?.game.turn, "black");
  const piecePosition =
    room?.game.gameType === "chinese-chess"
      ? room.game.pieces.find((piece) => piece.id === "red_兵_0")?.position.join(",")
      : null;
  assert.equal(piecePosition, "0,4");
});

test("gobang moves use gobang rules only", () => {
  const manager = new RoomManager();

  manager.joinRoom("socket-a", { roomId: "room-gobang", playerId: "player-a", gameType: "gobang" }, 1);
  manager.joinRoom("socket-b", { roomId: "room-gobang", playerId: "player-b", gameType: "gobang" }, 1);
  manager.setCamp("socket-a", { roomId: "room-gobang", playerId: "player-a", gameType: "gobang", camp: "red" });
  manager.setCamp("socket-b", { roomId: "room-gobang", playerId: "player-b", gameType: "gobang", camp: "black" });

  const move = manager.submitMove("socket-b", {
    roomId: "room-gobang",
    playerId: "player-b",
    gameType: "gobang",
    position: [7, 7],
  });
  const duplicate = manager.submitMove("socket-a", {
    roomId: "room-gobang",
    playerId: "player-a",
    gameType: "gobang",
    position: [7, 7],
  });

  assert.equal(move.ack.ok, true);
  assert.equal(duplicate.ack.ok, false);
  if (!duplicate.ack.ok) {
    assert.equal(duplicate.ack.code, "CELL_OCCUPIED");
  }
});

test("disconnect grace keeps seats reserved and reconnect restores identity", () => {
  const manager = new RoomManager();

  manager.joinRoom("socket-a", { roomId: "room-3", playerId: "player-a", gameType: "chinese-chess" }, 10);
  manager.setCamp("socket-a", { roomId: "room-3", playerId: "player-a", gameType: "chinese-chess", camp: "red" });
  manager.disconnect("socket-a", 100);

  const roomAfterDisconnect = manager.getRoomState("room-3");
  assert.equal(roomAfterDisconnect?.seats.red.playerId, "player-a");
  assert.equal(roomAfterDisconnect?.seats.red.connected, false);
  assert.equal(roomAfterDisconnect?.seats.red.reservedUntil, 100 + DISCONNECT_GRACE_MS);

  const rejoin = manager.joinRoom("socket-b", { roomId: "room-3", playerId: "player-a", gameType: "chinese-chess" }, 120);

  assert.equal(rejoin.ack.ok, true);
  assert.equal(manager.getRoomState("room-3")?.seats.red.connected, true);
  assert.equal(manager.getRoomState("room-3")?.seats.red.reservedUntil, null);
});

test("seat reservations expire and release the seat", () => {
  const manager = new RoomManager();

  manager.joinRoom("socket-a", { roomId: "room-4", playerId: "player-a", gameType: "chinese-chess" }, 10);
  manager.setCamp("socket-a", { roomId: "room-4", playerId: "player-a", gameType: "chinese-chess", camp: "red" });
  manager.disconnect("socket-a", 100);

  const expired = manager.expireSeatReservation("room-4", "red", 100 + DISCONNECT_GRACE_MS + 1);

  assert.equal(expired, true);
  assert.equal(manager.getRoomState("room-4"), undefined);
});

test("finished games can be rematched for the room game type", () => {
  const manager = new RoomManager();

  manager.joinRoom("socket-a", { roomId: "room-5", playerId: "player-a", gameType: "gobang" }, 1);
  manager.joinRoom("socket-b", { roomId: "room-5", playerId: "player-b", gameType: "gobang" }, 1);
  manager.setCamp("socket-a", { roomId: "room-5", playerId: "player-a", gameType: "gobang", camp: "red" });
  manager.setCamp("socket-b", { roomId: "room-5", playerId: "player-b", gameType: "gobang", camp: "black" });

  const room = manager.getRoomState("room-5");
  assert.ok(room);
  room.game = {
    ...createInitialGobangGame(),
    status: "finished",
    winner: "red",
  };

  const request = manager.requestRematch("socket-a", {
    roomId: "room-5",
    playerId: "player-a",
    gameType: "gobang",
  });
  const accept = manager.respondRematch("socket-b", {
    roomId: "room-5",
    playerId: "player-b",
    gameType: "gobang",
    accept: true,
  });

  assert.equal(request.ack.ok, true);
  assert.equal(accept.ack.ok, true);
  assert.equal(manager.getRoomState("room-5")?.game.winner, null);
  assert.equal(manager.getRoomState("room-5")?.game.turn, "black");
  assert.equal(manager.getRoomState("room-5")?.game.status, "playing");
});

test("room snapshots carry the room game type", () => {
  const manager = new RoomManager();
  const join = manager.joinRoom("socket-a", {
    roomId: "room-6",
    playerId: "player-a",
    gameType: "chinese-chess",
  }, 1);

  assert.equal(join.ack.ok, true);
  if (join.ack.ok) {
    assert.equal(join.ack.snapshot?.gameType, "chinese-chess");
  }

  const room = manager.getRoomState("room-6");
  assert.equal(room?.game.gameType, createInitialChineseChessGame().gameType);
});

