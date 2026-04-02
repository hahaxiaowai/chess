import {
  applyMove,
  createInitialGame,
  resetGame,
  serializeGame,
  type AckCode,
  type Camp,
  type JoinRoomPayload,
  type RematchSnapshot,
  type RequestRematchPayload,
  type RespondRematchPayload,
  type RoomSnapshot,
  type SeatCamp,
  type ServerAck,
  type SetCampPayload,
  type SubmitMovePayload,
} from "@chess/game-core";

export const DISCONNECT_GRACE_MS = 60_000;

type SeatState = {
  playerId: string | null;
  connected: boolean;
  reservedUntil: number | null;
};

type RoomState = {
  roomId: string;
  game: ReturnType<typeof createInitialGame>;
  seats: Record<Camp, SeatState>;
  playerSessions: Map<string, Set<string>>;
  viewerSockets: Set<string>;
  socketIds: Set<string>;
  rematch: RematchSnapshot;
  disconnectTimers: Partial<Record<Camp, number>>;
};

type Session = {
  roomId: string;
  playerId: string;
};

type RoomActionResult = {
  ack: ServerAck;
  changedRooms: string[];
  previousRoomId?: string;
};

type DisconnectResult = {
  changedRooms: string[];
};

type ValidatedSession = {
  room: RoomState;
  playerId: string;
  roomId: string;
};

function createSeatState(): SeatState {
  return {
    playerId: null,
    connected: false,
    reservedUntil: null,
  };
}

function createRoom(roomId: string): RoomState {
  return {
    roomId,
    game: createInitialGame(),
    seats: {
      red: createSeatState(),
      black: createSeatState(),
    },
    playerSessions: new Map(),
    viewerSockets: new Set(),
    socketIds: new Set(),
    rematch: {
      requester: null,
      pendingFor: null,
    },
    disconnectTimers: {},
  };
}

export class RoomManager {
  private rooms = new Map<string, RoomState>();
  private sessions = new Map<string, Session>();

  joinRoom(socketId: string, payload: JoinRoomPayload, now = Date.now()): RoomActionResult {
    const changedRooms = new Set<string>();
    const previousSession = this.sessions.get(socketId);

    if (
      previousSession &&
      (previousSession.roomId !== payload.roomId || previousSession.playerId !== payload.playerId)
    ) {
      const leaveResult = this.removeSocket(socketId, now, false);
      leaveResult.changedRooms.forEach((roomId) => changedRooms.add(roomId));
    }

    const room = this.getOrCreateRoom(payload.roomId);

    room.socketIds.add(socketId);
    this.sessions.set(socketId, {
      roomId: payload.roomId,
      playerId: payload.playerId,
    });

    const playerSessions = room.playerSessions.get(payload.playerId) ?? new Set<string>();
    playerSessions.add(socketId);
    room.playerSessions.set(payload.playerId, playerSessions);

    this.restoreSeatIfOwned(room, payload.playerId);
    this.syncViewerSockets(room);
    this.refreshGameStatus(room);

    changedRooms.add(payload.roomId);

    return {
      ack: this.success(this.buildSnapshot(payload.roomId, payload.playerId)),
      changedRooms: Array.from(changedRooms),
      previousRoomId: previousSession?.roomId,
    };
  }

  disconnect(socketId: string, now = Date.now()): DisconnectResult {
    return this.removeSocket(socketId, now, true);
  }

  setCamp(socketId: string, payload: SetCampPayload): RoomActionResult {
    const session = this.validateSession(socketId, payload);

    if ("ack" in session) {
      return {
        ack: session.ack,
        changedRooms: [],
      };
    }

    const { room, playerId, roomId } = session;
    const currentCamp = this.getSelfCamp(room, playerId);

    if (payload.camp === "viewer") {
      if (currentCamp !== "viewer") {
        this.releaseSeat(room, currentCamp);
        this.clearRematch(room);
      }
    } else {
      const targetSeat = room.seats[payload.camp];

      if (targetSeat.playerId && targetSeat.playerId !== playerId) {
        return {
          ack: this.failure(
            "SEAT_TAKEN",
            "该位置已经有人了",
            this.buildSnapshot(roomId, playerId),
          ),
          changedRooms: [],
        };
      }

      if (currentCamp !== "viewer" && currentCamp !== payload.camp) {
        this.releaseSeat(room, currentCamp);
      }

      this.assignSeat(room, payload.camp, playerId);
      this.clearRematch(room);
    }

    this.syncViewerSockets(room);
    this.refreshGameStatus(room);

    return {
      ack: this.success(this.buildSnapshot(roomId, playerId)),
      changedRooms: [roomId],
    };
  }

  submitMove(socketId: string, payload: SubmitMovePayload): RoomActionResult {
    const session = this.validateSession(socketId, payload);

    if ("ack" in session) {
      return {
        ack: session.ack,
        changedRooms: [],
      };
    }

    const { room, playerId, roomId } = session;
    const selfCamp = this.getSelfCamp(room, playerId);

    if (selfCamp === "viewer") {
      return {
        ack: this.failure("NOT_PLAYER", "观战者不能落子", this.buildSnapshot(roomId, playerId)),
        changedRooms: [],
      };
    }

    if (room.game.status === "finished") {
      return {
        ack: this.failure("GAME_FINISHED", "本局已经结束，请申请重开", this.buildSnapshot(roomId, playerId)),
        changedRooms: [],
      };
    }

    if (room.game.status !== "playing") {
      return {
        ack: this.failure("ROOM_NOT_READY", "房间未准备完成，暂时不能落子", this.buildSnapshot(roomId, playerId)),
        changedRooms: [],
      };
    }

    if (room.game.turn !== selfCamp) {
      return {
        ack: this.failure("NOT_YOUR_TURN", "当前还没轮到你", this.buildSnapshot(roomId, playerId)),
        changedRooms: [],
      };
    }

    const result = applyMove(room.game, payload.pieceId, payload.to);

    if (!result.ok) {
      return {
        ack: this.failure(result.code, result.message, this.buildSnapshot(roomId, playerId)),
        changedRooms: [],
      };
    }

    room.game = result.game;
    this.refreshGameStatus(room);

    return {
      ack: this.success(
        this.buildSnapshot(roomId, playerId),
        result.winner ? `${result.winner === "red" ? "红方" : "黑方"}获胜` : undefined,
      ),
      changedRooms: [roomId],
    };
  }

  requestRematch(socketId: string, payload: RequestRematchPayload): RoomActionResult {
    const session = this.validateSession(socketId, payload);

    if ("ack" in session) {
      return {
        ack: session.ack,
        changedRooms: [],
      };
    }

    const { room, playerId, roomId } = session;
    const selfCamp = this.getSelfCamp(room, playerId);

    if (selfCamp === "viewer") {
      return {
        ack: this.failure("NOT_PLAYER", "观战者不能申请重开", this.buildSnapshot(roomId, playerId)),
        changedRooms: [],
      };
    }

    if (room.game.status !== "finished") {
      return {
        ack: this.failure("REMATCH_NOT_AVAILABLE", "当前不能申请重开", this.buildSnapshot(roomId, playerId)),
        changedRooms: [],
      };
    }

    if (!room.seats.red.playerId || !room.seats.black.playerId) {
      return {
        ack: this.failure("REMATCH_NOT_AVAILABLE", "需要双方都在房间中才能重开", this.buildSnapshot(roomId, playerId)),
        changedRooms: [],
      };
    }

    if (room.rematch.requester) {
      return {
        ack: this.failure(
          "REMATCH_ALREADY_PENDING",
          "当前已经有一条待处理的重开请求",
          this.buildSnapshot(roomId, playerId),
        ),
        changedRooms: [],
      };
    }

    const pendingFor = selfCamp === "red" ? "black" : "red";
    room.rematch = {
      requester: selfCamp,
      pendingFor,
    };

    return {
      ack: this.success(this.buildSnapshot(roomId, playerId), "已发送重开请求"),
      changedRooms: [roomId],
    };
  }

  respondRematch(socketId: string, payload: RespondRematchPayload): RoomActionResult {
    const session = this.validateSession(socketId, payload);

    if ("ack" in session) {
      return {
        ack: session.ack,
        changedRooms: [],
      };
    }

    const { room, playerId, roomId } = session;
    const selfCamp = this.getSelfCamp(room, playerId);

    if (selfCamp === "viewer") {
      return {
        ack: this.failure("NOT_PLAYER", "观战者不能回应重开", this.buildSnapshot(roomId, playerId)),
        changedRooms: [],
      };
    }

    if (room.rematch.pendingFor !== selfCamp) {
      return {
        ack: this.failure(
          "INVALID_REMATCH_RESPONSE",
          "当前没有等待你处理的重开请求",
          this.buildSnapshot(roomId, playerId),
        ),
        changedRooms: [],
      };
    }

    if (!payload.accept) {
      this.clearRematch(room);

      return {
        ack: this.success(this.buildSnapshot(roomId, playerId), "已拒绝重开"),
        changedRooms: [roomId],
      };
    }

    room.game = resetGame();
    this.clearRematch(room);
    this.refreshGameStatus(room);

    return {
      ack: this.success(this.buildSnapshot(roomId, playerId), "已开始新一局"),
      changedRooms: [roomId],
    };
  }

  expireSeatReservation(roomId: string, camp: Camp, now = Date.now()) {
    const room = this.rooms.get(roomId);

    if (!room) {
      return false;
    }

    const seat = room.seats[camp];

    if (!seat.playerId || seat.connected || !seat.reservedUntil || seat.reservedUntil > now) {
      return false;
    }

    this.releaseSeat(room, camp);
    this.clearRematch(room);
    this.syncViewerSockets(room);
    this.refreshGameStatus(room);
    this.cleanupRoom(roomId);

    return true;
  }

  buildSnapshotForSocket(socketId: string) {
    const session = this.sessions.get(socketId);

    if (!session) {
      return null;
    }

    return this.buildSnapshot(session.roomId, session.playerId);
  }

  getSocketIdsForRoom(roomId: string) {
    const room = this.rooms.get(roomId);

    return room ? Array.from(room.socketIds) : [];
  }

  getDisconnectDeadlines(roomId: string) {
    const room = this.rooms.get(roomId);

    return {
      red: room?.disconnectTimers.red ?? null,
      black: room?.disconnectTimers.black ?? null,
    };
  }

  getRoomState(roomId: string) {
    return this.rooms.get(roomId);
  }

  private getOrCreateRoom(roomId: string) {
    const existingRoom = this.rooms.get(roomId);

    if (existingRoom) {
      return existingRoom;
    }

    const room = createRoom(roomId);
    this.rooms.set(roomId, room);
    return room;
  }

  private removeSocket(socketId: string, now: number, preserveSeat: boolean): DisconnectResult {
    const session = this.sessions.get(socketId);

    if (!session) {
      return { changedRooms: [] };
    }

    const room = this.rooms.get(session.roomId);
    this.sessions.delete(socketId);

    if (!room) {
      return { changedRooms: [] };
    }

    room.socketIds.delete(socketId);
    room.viewerSockets.delete(socketId);

    const playerSockets = room.playerSessions.get(session.playerId);
    if (playerSockets) {
      playerSockets.delete(socketId);
      if (playerSockets.size === 0) {
        room.playerSessions.delete(session.playerId);
      }
    }

    const selfCamp = this.getSelfCamp(room, session.playerId);
    if (selfCamp !== "viewer") {
      const seat = room.seats[selfCamp];
      const stillConnected = this.hasActivePlayerSockets(room, session.playerId);

      if (stillConnected) {
        seat.connected = true;
        seat.reservedUntil = null;
        delete room.disconnectTimers[selfCamp];
      } else if (preserveSeat) {
        seat.connected = false;
        seat.reservedUntil = now + DISCONNECT_GRACE_MS;
        room.disconnectTimers[selfCamp] = seat.reservedUntil;
      } else {
        this.releaseSeat(room, selfCamp);
        this.clearRematch(room);
      }
    }

    this.syncViewerSockets(room);
    this.refreshGameStatus(room);
    this.cleanupRoom(session.roomId);

    return {
      changedRooms: [session.roomId],
    };
  }

  private validateSession(
    socketId: string,
    payload:
      | JoinRoomPayload
      | SetCampPayload
      | SubmitMovePayload
      | RequestRematchPayload
      | RespondRematchPayload,
  ): ValidatedSession | { ack: ServerAck } {
    const session = this.sessions.get(socketId);

    if (!session || session.roomId !== payload.roomId || session.playerId !== payload.playerId) {
      return {
        ack: this.failure("INVALID_SESSION", "当前连接身份已失效，请重新加入房间"),
      };
    }

    const room = this.rooms.get(payload.roomId);

    if (!room) {
      return {
        ack: this.failure("ROOM_NOT_FOUND", "房间不存在或已经被释放"),
      };
    }

    return {
      room,
      playerId: session.playerId,
      roomId: session.roomId,
    };
  }

  private success(snapshot: RoomSnapshot, message?: string): ServerAck {
    return {
      ok: true,
      snapshot,
      message,
    };
  }

  private failure(
    code: AckCode,
    message: string,
    snapshot?: RoomSnapshot,
  ): ServerAck {
    return {
      ok: false,
      code,
      message,
      snapshot,
    };
  }

  private buildSnapshot(roomId: string, playerId: string): RoomSnapshot {
    const room = this.rooms.get(roomId);

    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    return {
      roomId,
      selfCamp: this.getSelfCamp(room, playerId),
      game: serializeGame(room.game),
      seats: {
        red: { ...room.seats.red },
        black: { ...room.seats.black },
      },
      rematch: {
        requester: room.rematch.requester,
        pendingFor: room.rematch.pendingFor,
      },
      disconnectGraceMs: DISCONNECT_GRACE_MS,
    };
  }

  private getSelfCamp(room: RoomState, playerId: string): SeatCamp {
    if (room.seats.red.playerId === playerId) {
      return "red";
    }

    if (room.seats.black.playerId === playerId) {
      return "black";
    }

    return "viewer";
  }

  private assignSeat(room: RoomState, camp: Camp, playerId: string) {
    room.seats[camp] = {
      playerId,
      connected: this.hasActivePlayerSockets(room, playerId),
      reservedUntil: null,
    };
    delete room.disconnectTimers[camp];
  }

  private releaseSeat(room: RoomState, camp: Camp) {
    room.seats[camp] = createSeatState();
    delete room.disconnectTimers[camp];
  }

  private clearRematch(room: RoomState) {
    room.rematch = {
      requester: null,
      pendingFor: null,
    };
  }

  private hasActivePlayerSockets(room: RoomState, playerId: string) {
    return (room.playerSessions.get(playerId)?.size ?? 0) > 0;
  }

  private restoreSeatIfOwned(room: RoomState, playerId: string) {
    for (const camp of ["red", "black"] as const) {
      const seat = room.seats[camp];

      if (seat.playerId === playerId) {
        seat.connected = this.hasActivePlayerSockets(room, playerId);
        seat.reservedUntil = null;
        delete room.disconnectTimers[camp];
      }
    }
  }

  private syncViewerSockets(room: RoomState) {
    room.viewerSockets.clear();

    for (const socketId of room.socketIds) {
      const session = this.sessions.get(socketId);

      if (!session) {
        continue;
      }

      if (this.getSelfCamp(room, session.playerId) === "viewer") {
        room.viewerSockets.add(socketId);
      }
    }
  }

  private refreshGameStatus(room: RoomState) {
    if (room.game.winner) {
      room.game.status = "finished";
      return;
    }

    const ready =
      !!room.seats.red.playerId &&
      !!room.seats.black.playerId &&
      room.seats.red.connected &&
      room.seats.black.connected;

    room.game.status = ready ? "playing" : "waiting";
  }

  private cleanupRoom(roomId: string) {
    const room = this.rooms.get(roomId);

    if (!room) {
      return;
    }

    const hasSeats = !!room.seats.red.playerId || !!room.seats.black.playerId;

    if (room.socketIds.size === 0 && !hasSeats) {
      this.rooms.delete(roomId);
    }
  }
}
