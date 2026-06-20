import { Chess } from "chess.js"
import type { MoveRecord } from "@/lib/types/game"

export type PieceType = "p" | "n" | "b" | "r" | "q"

const PIECE_VALUE: Record<PieceType, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9,
}

const SORT_ORDER: Record<PieceType, number> = {
  q: 0, r: 1, b: 2, n: 3, p: 4,
}

export interface CapturedPieces {
  /** Pieces captured BY white (black pieces taken) */
  byWhite: PieceType[]
  /** Pieces captured BY black (white pieces taken) */
  byBlack: PieceType[]
}

/** Derive captured pieces by replaying move history */
export function getCapturedFromMoves(moves: MoveRecord[]): CapturedPieces {
  const byWhite: PieceType[] = []
  const byBlack: PieceType[] = []

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i]
    const prevFen = i === 0
      ? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
      : moves[i - 1].fen

    const captured = detectCapture(prevFen, move.uci)
    if (!captured) continue

    if (move.color === "w") byWhite.push(captured)
    else byBlack.push(captured)
  }

  return { byWhite: sortPieces(byWhite), byBlack: sortPieces(byBlack) }
}

/** Captured pieces up to a specific move index (for replay/review) */
export function getCapturedAtIndex(moves: MoveRecord[], upToIndex: number): CapturedPieces {
  if (upToIndex < 0 || moves.length === 0) {
    return { byWhite: [], byBlack: [] }
  }
  return getCapturedFromMoves(moves.slice(0, upToIndex + 1))
}

function detectCapture(prevFen: string, uci: string): PieceType | null {
  try {
    const chess = new Chess(prevFen)
    const from = uci.slice(0, 2)
    const to = uci.slice(2, 4)
    const promotion = uci.length > 4 ? uci[4] : undefined

    const result = chess.move({ from, to, promotion: promotion as "q" | "r" | "b" | "n" | undefined })
    if (!result?.captured) return null
    return result.captured as PieceType
  } catch {
    return null
  }
}

function sortPieces(pieces: PieceType[]): PieceType[] {
  return [...pieces].sort((a, b) => SORT_ORDER[a] - SORT_ORDER[b])
}

export function materialValue(pieces: PieceType[]): number {
  return pieces.reduce((sum, p) => sum + PIECE_VALUE[p], 0)
}

export function materialAdvantage(captured: CapturedPieces, forColor: "w" | "b"): number {
  const mine = forColor === "w" ? captured.byWhite : captured.byBlack
  const theirs = forColor === "w" ? captured.byBlack : captured.byWhite
  return materialValue(mine) - materialValue(theirs)
}

export function formatAdvantage(adv: number): string | null {
  if (adv === 0) return null
  return adv > 0 ? `+${adv}` : `${adv}`
}
