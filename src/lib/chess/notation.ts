const PIECE_ICONS: Record<string, string> = {
  K: "♔",
  Q: "♕",
  R: "♖",
  B: "♗",
  N: "♘",
}

/** Parse SAN notation into display segments with piece icons (Lichess-style) */
export function formatSanWithIcons(san: string): { type: "piece" | "text"; value: string }[] {
  if (san === "O-O") return [{ type: "text", value: "O-O" }]
  if (san === "O-O-O") return [{ type: "text", value: "O-O-O" }]

  const segments: { type: "piece" | "text"; value: string }[] = []
  const first = san.charAt(0)

  if (PIECE_ICONS[first]) {
    segments.push({ type: "piece", value: PIECE_ICONS[first] })
    segments.push({ type: "text", value: san.slice(1) })
  } else {
    segments.push({ type: "text", value: san })
  }

  return segments
}

export interface MovePair {
  number: number
  white?: { san: string; index: number; timeSpent?: number; evaluation?: number }
  black?: { san: string; index: number; timeSpent?: number; evaluation?: number }
}

export function groupMovesIntoPairs(
  moves: { san: string; timeSpent?: number; evaluation?: number }[],
): MovePair[] {
  const pairs: MovePair[] = []
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i] ? { ...moves[i], index: i } : undefined,
      black: moves[i + 1] ? { ...moves[i + 1], index: i + 1 } : undefined,
    })
  }
  return pairs
}

export function evaluationToBarHeight(evaluation?: number): number {
  if (evaluation === undefined) return 50
  const clamped = Math.max(-10, Math.min(10, evaluation))
  return 50 + clamped * 4
}

export function evaluationBarColor(evaluation?: number): string {
  if (evaluation === undefined) return "#888"
  if (evaluation > 1.5) return "#fff"
  if (evaluation < -1.5) return "#666"
  return "#aaa"
}
