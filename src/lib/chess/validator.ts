import { Chess } from "chess.js"
import type { LegalMoveResult } from "@/lib/types/game"

/** Tool 1: Legal Move Validator */
export function validateMove(fen: string, move: string): LegalMoveResult {
  try {
    const chess = new Chess(fen)

    // Accept SAN (Nf3), UCI (g1f3), or from-to (e2e4)
    let result
    const uciMatch = move.match(/^([a-h][1-8])([a-h][1-8])([qrbn])?$/i)
    if (uciMatch) {
      result = chess.move({
        from: uciMatch[1],
        to: uciMatch[2],
        promotion: uciMatch[3]?.toLowerCase() as "q" | "r" | "b" | "n" | undefined,
      })
    } else {
      result = chess.move(move, { strict: false })
    }

    if (!result) {
      return { legal: false }
    }

    return {
      legal: true,
      fen: chess.fen(),
      san: result.san,
      isCheck: chess.isCheck(),
      isCheckmate: chess.isCheckmate(),
      isStalemate: chess.isStalemate(),
      isDraw: chess.isDraw(),
    }
  } catch {
    return { legal: false }
  }
}

export function getLegalMoves(fen: string): string[] {
  try {
    const chess = new Chess(fen)
    return chess.moves()
  } catch {
    return []
  }
}

export function createNewGame(): { fen: string; pgn: string } {
  const chess = new Chess()
  return { fen: chess.fen(), pgn: chess.pgn() }
}
