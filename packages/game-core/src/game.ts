export type Camp = "red" | "black";
export type SeatCamp = Camp | "viewer";
export type Position = [number, number];
export type GameStatus = "waiting" | "playing" | "finished";
export type PieceRole =
  | "general"
  | "advisor"
  | "elephant"
  | "horse"
  | "rook"
  | "cannon"
  | "soldier";
export type PieceLabel =
  | "帥"
  | "将"
  | "仕"
  | "士"
  | "相"
  | "象"
  | "馬"
  | "車"
  | "炮"
  | "兵"
  | "卒";

export interface PieceState {
  id: string;
  role: PieceRole;
  label: PieceLabel;
  camp: Camp;
  index: number;
  position: Position;
  alive: boolean;
}

export interface GameState {
  status: GameStatus;
  turn: Camp;
  winner: Camp | null;
  pieces: PieceState[];
}

export type SerializedGameState = GameState;

export type ApplyMoveResult =
  | {
      ok: true;
      game: GameState;
      capturedPieceId: string | null;
      winner: Camp | null;
    }
  | {
      ok: false;
      code: "GAME_NOT_ACTIVE" | "NOT_YOUR_TURN" | "PIECE_NOT_FOUND" | "ILLEGAL_MOVE";
      message: string;
    };

const BOARD_WIDTH = 9;
const BOARD_HEIGHT = 10;

const INITIAL_PIECES: Array<Omit<PieceState, "alive" | "position"> & { position: Position }> = [
  {
    id: "red_帥_0",
    role: "general",
    label: "帥",
    camp: "red",
    index: 0,
    position: [4, 0],
  },
  {
    id: "black_将_0",
    role: "general",
    label: "将",
    camp: "black",
    index: 0,
    position: [4, 9],
  },
  {
    id: "red_仕_0",
    role: "advisor",
    label: "仕",
    camp: "red",
    index: 0,
    position: [3, 0],
  },
  {
    id: "black_士_0",
    role: "advisor",
    label: "士",
    camp: "black",
    index: 0,
    position: [3, 9],
  },
  {
    id: "red_仕_1",
    role: "advisor",
    label: "仕",
    camp: "red",
    index: 1,
    position: [5, 0],
  },
  {
    id: "black_士_1",
    role: "advisor",
    label: "士",
    camp: "black",
    index: 1,
    position: [5, 9],
  },
  {
    id: "red_相_0",
    role: "elephant",
    label: "相",
    camp: "red",
    index: 0,
    position: [2, 0],
  },
  {
    id: "black_象_0",
    role: "elephant",
    label: "象",
    camp: "black",
    index: 0,
    position: [2, 9],
  },
  {
    id: "red_相_1",
    role: "elephant",
    label: "相",
    camp: "red",
    index: 1,
    position: [6, 0],
  },
  {
    id: "black_象_1",
    role: "elephant",
    label: "象",
    camp: "black",
    index: 1,
    position: [6, 9],
  },
  {
    id: "red_馬_0",
    role: "horse",
    label: "馬",
    camp: "red",
    index: 0,
    position: [1, 0],
  },
  {
    id: "black_馬_0",
    role: "horse",
    label: "馬",
    camp: "black",
    index: 0,
    position: [1, 9],
  },
  {
    id: "red_馬_1",
    role: "horse",
    label: "馬",
    camp: "red",
    index: 1,
    position: [7, 0],
  },
  {
    id: "black_馬_1",
    role: "horse",
    label: "馬",
    camp: "black",
    index: 1,
    position: [7, 9],
  },
  {
    id: "red_車_0",
    role: "rook",
    label: "車",
    camp: "red",
    index: 0,
    position: [0, 0],
  },
  {
    id: "black_車_0",
    role: "rook",
    label: "車",
    camp: "black",
    index: 0,
    position: [0, 9],
  },
  {
    id: "red_車_1",
    role: "rook",
    label: "車",
    camp: "red",
    index: 1,
    position: [8, 0],
  },
  {
    id: "black_車_1",
    role: "rook",
    label: "車",
    camp: "black",
    index: 1,
    position: [8, 9],
  },
  {
    id: "red_炮_0",
    role: "cannon",
    label: "炮",
    camp: "red",
    index: 0,
    position: [1, 2],
  },
  {
    id: "black_炮_0",
    role: "cannon",
    label: "炮",
    camp: "black",
    index: 0,
    position: [1, 7],
  },
  {
    id: "red_炮_1",
    role: "cannon",
    label: "炮",
    camp: "red",
    index: 1,
    position: [7, 2],
  },
  {
    id: "black_炮_1",
    role: "cannon",
    label: "炮",
    camp: "black",
    index: 1,
    position: [7, 7],
  },
  {
    id: "red_兵_0",
    role: "soldier",
    label: "兵",
    camp: "red",
    index: 0,
    position: [0, 3],
  },
  {
    id: "black_卒_0",
    role: "soldier",
    label: "卒",
    camp: "black",
    index: 0,
    position: [0, 6],
  },
  {
    id: "red_兵_1",
    role: "soldier",
    label: "兵",
    camp: "red",
    index: 1,
    position: [2, 3],
  },
  {
    id: "black_卒_1",
    role: "soldier",
    label: "卒",
    camp: "black",
    index: 1,
    position: [2, 6],
  },
  {
    id: "red_兵_2",
    role: "soldier",
    label: "兵",
    camp: "red",
    index: 2,
    position: [4, 3],
  },
  {
    id: "black_卒_2",
    role: "soldier",
    label: "卒",
    camp: "black",
    index: 2,
    position: [4, 6],
  },
  {
    id: "red_兵_3",
    role: "soldier",
    label: "兵",
    camp: "red",
    index: 3,
    position: [6, 3],
  },
  {
    id: "black_卒_3",
    role: "soldier",
    label: "卒",
    camp: "black",
    index: 3,
    position: [6, 6],
  },
  {
    id: "red_兵_4",
    role: "soldier",
    label: "兵",
    camp: "red",
    index: 4,
    position: [8, 3],
  },
  {
    id: "black_卒_4",
    role: "soldier",
    label: "卒",
    camp: "black",
    index: 4,
    position: [8, 6],
  },
];

const HORSE_STEPS = [
  { to: [2, 1], block: [1, 0] },
  { to: [2, -1], block: [1, 0] },
  { to: [-2, 1], block: [-1, 0] },
  { to: [-2, -1], block: [-1, 0] },
  { to: [1, 2], block: [0, 1] },
  { to: [-1, 2], block: [0, 1] },
  { to: [1, -2], block: [0, -1] },
  { to: [-1, -2], block: [0, -1] },
] as const;

const DIRECTIONS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

function clonePosition(position: Position): Position {
  return [position[0], position[1]];
}

function clonePiece(piece: PieceState): PieceState {
  return {
    ...piece,
    position: clonePosition(piece.position),
  };
}

function positionKey(position: Position) {
  return `${position[0]},${position[1]}`;
}

function isInsideBoard(position: Position) {
  return (
    position[0] >= 0 &&
    position[0] < BOARD_WIDTH &&
    position[1] >= 0 &&
    position[1] < BOARD_HEIGHT
  );
}

function isInsidePalace(camp: Camp, position: Position) {
  const [x, y] = position;

  if (x < 3 || x > 5) {
    return false;
  }

  return camp === "red" ? y >= 0 && y <= 2 : y >= 7 && y <= 9;
}

function isOwnSide(camp: Camp, position: Position) {
  return camp === "red" ? position[1] <= 4 : position[1] >= 5;
}

function hasCrossedRiver(piece: PieceState) {
  return piece.camp === "red" ? piece.position[1] > 4 : piece.position[1] < 5;
}

function getAlivePieces(game: GameState) {
  return game.pieces.filter((piece) => piece.alive);
}

function getOccupancy(game: GameState) {
  return new Map(getAlivePieces(game).map((piece) => [positionKey(piece.position), piece]));
}

function getOffsetPosition(origin: Position, delta: readonly [number, number]): Position {
  return [origin[0] + delta[0], origin[1] + delta[1]];
}

function filterOwnPieceTarget(
  occupancy: Map<string, PieceState>,
  piece: PieceState,
  positions: Position[],
) {
  return positions.filter((position) => {
    const target = occupancy.get(positionKey(position));

    return !target || target.camp !== piece.camp;
  });
}

function getLineMoves(game: GameState, piece: PieceState, mode: "rook" | "cannon") {
  const occupancy = getOccupancy(game);
  const results: Position[] = [];

  for (const direction of DIRECTIONS) {
    let cursor = getOffsetPosition(piece.position, direction);
    let screenFound = false;

    while (isInsideBoard(cursor)) {
      const target = occupancy.get(positionKey(cursor));

      if (mode === "rook") {
        if (!target) {
          results.push(clonePosition(cursor));
        } else {
          if (target.camp !== piece.camp) {
            results.push(clonePosition(cursor));
          }
          break;
        }
      } else if (!screenFound) {
        if (!target) {
          results.push(clonePosition(cursor));
        } else {
          screenFound = true;
        }
      } else if (target) {
        if (target.camp !== piece.camp) {
          results.push(clonePosition(cursor));
        }
        break;
      }

      cursor = getOffsetPosition(cursor, direction);
    }
  }

  return results;
}

function getGeneralMoves(piece: PieceState, occupancy: Map<string, PieceState>) {
  return filterOwnPieceTarget(
    occupancy,
    piece,
    DIRECTIONS
      .map((direction) => getOffsetPosition(piece.position, direction))
      .filter((position) => isInsidePalace(piece.camp, position)),
  );
}

function getAdvisorMoves(piece: PieceState, occupancy: Map<string, PieceState>) {
  const candidates: Position[] = [
    [piece.position[0] + 1, piece.position[1] + 1],
    [piece.position[0] + 1, piece.position[1] - 1],
    [piece.position[0] - 1, piece.position[1] + 1],
    [piece.position[0] - 1, piece.position[1] - 1],
  ];

  return filterOwnPieceTarget(
    occupancy,
    piece,
    candidates.filter((position) => isInsidePalace(piece.camp, position)),
  );
}

function getElephantMoves(game: GameState, piece: PieceState) {
  const occupancy = getOccupancy(game);
  const candidates: Position[] = [];
  const deltas: Array<readonly [number, number]> = [
    [2, 2],
    [2, -2],
    [-2, 2],
    [-2, -2],
  ];

  for (const delta of deltas) {
    const target = getOffsetPosition(piece.position, delta);
    const block = [piece.position[0] + delta[0] / 2, piece.position[1] + delta[1] / 2] as Position;

    if (!isInsideBoard(target) || !isOwnSide(piece.camp, target)) {
      continue;
    }

    if (occupancy.has(positionKey(block))) {
      continue;
    }

    candidates.push(target);
  }

  return filterOwnPieceTarget(occupancy, piece, candidates);
}

function getHorseMoves(game: GameState, piece: PieceState) {
  const occupancy = getOccupancy(game);
  const candidates: Position[] = [];

  for (const step of HORSE_STEPS) {
    const block = getOffsetPosition(piece.position, step.block);

    if (occupancy.has(positionKey(block))) {
      continue;
    }

    const target = getOffsetPosition(piece.position, step.to);

    if (isInsideBoard(target)) {
      candidates.push(target);
    }
  }

  return filterOwnPieceTarget(occupancy, piece, candidates);
}

function getSoldierMoves(game: GameState, piece: PieceState) {
  const occupancy = getOccupancy(game);
  const candidates: Position[] = [];
  const forward = piece.camp === "red" ? 1 : -1;

  candidates.push([piece.position[0], piece.position[1] + forward]);

  if (hasCrossedRiver(piece)) {
    candidates.push([piece.position[0] - 1, piece.position[1]]);
    candidates.push([piece.position[0] + 1, piece.position[1]]);
  }

  return filterOwnPieceTarget(
    occupancy,
    piece,
    candidates.filter((position) => isInsideBoard(position)),
  );
}

export function createInitialPieces() {
  return INITIAL_PIECES.map((piece) => ({
    ...piece,
    alive: true,
    position: clonePosition(piece.position),
  }));
}

export function createInitialGame(): GameState {
  return {
    status: "waiting",
    turn: "red",
    winner: null,
    pieces: createInitialPieces(),
  };
}

export function resetGame() {
  return createInitialGame();
}

export function serializeGame(game: GameState): SerializedGameState {
  return {
    status: game.status,
    turn: game.turn,
    winner: game.winner,
    pieces: game.pieces.map(clonePiece),
  };
}

export function getPieceById(game: GameState, pieceId: string) {
  return game.pieces.find((piece) => piece.id === pieceId);
}

export function getPieceAtPosition(game: GameState, position: Position) {
  return getAlivePieces(game).find(
    (piece) => piece.position[0] === position[0] && piece.position[1] === position[1],
  );
}

export function getLegalMoves(game: GameState, pieceId: string): Position[] {
  const piece = getPieceById(game, pieceId);

  if (!piece || !piece.alive) {
    return [];
  }

  const occupancy = getOccupancy(game);

  switch (piece.role) {
    case "general":
      return getGeneralMoves(piece, occupancy);
    case "advisor":
      return getAdvisorMoves(piece, occupancy);
    case "elephant":
      return getElephantMoves(game, piece);
    case "horse":
      return getHorseMoves(game, piece);
    case "rook":
      return getLineMoves(game, piece, "rook");
    case "cannon":
      return getLineMoves(game, piece, "cannon");
    case "soldier":
      return getSoldierMoves(game, piece);
    default:
      return [];
  }
}

export function getWinner(game: GameState): Camp | null {
  const redGeneral = getPieceById(game, "red_帥_0");
  const blackGeneral = getPieceById(game, "black_将_0");

  if (redGeneral && !redGeneral.alive) {
    return "black";
  }

  if (blackGeneral && !blackGeneral.alive) {
    return "red";
  }

  return null;
}

export function applyMove(game: GameState, pieceId: string, to: Position): ApplyMoveResult {
  if (game.status !== "playing") {
    return {
      ok: false,
      code: "GAME_NOT_ACTIVE",
      message: "棋局尚未开始或已经结束",
    };
  }

  const piece = getPieceById(game, pieceId);

  if (!piece || !piece.alive) {
    return {
      ok: false,
      code: "PIECE_NOT_FOUND",
      message: "未找到对应的棋子",
    };
  }

  if (piece.camp !== game.turn) {
    return {
      ok: false,
      code: "NOT_YOUR_TURN",
      message: "当前不是该棋子的回合",
    };
  }

  const legalMoves = getLegalMoves(game, pieceId);
  const isLegal = legalMoves.some((position) => position[0] === to[0] && position[1] === to[1]);

  if (!isLegal) {
    return {
      ok: false,
      code: "ILLEGAL_MOVE",
      message: "该走法不合法",
    };
  }

  const nextGame = serializeGame(game);
  const nextPiece = getPieceById(nextGame, pieceId);
  const capturedPiece = getPieceAtPosition(nextGame, to);

  if (!nextPiece) {
    return {
      ok: false,
      code: "PIECE_NOT_FOUND",
      message: "未找到对应的棋子",
    };
  }

  if (capturedPiece) {
    capturedPiece.alive = false;
  }

  nextPiece.position = clonePosition(to);
  nextGame.turn = nextPiece.camp === "red" ? "black" : "red";
  nextGame.winner = getWinner(nextGame);
  nextGame.status = nextGame.winner ? "finished" : "playing";

  return {
    ok: true,
    game: nextGame,
    capturedPieceId: capturedPiece?.id ?? null,
    winner: nextGame.winner,
  };
}
