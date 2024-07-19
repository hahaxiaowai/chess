// declare enum ChessType {
//   "帅" = "帅",
//   "将" = "将",
//   "兵" = "兵",
//   "卒" = "卒",
//   "車" = "車",
//   "炮" = "炮",
//   "馬" = "馬",
//   "相" = "相",
//   "象" = "象",
//   "仕" = "仕",
//   "士" = "士",
// }
declare type ChessType =
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
declare type ChessCamp = "red" | "black";

interface BoardOption {
  id: string;
  chessOption?: object;
  model: "local" | "online";
  message: Ref<string>;
}