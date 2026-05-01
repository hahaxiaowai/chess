export type GameType = "chinese-chess" | "gobang";
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
  | "帅"
  | "将"
  | "仕"
  | "士"
  | "相"
  | "象"
  | "马"
  | "车"
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

export interface ChineseChessGameState {
  gameType: "chinese-chess";
  status: GameStatus;
  turn: Camp;
  winner: Camp | null;
  check: Record<Camp, boolean>;
  pieces: PieceState[];
}

export interface GobangMove {
  moveNumber: number;
  camp: Camp;
  position: Position;
}

export interface GobangGameState {
  gameType: "gobang";
  status: GameStatus;
  turn: Camp;
  winner: Camp | "draw" | null;
  size: number;
  moves: GobangMove[];
}

export type GameState = ChineseChessGameState | GobangGameState;
export type SerializedGameState = GameState;

type CommonMoveErrorCode = "GAME_NOT_ACTIVE" | "NOT_YOUR_TURN" | "ILLEGAL_MOVE";

export type ChineseChessMoveErrorCode = CommonMoveErrorCode | "PIECE_NOT_FOUND";
export type GobangMoveErrorCode = CommonMoveErrorCode | "CELL_OCCUPIED";

export type ApplyMoveResult<TGame extends GameState, TErrorCode extends string> =
  | {
    ok: true;
    game: TGame;
    capturedPieceId: string | null;
    winner: TGame["winner"];
  }
  | {
    ok: false;
    code: TErrorCode;
    message: string;
  };

export type ApplyChineseChessMoveResult = ApplyMoveResult<
  ChineseChessGameState,
  ChineseChessMoveErrorCode
>;
export type ApplyGobangMoveResult = ApplyMoveResult<GobangGameState, GobangMoveErrorCode>;

const CHINESE_CHESS_BOARD_WIDTH = 9;
const CHINESE_CHESS_BOARD_HEIGHT = 10;
const GOBANG_BOARD_SIZE = 15;

const INITIAL_PIECES: Array<Omit<PieceState, "alive" | "position"> & { position: Position }> = [
  { id: "red_帅_0", role: "general", label: "帅", camp: "red", index: 0, position: [4, 0] },
  { id: "black_将_0", role: "general", label: "将", camp: "black", index: 0, position: [4, 9] },
  { id: "red_仕_0", role: "advisor", label: "仕", camp: "red", index: 0, position: [3, 0] },
  { id: "black_士_0", role: "advisor", label: "士", camp: "black", index: 0, position: [3, 9] },
  { id: "red_仕_1", role: "advisor", label: "仕", camp: "red", index: 1, position: [5, 0] },
  { id: "black_士_1", role: "advisor", label: "士", camp: "black", index: 1, position: [5, 9] },
  { id: "red_相_0", role: "elephant", label: "相", camp: "red", index: 0, position: [2, 0] },
  { id: "black_象_0", role: "elephant", label: "象", camp: "black", index: 0, position: [2, 9] },
  { id: "red_相_1", role: "elephant", label: "相", camp: "red", index: 1, position: [6, 0] },
  { id: "black_象_1", role: "elephant", label: "象", camp: "black", index: 1, position: [6, 9] },
  { id: "red_马_0", role: "horse", label: "马", camp: "red", index: 0, position: [1, 0] },
  { id: "black_马_0", role: "horse", label: "马", camp: "black", index: 0, position: [1, 9] },
  { id: "red_马_1", role: "horse", label: "马", camp: "red", index: 1, position: [7, 0] },
  { id: "black_马_1", role: "horse", label: "马", camp: "black", index: 1, position: [7, 9] },
  { id: "red_车_0", role: "rook", label: "车", camp: "red", index: 0, position: [0, 0] },
  { id: "black_车_0", role: "rook", label: "车", camp: "black", index: 0, position: [0, 9] },
  { id: "red_车_1", role: "rook", label: "车", camp: "red", index: 1, position: [8, 0] },
  { id: "black_车_1", role: "rook", label: "车", camp: "black", index: 1, position: [8, 9] },
  { id: "red_炮_0", role: "cannon", label: "炮", camp: "red", index: 0, position: [1, 2] },
  { id: "black_炮_0", role: "cannon", label: "炮", camp: "black", index: 0, position: [1, 7] },
  { id: "red_炮_1", role: "cannon", label: "炮", camp: "red", index: 1, position: [7, 2] },
  { id: "black_炮_1", role: "cannon", label: "炮", camp: "black", index: 1, position: [7, 7] },
  { id: "red_兵_0", role: "soldier", label: "兵", camp: "red", index: 0, position: [0, 3] },
  { id: "black_卒_0", role: "soldier", label: "卒", camp: "black", index: 0, position: [0, 6] },
  { id: "red_兵_1", role: "soldier", label: "兵", camp: "red", index: 1, position: [2, 3] },
  { id: "black_卒_1", role: "soldier", label: "卒", camp: "black", index: 1, position: [2, 6] },
  { id: "red_兵_2", role: "soldier", label: "兵", camp: "red", index: 2, position: [4, 3] },
  { id: "black_卒_2", role: "soldier", label: "卒", camp: "black", index: 2, position: [4, 6] },
  { id: "red_兵_3", role: "soldier", label: "兵", camp: "red", index: 3, position: [6, 3] },
  { id: "black_卒_3", role: "soldier", label: "卒", camp: "black", index: 3, position: [6, 6] },
  { id: "red_兵_4", role: "soldier", label: "兵", camp: "red", index: 4, position: [8, 3] },
  { id: "black_卒_4", role: "soldier", label: "卒", camp: "black", index: 4, position: [8, 6] },
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

const GOBANG_WIN_DIRECTIONS = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
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

function isInsideChineseChessBoard(position: Position) {
  return (
    position[0] >= 0 &&
    position[0] < CHINESE_CHESS_BOARD_WIDTH &&
    position[1] >= 0 &&
    position[1] < CHINESE_CHESS_BOARD_HEIGHT
  );
}

function isInsideGobangBoard(position: Position) {
  return (
    position[0] >= 0 &&
    position[0] < GOBANG_BOARD_SIZE &&
    position[1] >= 0 &&
    position[1] < GOBANG_BOARD_SIZE
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

function getAlivePieces(game: ChineseChessGameState) {
  return game.pieces.filter((piece) => piece.alive);
}

function getOccupancy(game: ChineseChessGameState) {
  return new Map(getAlivePieces(game).map((piece) => [positionKey(piece.position), piece]));
}

function getGobangOccupancy(game: GobangGameState) {
  return new Map(game.moves.map((move) => [positionKey(move.position), move.camp]));
}

function getOffsetPosition(origin: Position, delta: readonly [number, number]): Position {
  return [origin[0] + delta[0], origin[1] + delta[1]];
}

function isSamePosition(left: Position, right: Position) {
  return left[0] === right[0] && left[1] === right[1];
}

function getOppositeCamp(camp: Camp): Camp {
  return camp === "red" ? "black" : "red";
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

function getLineMoves(game: ChineseChessGameState, piece: PieceState, mode: "rook" | "cannon") {
  const occupancy = getOccupancy(game);
  const results: Position[] = [];

  for (const direction of DIRECTIONS) {
    let cursor = getOffsetPosition(piece.position, direction);
    let screenFound = false;

    while (isInsideChineseChessBoard(cursor)) {
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

function getElephantMoves(game: ChineseChessGameState, piece: PieceState) {
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

    if (!isInsideChineseChessBoard(target) || !isOwnSide(piece.camp, target)) {
      continue;
    }

    if (occupancy.has(positionKey(block))) {
      continue;
    }

    candidates.push(target);
  }

  return filterOwnPieceTarget(occupancy, piece, candidates);
}

function getHorseMoves(game: ChineseChessGameState, piece: PieceState) {
  const occupancy = getOccupancy(game);
  const candidates: Position[] = [];

  for (const step of HORSE_STEPS) {
    const block = getOffsetPosition(piece.position, step.block);

    if (occupancy.has(positionKey(block))) {
      continue;
    }

    const target = getOffsetPosition(piece.position, step.to);

    if (isInsideChineseChessBoard(target)) {
      candidates.push(target);
    }
  }

  return filterOwnPieceTarget(occupancy, piece, candidates);
}

function getSoldierMoves(game: ChineseChessGameState, piece: PieceState) {
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
    candidates.filter((position) => isInsideChineseChessBoard(position)),
  );
}

function getGeneralPiece(game: ChineseChessGameState, camp: Camp) {
  return game.pieces.find((piece) => piece.alive && piece.role === "general" && piece.camp === camp);
}

function areGeneralsFacing(game: ChineseChessGameState) {
  const redGeneral = getGeneralPiece(game, "red");
  const blackGeneral = getGeneralPiece(game, "black");

  if (!redGeneral || !blackGeneral || redGeneral.position[0] !== blackGeneral.position[0]) {
    return false;
  }

  const file = redGeneral.position[0];
  const minY = Math.min(redGeneral.position[1], blackGeneral.position[1]) + 1;
  const maxY = Math.max(redGeneral.position[1], blackGeneral.position[1]);

  for (const piece of getAlivePieces(game)) {
    if (piece.id === redGeneral.id || piece.id === blackGeneral.id) {
      continue;
    }

    if (piece.position[0] === file && piece.position[1] >= minY && piece.position[1] < maxY) {
      return false;
    }
  }

  return true;
}

function getPseudoLegalMoves(game: ChineseChessGameState, piece: PieceState): Position[] {
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

function applySimulatedMove(game: ChineseChessGameState, pieceId: string, to: Position) {
  const nextGame = serializeGame(game);
  const nextPiece = getPieceById(nextGame, pieceId);

  if (!nextPiece || !nextPiece.alive) {
    return nextGame;
  }

  const capturedPiece = getPieceAtPosition(nextGame, to);

  if (capturedPiece) {
    capturedPiece.alive = false;
  }

  nextPiece.position = clonePosition(to);
  return nextGame;
}

export function isCampInCheck(game: ChineseChessGameState, camp: Camp) {
  const general = getGeneralPiece(game, camp);

  if (!general) {
    return false;
  }

  if (areGeneralsFacing(game)) {
    return true;
  }

  const opponentCamp = getOppositeCamp(camp);

  return getAlivePieces(game)
    .filter((piece) => piece.camp === opponentCamp)
    .some((piece) => getPseudoLegalMoves(game, piece).some((position) => isSamePosition(position, general.position)));
}

export function getCheckState(game: ChineseChessGameState): Record<Camp, boolean> {
  return {
    red: isCampInCheck(game, "red"),
    black: isCampInCheck(game, "black"),
  };
}

function countLine(
  occupancy: Map<string, Camp>,
  camp: Camp,
  position: Position,
  delta: readonly [number, number],
) {
  let count = 0;
  let cursor: Position = [position[0] + delta[0], position[1] + delta[1]];

  while (isInsideGobangBoard(cursor) && occupancy.get(positionKey(cursor)) === camp) {
    count += 1;
    cursor = [cursor[0] + delta[0], cursor[1] + delta[1]];
  }

  return count;
}

export function createInitialPieces() {
  return INITIAL_PIECES.map((piece) => ({
    ...piece,
    alive: true,
    position: clonePosition(piece.position),
  }));
}

export function createInitialChineseChessGame(): ChineseChessGameState {
  return {
    gameType: "chinese-chess",
    status: "waiting",
    turn: "red",
    winner: null,
    check: { red: false, black: false },
    pieces: createInitialPieces(),
  };
}

export function createInitialGobangGame(): GobangGameState {
  return {
    gameType: "gobang",
    status: "waiting",
    turn: "black",
    winner: null,
    size: GOBANG_BOARD_SIZE,
    moves: [],
  };
}

export function createInitialGame(gameType: GameType = "chinese-chess"): GameState {
  return gameType === "gobang" ? createInitialGobangGame() : createInitialChineseChessGame();
}

export function resetGame(gameType: GameType = "chinese-chess") {
  return createInitialGame(gameType);
}

export function serializeGame<TGame extends GameState>(game: TGame): TGame {
  if (game.gameType === "gobang") {
    return {
      ...game,
      moves: game.moves.map((move) => ({
        ...move,
        position: clonePosition(move.position),
      })),
    } as TGame;
  }

  return {
    ...game,
    check: { ...game.check },
    pieces: game.pieces.map(clonePiece),
  } as TGame;
}

export function getPieceById(game: ChineseChessGameState, pieceId: string) {
  return game.pieces.find((piece) => piece.id === pieceId);
}

export function getPieceAtPosition(game: ChineseChessGameState, position: Position) {
  return getAlivePieces(game).find(
    (piece) => piece.position[0] === position[0] && piece.position[1] === position[1],
  );
}

export function getLegalMoves(game: ChineseChessGameState, pieceId: string): Position[] {
  const piece = getPieceById(game, pieceId);

  if (!piece || !piece.alive) {
    return [];
  }

  return getPseudoLegalMoves(game, piece).filter((position) => {
    const simulatedGame = applySimulatedMove(game, piece.id, position);
    return !isCampInCheck(simulatedGame, piece.camp);
  });
}

export function getWinner(game: ChineseChessGameState): Camp | null {
  const redGeneral = getPieceById(game, "red_帅_0");
  const blackGeneral = getPieceById(game, "black_将_0");

  if (redGeneral && !redGeneral.alive) {
    return "black";
  }

  if (blackGeneral && !blackGeneral.alive) {
    return "red";
  }

  return null;
}

export function getGobangWinner(game: GobangGameState): Camp | "draw" | null {
  if (game.moves.length === 0) {
    return null;
  }

  const occupancy = getGobangOccupancy(game);
  const lastMove = game.moves[game.moves.length - 1];

  for (const direction of GOBANG_WIN_DIRECTIONS) {
    const count =
      1 +
      countLine(occupancy, lastMove.camp, lastMove.position, direction) +
      countLine(occupancy, lastMove.camp, lastMove.position, [-direction[0], -direction[1]]);

    if (count >= 5) {
      return lastMove.camp;
    }
  }

  if (game.moves.length >= game.size * game.size) {
    return "draw";
  }

  return null;
}

export function applyChineseChessMove(
  game: ChineseChessGameState,
  pieceId: string,
  to: Position,
): ApplyChineseChessMoveResult {
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
  nextGame.check = getCheckState(nextGame);
  nextGame.status = nextGame.winner ? "finished" : "playing";

  return {
    ok: true,
    game: nextGame,
    capturedPieceId: capturedPiece?.id ?? null,
    winner: nextGame.winner,
  };
}

export function applyGobangMove(game: GobangGameState, to: Position): ApplyGobangMoveResult {
  if (game.status !== "playing") {
    return {
      ok: false,
      code: "GAME_NOT_ACTIVE",
      message: "棋局尚未开始或已经结束",
    };
  }

  if (!isInsideGobangBoard(to)) {
    return {
      ok: false,
      code: "ILLEGAL_MOVE",
      message: "落子位置超出棋盘范围",
    };
  }

  if (getGobangOccupancy(game).has(positionKey(to))) {
    return {
      ok: false,
      code: "CELL_OCCUPIED",
      message: "该位置已有棋子",
    };
  }

  const nextGame = serializeGame(game);

  nextGame.moves.push({
    moveNumber: nextGame.moves.length + 1,
    camp: game.turn,
    position: clonePosition(to),
  });

  nextGame.winner = getGobangWinner(nextGame);
  nextGame.status = nextGame.winner ? "finished" : "playing";
  nextGame.turn = game.turn === "red" ? "black" : "red";

  return {
    ok: true,
    game: nextGame,
    capturedPieceId: null,
    winner: nextGame.winner,
  };
}

export function applyMove(game: ChineseChessGameState, pieceId: string, to: Position) {
  return applyChineseChessMove(game, pieceId, to);
}
