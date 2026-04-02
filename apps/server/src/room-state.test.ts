import test from "node:test";
import assert from "node:assert/strict";
import { createInitialGame } from "@chess/game-core";
import { DISCONNECT_GRACE_MS, RoomManager } from "./room-state.js";

test("players can join, claim unique seats, and start the game", () => {
  const manager = new RoomManager();

  const joinA = manager.joinRoom("socket-a", { roomId: "room-1", playerId: "player-a" }, 1);
  const joinB = manager.joinRoom("socket-b", { roomId: "room-1", playerId: "player-b" }, 1);

  assert.equal(joinA.ack.ok, true);
  assert.equal(joinB.ack.ok, true);

  const redSeat = manager.setCamp("socket-a", {
    roomId: "room-1",
    playerId: "player-a",
    camp: "red",
  });
  const blackSeat = manager.setCamp("socket-b", {
    roomId: "room-1",
    playerId: "player-b",
    camp: "black",
  });
  const duplicateRed = manager.setCamp("socket-b", {
    roomId: "room-1",
    playerId: "player-b",
    camp: "red",
  });

  assert.equal(redSeat.ack.ok, true);
  assert.equal(blackSeat.ack.ok, true);
  assert.equal(duplicateRed.ack.ok, false);
  assert.equal(manager.getRoomState("room-1")?.game.status, "playing");
});

test("legal moves update game state and turn order", () => {
  const manager = new RoomManager();

  manager.joinRoom("socket-a", { roomId: "room-2", playerId: "player-a" }, 1);
  manager.joinRoom("socket-b", { roomId: "room-2", playerId: "player-b" }, 1);
  manager.setCamp("socket-a", { roomId: "room-2", playerId: "player-a", camp: "red" });
  manager.setCamp("socket-b", { roomId: "room-2", playerId: "player-b", camp: "black" });

  const move = manager.submitMove("socket-a", {
    roomId: "room-2",
    playerId: "player-a",
    pieceId: "red_兵_0",
    to: [0, 4],
  });
  const illegalRepeat = manager.submitMove("socket-a", {
    roomId: "room-2",
    playerId: "player-a",
    pieceId: "red_兵_1",
    to: [2, 4],
  });

  assert.equal(move.ack.ok, true);
  assert.equal(illegalRepeat.ack.ok, false);
  assert.equal(manager.getRoomState("room-2")?.game.turn, "black");
  assert.equal(
    manager.getRoomState("room-2")?.game.pieces.find((piece) => piece.id === "red_兵_0")?.position.join(","),
    "0,4",
  );
});

test("disconnect grace keeps seats reserved and reconnect restores identity", () => {
  const manager = new RoomManager();

  manager.joinRoom("socket-a", { roomId: "room-3", playerId: "player-a" }, 10);
  manager.setCamp("socket-a", { roomId: "room-3", playerId: "player-a", camp: "red" });
  manager.disconnect("socket-a", 100);

  const roomAfterDisconnect = manager.getRoomState("room-3");
  assert.equal(roomAfterDisconnect?.seats.red.playerId, "player-a");
  assert.equal(roomAfterDisconnect?.seats.red.connected, false);
  assert.equal(roomAfterDisconnect?.seats.red.reservedUntil, 100 + DISCONNECT_GRACE_MS);

  const rejoin = manager.joinRoom("socket-b", { roomId: "room-3", playerId: "player-a" }, 120);

  assert.equal(rejoin.ack.ok, true);
  assert.equal(manager.getRoomState("room-3")?.seats.red.connected, true);
  assert.equal(manager.getRoomState("room-3")?.seats.red.reservedUntil, null);
});

test("seat reservations expire and release the seat", () => {
  const manager = new RoomManager();

  manager.joinRoom("socket-a", { roomId: "room-4", playerId: "player-a" }, 10);
  manager.setCamp("socket-a", { roomId: "room-4", playerId: "player-a", camp: "red" });
  manager.disconnect("socket-a", 100);

  const expired = manager.expireSeatReservation("room-4", "red", 100 + DISCONNECT_GRACE_MS + 1);

  assert.equal(expired, true);
  assert.equal(manager.getRoomState("room-4"), undefined);
});

test("finished games can be rematched after one player requests and the other accepts", () => {
  const manager = new RoomManager();

  manager.joinRoom("socket-a", { roomId: "room-5", playerId: "player-a" }, 1);
  manager.joinRoom("socket-b", { roomId: "room-5", playerId: "player-b" }, 1);
  manager.setCamp("socket-a", { roomId: "room-5", playerId: "player-a", camp: "red" });
  manager.setCamp("socket-b", { roomId: "room-5", playerId: "player-b", camp: "black" });

  const room = manager.getRoomState("room-5");
  assert.ok(room);
  room.game = {
    ...createInitialGame(),
    status: "finished",
    winner: "red",
  };

  const request = manager.requestRematch("socket-a", {
    roomId: "room-5",
    playerId: "player-a",
  });
  const accept = manager.respondRematch("socket-b", {
    roomId: "room-5",
    playerId: "player-b",
    accept: true,
  });

  assert.equal(request.ack.ok, true);
  assert.equal(accept.ack.ok, true);
  assert.equal(manager.getRoomState("room-5")?.game.winner, null);
  assert.equal(manager.getRoomState("room-5")?.game.turn, "red");
  assert.equal(manager.getRoomState("room-5")?.game.status, "playing");
});
