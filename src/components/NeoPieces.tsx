"use client"

import type { PieceRenderObject } from "react-chessboard"

const PIECE_KEYS = [
  "wP", "wN", "wB", "wR", "wQ", "wK",
  "bP", "bN", "bB", "bR", "bQ", "bK",
] as const

type PieceKey = (typeof PIECE_KEYS)[number]

/** Chess.com Neo-style pieces via cburnett SVG set (local assets) */
function NeoPiece({ pieceKey }: { pieceKey: PieceKey }) {
  return (
    <img
      src={`/pieces/cburnett/${pieceKey}.svg`}
      alt=""
      draggable={false}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        objectFit: "contain",
        padding: "8%",
      }}
    />
  )
}

export const neoPieces: PieceRenderObject = Object.fromEntries(
  PIECE_KEYS.map((key) => [key, () => <NeoPiece pieceKey={key} />]),
) as PieceRenderObject

/** Small piece icon for captured pieces & move list */
export function NeoPieceImg({
  color,
  type,
  size = 24,
}: {
  color: "w" | "b"
  type: string
  size?: number
}) {
  const key = `${color}${type.toUpperCase()}`
  return (
    <img
      src={`/pieces/cburnett/${key}.svg`}
      alt=""
      draggable={false}
      width={size}
      height={size}
      className="inline-block shrink-0"
      style={{ objectFit: "contain" }}
    />
  )
}
