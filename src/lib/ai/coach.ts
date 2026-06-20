import { Chess } from "chess.js"
import { analyzeBoard } from "@/lib/chess/analyzer"
import { sanToPlain } from "@/lib/chess/plain-language"
import type { Difficulty, MoveRecord, Personality } from "@/lib/types/game"

export type CoachSentiment = "good" | "bad" | "neutral" | "tip" | "celebrate"
export type MoveQuality = "excellent" | "good" | "inaccuracy" | "mistake" | "blunder" | null

export interface CoachTip {
  text: string
  sentiment?: CoachSentiment
  moveSan?: string
  moveColor?: "w" | "b"
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

function plain(san: string): string {
  return sanToPlain(san)
}

/** Short welcome — only once at game start */
export function getWelcomeMessage(
  personality: Personality,
  playerColor: "w" | "b",
): CoachTip {
  const name = getCoachName(personality)
  const color = playerColor === "w" ? "White" : "Black"
  return {
    text: `Hi, I'm ${name}. You're playing ${color}. Move any piece when you're ready — I'll explain everything in plain English.`,
    sentiment: "tip",
  }
}

/** One concise tip per player move — beginner-friendly language */
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
  const movePlain = plain(result.san)
  const bestPlain = plain(beforeAnalysis.bestMove)

  if (chess.isCheckmate()) {
    return {
      text: `${movePlain} — that's checkmate! Brilliant finish.`,
      sentiment: "celebrate",
      moveSan: result.san,
      moveColor: playerColor,
      quality: "excellent",
      eval: evalAfter,
    }
  }

  if (result.san.includes("+")) {
    return {
      text: `Your ${movePlain}. The enemy king is in check — keep the pressure on!`,
      sentiment: "good",
      moveSan: result.san,
      moveColor: playerColor,
      quality: "good",
      eval: evalAfter,
    }
  }

  if (quality === "excellent") {
    const reason = getExcellentReason(result.san, result.captured)
    return {
      text: `Excellent! ${movePlain}. ${reason}`,
      sentiment: "good",
      moveSan: result.san,
      moveColor: playerColor,
      quality: "excellent",
      eval: evalAfter,
    }
  }

  if (quality === "blunder" || quality === "mistake") {
    return {
      text: `${movePlain} is a ${quality}. ${bestPlain} would have been much stronger here.`,
      sentiment: "bad",
      moveSan: result.san,
      moveColor: playerColor,
      quality,
      eval: evalAfter,
    }
  }

  if (quality === "inaccuracy") {
    return {
      text: `${movePlain} is a bit loose. Consider ${bestPlain} instead.`,
      sentiment: "bad",
      moveSan: result.san,
      moveColor: playerColor,
      quality,
      eval: evalAfter,
    }
  }

  if (result.captured) {
    return {
      text: `Nice — ${movePlain}. You win material, but make sure that piece stays safe.`,
      sentiment: "good",
      moveSan: result.san,
      moveColor: playerColor,
      quality: "good",
      eval: evalAfter,
    }
  }

  if (moveIndex > 2 && quality === "good") {
    return { text: "", silent: true, moveSan: result.san, moveColor: playerColor, quality, eval: evalAfter }
  }

  if (/^[NBRQK]/.test(result.san) || result.san.startsWith("O-O")) {
    return {
      text: `${movePlain} — good development, your piece is more active now.`,
      sentiment: "good",
      moveSan: result.san,
      moveColor: playerColor,
      quality: "good",
      eval: evalAfter,
    }
  }

  if (/^[a-h]/.test(result.san)) {
    return {
      text: `${movePlain} — pawns in the center control more of the board.`,
      sentiment: "good",
      moveSan: result.san,
      moveColor: playerColor,
      quality: "good",
      eval: evalAfter,
    }
  }

  return { text: "", silent: true, moveSan: result.san, moveColor: playerColor, quality, eval: evalAfter }
}

/** Only speak up on AI moves when it matters */
export function getCoachFeedbackAfterAIMove(
  moves: MoveRecord[],
  moveIndex: number,
): CoachTip | null {
  const move = moves[moveIndex]
  const aiColor = move.color
  const prevFen =
    moveIndex === 0
      ? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
      : moves[moveIndex - 1].fen

  const { chess, result } = applyMove(prevFen, move.uci)
  if (!result) return null

  const movePlain = plain(result.san)

  if (chess.isCheckmate()) {
    return {
      text: `Checkmate with ${movePlain}. Study how the attack built up.`,
      sentiment: "bad",
      moveSan: result.san,
      moveColor: aiColor,
    }
  }
  if (result.san.includes("+")) {
    return { text: `Your king is in check! Get to safety before anything else.`, sentiment: "tip" }
  }
  if (result.captured) {
    return {
      text: `I played ${movePlain} — can you recapture safely?`,
      sentiment: "tip",
      moveSan: result.san,
      moveColor: aiColor,
    }
  }

  return null
}

function getExcellentReason(san: string, captured?: string): string {
  if (captured) return "You win material and improve your position."
  if (san.startsWith("N") || san.startsWith("B")) return "Your knight or bishop is now pointing at the center."
  if (san.startsWith("O-O")) return "Castling tucks your king away safely."
  if (/^[a-h]/.test(san)) return "That pawn grabs space in the center."
  return "The computer agrees — this is the best move here."
}

export function getHintMessage(fen: string): CoachTip {
  const analysis = analyzeBoard(fen, 2)
  const bestPlain = plain(analysis.bestMove)
  return {
    text: `Try ${bestPlain} — it scores best in this position.`,
    sentiment: "tip",
    moveSan: analysis.bestMove,
  }
}

export function getGameOverCoachMessage(
  status: string,
  winner: "player" | "ai" | "draw" | undefined,
): CoachTip {
  if (status === "checkmate") {
    return winner === "player"
      ? { text: "You won! Replay the game to see your best moves.", sentiment: "celebrate" }
      : { text: "Game over. Replay to see where things went wrong.", sentiment: "tip" }
  }
  if (status === "stalemate" || status === "draw") {
    return { text: "It's a draw — solid defense from both sides.", sentiment: "neutral" }
  }
  return { text: "", silent: true }
}
