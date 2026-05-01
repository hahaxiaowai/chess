export type ChineseChessThemeId = "classic" | "obsidian" | "jade" | "ember" | "porcelain";
export type RangeMarkerStyle = "disc" | "ring" | "diamond" | "plate" | "halo";
export type TargetMarkerStyle = "square" | "ring" | "cross" | "diamond" | "spike";
export type ThreatLineStyle = "beam" | "double" | "pulse" | "ladder" | "spike";
export type ThemePreviewPattern = "grid" | "diagonal" | "arc" | "frame" | "fan";

export interface ChineseChessTheme {
  id: ChineseChessThemeId;
  name: string;
  description: string;
  sceneBackground: string;
  boardSurface: string;
  boardAccent: string;
  lineColor: string;
  pieceBase: string;
  pieceTextRed: string;
  pieceTextBlack: string;
  rangeColor: string;
  targetColor: string;
  boardThickness: number;
  lineWidth: number;
  pieceRadius: number;
  pieceDepth: number;
  pieceBevelSize: number;
  pieceTextScale: number;
  alertRingScale: number;
  rangeMarkerStyle: RangeMarkerStyle;
  targetMarkerStyle: TargetMarkerStyle;
  threatLineStyle: ThreatLineStyle;
  previewPattern: ThemePreviewPattern;
  previewBackground: string;
  previewGlow: string;
}

export const chineseChessThemes: ChineseChessTheme[] = [
  {
    id: "classic",
    name: "经典榆木",
    description: "暖木经典",
    sceneBackground: "#d8d4cb",
    boardSurface: "#e8c185",
    boardAccent: "#8c5b2d",
    lineColor: "#42250f",
    pieceBase: "#f1d0a0",
    pieceTextRed: "#b5332e",
    pieceTextBlack: "#30231c",
    rangeColor: "#3fa66b",
    targetColor: "#d85a45",
    boardThickness: 2,
    lineWidth: 0.22,
    pieceRadius: 4,
    pieceDepth: 2,
    pieceBevelSize: 0.3,
    pieceTextScale: 0.0088,
    alertRingScale: 1,
    rangeMarkerStyle: "disc",
    targetMarkerStyle: "square",
    threatLineStyle: "beam",
    previewPattern: "grid",
    previewBackground: "linear-gradient(135deg, rgba(232,193,133,0.95), rgba(206,152,91,0.92))",
    previewGlow: "rgba(140,91,45,0.28)",
  },
  {
    id: "obsidian",
    name: "玄铁夜局",
    description: "冷冽金属",
    sceneBackground: "#11161d",
    boardSurface: "#2e3642",
    boardAccent: "#7c8aa0",
    lineColor: "#d7e0f0",
    pieceBase: "#485564",
    pieceTextRed: "#ff7b63",
    pieceTextBlack: "#eef2fa",
    rangeColor: "#69d1b0",
    targetColor: "#ff925f",
    boardThickness: 2.8,
    lineWidth: 0.18,
    pieceRadius: 4.25,
    pieceDepth: 2.6,
    pieceBevelSize: 0.22,
    pieceTextScale: 0.0084,
    alertRingScale: 1.08,
    rangeMarkerStyle: "ring",
    targetMarkerStyle: "ring",
    threatLineStyle: "double",
    previewPattern: "diagonal",
    previewBackground: "linear-gradient(135deg, rgba(46,54,66,0.96), rgba(20,27,36,0.96))",
    previewGlow: "rgba(124,138,160,0.28)",
  },
  {
    id: "jade",
    name: "青玉金纹",
    description: "清润玉感",
    sceneBackground: "#d7ece7",
    boardSurface: "#b9d9cb",
    boardAccent: "#6f8f84",
    lineColor: "#435e56",
    pieceBase: "#ecf3ec",
    pieceTextRed: "#ca5348",
    pieceTextBlack: "#28413a",
    rangeColor: "#4aa874",
    targetColor: "#d86d52",
    boardThickness: 1.7,
    lineWidth: 0.16,
    pieceRadius: 3.85,
    pieceDepth: 1.6,
    pieceBevelSize: 0.18,
    pieceTextScale: 0.0085,
    alertRingScale: 0.94,
    rangeMarkerStyle: "halo",
    targetMarkerStyle: "diamond",
    threatLineStyle: "pulse",
    previewPattern: "arc",
    previewBackground: "linear-gradient(135deg, rgba(185,217,203,0.98), rgba(133,173,158,0.94))",
    previewGlow: "rgba(111,143,132,0.24)",
  },
  {
    id: "ember",
    name: "赤漆残局",
    description: "赤金浓烈",
    sceneBackground: "#241818",
    boardSurface: "#8c3025",
    boardAccent: "#e09c54",
    lineColor: "#ffe6c6",
    pieceBase: "#f5d8b1",
    pieceTextRed: "#a91f18",
    pieceTextBlack: "#38241c",
    rangeColor: "#67c88b",
    targetColor: "#ffb05f",
    boardThickness: 2.4,
    lineWidth: 0.24,
    pieceRadius: 4.15,
    pieceDepth: 2.3,
    pieceBevelSize: 0.34,
    pieceTextScale: 0.009,
    alertRingScale: 1.02,
    rangeMarkerStyle: "plate",
    targetMarkerStyle: "cross",
    threatLineStyle: "spike",
    previewPattern: "fan",
    previewBackground: "linear-gradient(135deg, rgba(140,48,37,0.96), rgba(76,23,19,0.98))",
    previewGlow: "rgba(224,156,84,0.3)",
  },
  {
    id: "porcelain",
    name: "白瓷墨局",
    description: "白瓷冷墨",
    sceneBackground: "#edf1f5",
    boardSurface: "#f8f5ef",
    boardAccent: "#cad3dc",
    lineColor: "#33414d",
    pieceBase: "#fffdf8",
    pieceTextRed: "#c2463a",
    pieceTextBlack: "#1f2b34",
    rangeColor: "#57b77e",
    targetColor: "#db7258",
    boardThickness: 1.45,
    lineWidth: 0.14,
    pieceRadius: 3.72,
    pieceDepth: 1.4,
    pieceBevelSize: 0.14,
    pieceTextScale: 0.0081,
    alertRingScale: 0.9,
    rangeMarkerStyle: "diamond",
    targetMarkerStyle: "spike",
    threatLineStyle: "ladder",
    previewPattern: "frame",
    previewBackground: "linear-gradient(135deg, rgba(248,245,239,0.98), rgba(222,229,237,0.94))",
    previewGlow: "rgba(92,115,132,0.18)",
  },
];

export const defaultChineseChessThemeId: ChineseChessThemeId = "classic";

export function isChineseChessThemeId(value: string | null | undefined): value is ChineseChessThemeId {
  return chineseChessThemes.some((theme) => theme.id === value);
}

export function getChineseChessTheme(themeId: ChineseChessThemeId): ChineseChessTheme {
  return chineseChessThemes.find((theme) => theme.id === themeId) ?? chineseChessThemes[0];
}