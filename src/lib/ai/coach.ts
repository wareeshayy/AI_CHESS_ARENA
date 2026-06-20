import { Chess } from "chess.js"
import { analyzeBoard } from "@/lib/chess/analyzer"
import type { Difficulty, MoveRecord, Personality } from "@/lib/types/game"

export type CoachSentiment = "good" | "bad" | "neutral" | "tip" | "celebrate"
export type MoveQuality = "excellent" | "good" | "inaccuracy" | "mistake" | "blunder" | null

export interface CoachTip {
  text: string
  sentiment?: CoachSentiment
  moveSan?: string
  quality?: MoveQuality
  eval?: number
  silent?: boolean
}

const COACH_NAMES: Record<Personality, string> = {
  friendly_coach: "Coach David",
  grandmaster: "Coach Magnus",
  aggressive_rival: "Coach Max",
  casual_opponent: "Coach Sam",
}

export function getCoachName(personality: Personality): string {
  return COACH_NAMES[personality] ?? "Coach David"
}

function applyMove(prevFen: string, uci: string) {
  const chess = new Chess(prevFen)
  const result = chess.move({
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci[4] as "q" | "r" | "b" | "n" | undefined,
  })
  return { chess, result }
}

function isBestMove(san: string, best: string): boolean {
  const clean = (s: string) => s.replace(/[+#]/g, "")
  return clean(san) === clean(best)
}

function classifyMove(evalDrop: number, isBest: boolean): MoveQuality {
  if (isBest && evalDrop < 0.3) return "excellent"
  if (evalDrop < 0.5) return "good"
  if (evalDrop < 1.2) return "inaccuracy"
  if (evalDrop < 2.5) return "mistake"
  return "blunder"
}

/** Short welcome — only once at game start */
export function getWelcomeMessage(
  personality: Personality,
  playerColor: "w" | "b",
): CoachTip {
  const name = getCoachName(personality)
  const color = playerColor === "w" ? "White" : "Black"
  return {
    text: `Hi, I'm ${name}. You're ${color} — make a move and I'll review it.`,
    sentiment: "tip",
  }
}

/** One concise tip per player move — Chess.com Game Review style */
export function getCoachFeedbackAfterPlayerMove(
  moves: MoveRecord[],
  moveIndex: number,
  playerColor: "w" | "b",
): CoachTip {
  const move = moves[moveIndex]
  const prevFen =
    moveIndex === 0
      ? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
      : moves[moveIndex - 1].fen

  const beforeAnalysis = analyzeBoard(prevFen, 2)
  const { chess, result } = applyMove(prevFen, move.uci)

  if (!result) return { text: "", silent: true }

  const afterAnalysis = analyzeBoard(chess.fen(), 2)
  const sign = playerColor === "w" ? 1 : -1
  const evalBefore = beforeAnalysis.score * sign
  const evalAfter = afterAnalysis.score * sign
  const evalDrop = evalBefore - evalAfter
  const best = isBestMove(result.san, beforeAnalysis.bestMove)
  const quality = classifyMove(evalDrop, best)
  const san = result.san.replace(/[+#]/, "")

  if (chess.isCheckmate()) {
    return {
      text: `${san} is checkmate! Well played.`,
      sentiment: "celebrate",
      moveSan: san,
      quality: "excellent",
      eval: evalAfter,
    }
  }

  if (result.san.includes("+")) {
    return {
      text: `${san} gives check. Look for a follow-up.`,
      sentiment: "good",
      moveSan: san,
      quality: "good",
      eval: evalAfter,
    }
  }

  if (quality === "excellent") {
    const reason = getExcellentReason(result.san, result.captured)
    return {
      text: `${san} is excellent. ${reason}`,
      sentiment: "good",
      moveSan: san,
      quality: "excellent",
      eval: evalAfter,
    }
  }

  if (quality === "blunder" || quality === "mistake") {
    const better = beforeAnalysis.bestMove.replace(/[+#]/, "")
    return {
      text: `${san} is a ${quality}. ${better} was stronger here.`,
      sentiment: "bad",
      moveSan: san,
      quality,
      eval: evalAfter,
    }
  }

  if (quality === "inaccuracy") {
    return {
      text: `${san} is slightly inaccurate. Consider ${beforeAnalysis.bestMove.replace(/[+#]/, "")}.`,
      sentiment: "bad",
      moveSan: san,
      quality,
      eval: evalAfter,
    }
  }

  if (result.captured) {
    return {
      text: `${san} wins material. Make sure the piece is safe.`,
      sentiment: "good",
      moveSan: san,
      quality: "good",
      eval: evalAfter,
    }
  }

  // Good but routine — stay quiet most of the time
  if (moveIndex > 2 && quality === "good") {
    return { text: "", silent: true, moveSan: san, quality, eval: evalAfter }
  }

  if (/^[NBRQK]/.test(result.san) || result.san.startsWith("O-O")) {
    return {
      text: `${san} develops a piece nicely.`,
      sentiment: "good",
      moveSan: san,
      quality: "good",
      eval: evalAfter,
    }
  }

  return { text: "", silent: true, moveSan: san, quality, eval: evalAfter }
}

/** Only speak up on AI moves when it matters */
export function getCoachFeedbackAfterAIMove(
  moves: MoveRecord[],
  moveIndex: number,
): CoachTip | null {
  const move = moves[moveIndex]
  const prevFen =
    moveIndex === 0
      ? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
      : moves[moveIndex - 1].fen

  const { chess, result } = applyMove(prevFen, move.uci)
  if (!result) return null

  const san = result.san.replace(/[+#]/, "")

  if (chess.isCheckmate()) {
    return { text: `Checkmate on ${san}. Study how the attack built up.`, sentiment: "bad", moveSan: san }
  }
  if (result.san.includes("+")) {
    return { text: `You're in check! Get your king safe first.`, sentiment: "tip" }
  }
  if (result.captured) {
    return { text: `I played ${san} — can you recapture safely?`, sentiment: "tip" }
  }

  return null
}

function getExcellentReason(san: string, captured?: string): string {
  if (captured) return "Winning material while improving your position."
  if (san.startsWith("N") || san.startsWith("B")) return "Developing the piece and increasing influence in the center."
  if (san.startsWith("O-O")) return "Castling keeps your king safe."
  if (/^[a-h]/.test(san)) return "Controlling important central squares."
  return "The engine's top choice in this position."
}

export function getHintMessage(fen: string): CoachTip {
  const analysis = analyzeBoard(fen, 2)
  const best = analysis.bestMove.replace(/[+#]/, "")
  return {
    text: `Try ${best} — it scores best here.`,
    sentiment: "tip",
    moveSan: best,
  }
}

export function getGameOverCoachMessage(
  status: string,
  winner: "player" | "ai" | "draw" | undefined,
): CoachTip {
  if (status === "checkmate") {
    return winner === "player"
      ? { text: "You won! Replay the game to review your best moves.", sentiment: "celebrate" }
      : { text: "Game over. Replay to see where things went wrong.", sentiment: "tip" }
  }
  if (status === "stalemate" || status === "draw") {
    return { text: "Draw. Solid defense!", sentiment: "neutral" }
  }
  return { text: "", silent: true }
}
