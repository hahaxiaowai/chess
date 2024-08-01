import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
const app = express();
app.use(cors());
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
app.get("/", (req, res) => {
  res.send("<h1>Hello world</h1>");
});
const rooms = new Map();
const users = new Map();
io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", (socket) => {
    console.log('disconnect')
    const { roomId } = users.get(socket.id) || {};
    const roomData = rooms.get(roomId);
    if (!roomData) return
    delete roomData[socket.id];
    rooms.set(roomId, roomData);
    users.delete(socket.id);
  });
  socket.on("joinRoom", (roomId, cb) => {
    const flag = createOrJoinRoom(roomId, socket);
    cb(flag);
  });
  socket.on("setCamp", (roomId, camp, cb) => {
    const flag = setCamp(roomId, camp, socket.id);
    cb(flag);
  });
  socket.on('move', (type, position, chessName, roomId) => {
    const room = rooms.get(roomId)
    Object.keys(room).forEach(key => {
      const s = users.get(key)
      if (s) s.socket.emit('move', { type, position, chessName })
    })
  })
});
const setCamp = (roomId, camp, userId) => {
  console.log(roomId, rooms)

  if (rooms.get(roomId)) {
    const roomData = rooms.get(roomId);
    roomData[userId] = camp;
    rooms.set(roomId, roomData);
  } else {
    return false
  }
  return true;
}
const createOrJoinRoom = (roomId, socket) => {
  console.log(roomId)
  if (rooms.get(roomId)) {
    const roomData = rooms.get(roomId);
    roomData[socket.id] = "visit";
    rooms.set(roomId, {});
  } else {
    rooms.set(roomId, {
      [socket.id]: "visit",
    });
  }
  users.set(socket.id, { roomId, socket });
  return true;
};
server.listen(3001, () => {
  console.log("server running at http://localhost:3001");
});
