/** Chess.com-style board themes with full-texture backgrounds */

import type { CSSProperties } from "react"

export type BoardThemeId =
  | "classic-wood"
  | "walnut-wood"
  | "green"
  | "icy"
  | "sea"
  | "marble"
  | "glass"

export interface BoardTheme {
  id: BoardThemeId
  name: string
  emoji: string
  boardImage: string
  lightSquare: string
  darkSquare: string
  notationOnLight: string
  notationOnDark: string
  boardBorder: string
  lastMove: string
  selected: string
  evalLight: string
  evalDark: string
}

export const BOARD_THEMES: Record<BoardThemeId, BoardTheme> = {
  "classic-wood": {
    id: "classic-wood",
    name: "Classic Wood",
    emoji: "🪵",
    boardImage: "/board/brown.png",
    lightSquare: "#eeeed2",
    darkSquare: "#b58863",
    notationOnLight: "#b58863",
    notationOnDark: "#eeeed2",
    boardBorder: "#211f1c",
    lastMove: "rgba(155, 199, 0, 0.41)",
    selected: "rgba(20, 85, 30, 0.5)",
    evalLight: "#eeeed2",
    evalDark: "#b58863",
  },
  "walnut-wood": {
    id: "walnut-wood",
    name: "Walnut Wood",
    emoji: "🌰",
    boardImage: "/board/walnut.png",
    lightSquare: "#e8dcc8",
    darkSquare: "#8b5a3c",
    notationOnLight: "#6d4c2e",
    notationOnDark: "#f0e6d6",
    boardBorder: "#1a120c",
    lastMove: "rgba(155, 199, 0, 0.45)",
    selected: "rgba(20, 85, 30, 0.55)",
    evalLight: "#e8dcc8",
    evalDark: "#8b5a3c",
  },
  green: {
    id: "green",
    name: "Classic Green",
    emoji: "♟️",
    boardImage: "/board/green.png",
    lightSquare: "#eeeed2",
    darkSquare: "#769656",
    notationOnLight: "#769656",
    notationOnDark: "#eeeed2",
    boardBorder: "#211f1c",
    lastMove: "rgba(155, 199, 0, 0.41)",
    selected: "rgba(20, 85, 30, 0.5)",
    evalLight: "#eeeed2",
    evalDark: "#769656",
  },
  icy: {
    id: "icy",
    name: "Icy Sea",
    emoji: "❄️",
    boardImage: "/board/icy_sea.png",
    lightSquare: "#dee3e6",
    darkSquare: "#8ca2ad",
    notationOnLight: "#5a7a8a",
    notationOnDark: "#f0f4f7",
    boardBorder: "#2a3d4a",
    lastMove: "rgba(100, 180, 255, 0.35)",
    selected: "rgba(30, 100, 180, 0.45)",
    evalLight: "#dee3e6",
    evalDark: "#8ca2ad",
  },
  sea: {
    id: "sea",
    name: "Ocean Sky",
    emoji: "🌊",
    boardImage: "/board/sky.png",
    lightSquare: "#c8d8e8",
    darkSquare: "#4a7a9b",
    notationOnLight: "#3a6080",
    notationOnDark: "#e8f0f8",
    boardBorder: "#1a3040",
    lastMove: "rgba(80, 160, 220, 0.4)",
    selected: "rgba(20, 80, 160, 0.5)",
    evalLight: "#c8d8e8",
    evalDark: "#4a7a9b",
  },
  marble: {
    id: "marble",
    name: "Marble",
    emoji: "🪨",
    boardImage: "/board/marble.png",
    lightSquare: "#e8e8e8",
    darkSquare: "#999999",
    notationOnLight: "#666666",
    notationOnDark: "#f5f5f5",
    boardBorder: "#333333",
    lastMove: "rgba(129, 182, 76, 0.4)",
    selected: "rgba(60, 60, 60, 0.45)",
    evalLight: "#e8e8e8",
    evalDark: "#999999",
  },
  glass: {
    id: "glass",
    name: "Glass",
    emoji: "💎",
    boardImage: "/board/glass.png",
    lightSquare: "#d4c4e8",
    darkSquare: "#7b5ba8",
    notationOnLight: "#5a4080",
    notationOnDark: "#f0e8ff",
    boardBorder: "#2a1a40",
    lastMove: "rgba(180, 120, 255, 0.35)",
    selected: "rgba(100, 50, 180, 0.45)",
    evalLight: "#d4c4e8",
    evalDark: "#7b5ba8",
  },
}

export const BOARD_THEME_LIST = Object.values(BOARD_THEMES)

export const DEFAULT_BOARD_THEME: BoardThemeId = "classic-wood"

export function getBoardTheme(id: BoardThemeId): BoardTheme {
  return BOARD_THEMES[id] ?? BOARD_THEMES[DEFAULT_BOARD_THEME]
}

const NOTATION_FONT: CSSProperties = {
  fontWeight: 400,
  fontSize: "13px",
  fontFamily: "var(--font-geist-sans, system-ui, -apple-system, sans-serif)",
  userSelect: "none",
}

export function getThemeStyles(themeId: BoardThemeId) {
  const t = getBoardTheme(themeId)

  const boardFrameStyle: CSSProperties = {
    borderRadius: 2,
    border: `1px solid ${t.boardBorder}`,
    boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
    backgroundColor: t.darkSquare,
    backgroundImage: `url(${t.boardImage})`,
    backgroundSize: "100% 100%",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
  }

  const squareTransparent: CSSProperties = {
    backgroundColor: "transparent",
    backgroundImage: "none",
  }

  return {
    theme: t,
    boardFrameStyle,
    squareTransparent,
    notationLight: { ...NOTATION_FONT, color: t.notationOnLight },
    notationDark: { ...NOTATION_FONT, color: t.notationOnDark },
    notationAlpha: { position: "absolute" as const, bottom: 1, right: 4 },
    notationNumeric: { position: "absolute" as const, top: 2, left: 2 },
    lastMove: t.lastMove,
    selected: t.selected,
    check: "radial-gradient(circle, rgba(255,0,0,0.6) 0%, rgba(255,0,0,0.15) 50%, transparent 72%)",
    evalLight: t.evalLight,
    evalDark: t.evalDark,
    boardBorder: t.boardBorder,
  }
}

export function squareHighlight(color: string): CSSProperties {
  return { boxShadow: `inset 0 0 0 9999px ${color}` }
}

export function squareDot(isCapture: boolean): CSSProperties {
  return isCapture
    ? {
        backgroundImage: "radial-gradient(transparent 58%, rgba(0,0,0,0.18) 58%)",
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }
    : {
        backgroundImage: "radial-gradient(rgba(0,0,0,0.16) 18%, transparent 19%)",
        backgroundSize: "34% 34%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }
}
