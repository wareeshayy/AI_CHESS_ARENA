/** Chess.com brown wood board — matches chess.com brown theme */

import type { CSSProperties } from "react"

export const CHESS_THEME = {
  lightSquare: "#eeeed2",
  darkSquare: "#b58863",
  notationOnLight: "#b58863",
  notationOnDark: "#eeeed2",
  boardBorder: "#211f1c",
  lastMove: "rgba(155, 199, 0, 0.41)",
  selected: "rgba(20, 85, 30, 0.5)",
  check: "radial-gradient(circle, rgba(255,0,0,0.6) 0%, rgba(255,0,0,0.15) 50%, transparent 72%)",
} as const

/** Full-board Chess.com brown wood texture (transparent squares reveal this) */
export const BOARD_FRAME_STYLE: CSSProperties = {
  borderRadius: 0,
  border: `1px solid ${CHESS_THEME.boardBorder}`,
  boxShadow: "none",
  backgroundColor: CHESS_THEME.darkSquare,
  backgroundImage: "url(/board/chesscom-brown.png)",
  backgroundSize: "100% 100%",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "center",
}

export const SQUARE_TRANSPARENT: CSSProperties = {
  backgroundColor: "transparent",
  backgroundImage: "none",
}

const NOTATION_FONT: CSSProperties = {
  fontWeight: 400,
  fontSize: "13px",
  fontFamily: "var(--font-geist-sans, system-ui, -apple-system, sans-serif)",
  userSelect: "none",
}

export const NOTATION_LIGHT: CSSProperties = {
  ...NOTATION_FONT,
  color: CHESS_THEME.notationOnLight,
}

export const NOTATION_DARK: CSSProperties = {
  ...NOTATION_FONT,
  color: CHESS_THEME.notationOnDark,
}

export const NOTATION_ALPHA: CSSProperties = {
  position: "absolute",
  bottom: 1,
  right: 4,
}

export const NOTATION_NUMERIC: CSSProperties = {
  position: "absolute",
  top: 2,
  left: 2,
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
