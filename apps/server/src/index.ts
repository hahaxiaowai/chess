import { createServer } from "node:http";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import type { Camp, ClientToServerEvents, ServerToClientEvents } from "@chess/game-core";
import { RoomManager } from "./room-state.js";

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: "*",
  },
});

const port = Number(process.env.PORT ?? 3001);
const roomManager = new RoomManager();
const disconnectTimers = new Map<string, { deadline: number; timer: NodeJS.Timeout }>();

app.get("/", (_req, res) => {
  res.send("<h1>Chess server is running</h1>");
});

function timerKey(roomId: string, camp: Camp) {
  return `${roomId}:${camp}`;
}

function clearRoomTimer(roomId: string, camp: Camp) {
  const key = timerKey(roomId, camp);
  const activeTimer = disconnectTimers.get(key);

  if (activeTimer) {
    clearTimeout(activeTimer.timer);
    disconnectTimers.delete(key);
  }
}

function emitRoomSnapshots(roomId: string) {
  for (const socketId of roomManager.getSocketIdsForRoom(roomId)) {
    const snapshot = roomManager.buildSnapshotForSocket(socketId);

    if (!snapshot) {
      continue;
    }

    io.sockets.sockets.get(socketId)?.emit("roomSnapshot", snapshot);
  }
}

function syncRoomTimers(roomId: string) {
  const deadlines = roomManager.getDisconnectDeadlines(roomId);

  for (const camp of ["red", "black"] as const) {
    const deadline = deadlines[camp];

    if (!deadline) {
      clearRoomTimer(roomId, camp);
      continue;
    }

    const key = timerKey(roomId, camp);
    const activeTimer = disconnectTimers.get(key);

    if (activeTimer && activeTimer.deadline === deadline) {
      continue;
    }

    clearRoomTimer(roomId, camp);

    const delay = Math.max(deadline - Date.now(), 0);
    const timer = setTimeout(() => {
      roomManager.expireSeatReservation(roomId, camp, Date.now());
      syncRoomTimers(roomId);
      emitRoomSnapshots(roomId);
    }, delay);

    disconnectTimers.set(key, {
      deadline,
      timer,
    });
  }
}

function flushRooms(roomIds: string[]) {
  for (const roomId of new Set(roomIds)) {
    syncRoomTimers(roomId);
    emitRoomSnapshots(roomId);
  }
}

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("disconnect", () => {
    console.log("disconnect");
    const result = roomManager.disconnect(socket.id, Date.now());
    flushRooms(result.changedRooms);
  });

  socket.on("joinRoom", (payload, cb) => {
    const result = roomManager.joinRoom(socket.id, payload, Date.now());

    if (result.previousRoomId && result.previousRoomId !== payload.roomId) {
      socket.leave(result.previousRoomId);
    }

    socket.join(payload.roomId);
    cb(result.ack);
    flushRooms(result.changedRooms);
  });

  socket.on("setCamp", (payload, cb) => {
    const result = roomManager.setCamp(socket.id, payload);
    cb(result.ack);
    flushRooms(result.changedRooms);
  });

  socket.on("submitMove", (payload, cb) => {
    const result = roomManager.submitMove(socket.id, payload);
    cb(result.ack);
    flushRooms(result.changedRooms);
  });

  socket.on("requestRematch", (payload, cb) => {
    const result = roomManager.requestRematch(socket.id, payload);
    cb(result.ack);
    flushRooms(result.changedRooms);
  });

  socket.on("respondRematch", (payload, cb) => {
    const result = roomManager.respondRematch(socket.id, payload);
    cb(result.ack);
    flushRooms(result.changedRooms);
  });
});

httpServer.listen(port, () => {
  console.log(`server running at http://127.0.0.1:${port}`);
});
