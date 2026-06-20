import { Chess, type Square } from "chess.js"
import { analyzeBoard } from "@/lib/chess/analyzer"
import type { Difficulty, HintResult } from "@/lib/types/game"

/** Tool 4: Hint Generator */
export function generateHint(fen: string, difficulty: Difficulty): HintResult {
  const chess = new Chess(fen)
  const analysis = analyzeBoard(fen, difficulty === "beginner" ? 2 : 3)
  const turn = chess.turn() === "w" ? "White" : "Black"

  if (chess.isCheck()) {
    return {
      hint: `${turn} is in check! Look for ways to block, capture the attacking piece, or move your king to safety.`,
      category: "tactics",
    }
  }

  const moveCount = chess.history().length
  const hints: HintResult[] = []

  // Opening hints
  if (moveCount < 10) {
    hints.push({
      hint: "Focus on controlling the center with pawns and developing your knights and bishops toward the center.",
      category: "development",
    })
    hints.push({
      hint: "Try to castle early to keep your king safe while you develop your pieces.",
      category: "strategy",
    })
  }

  // Tactical hints based on analysis
  if (Math.abs(analysis.score) > 2) {
    if (analysis.score > 0 && chess.turn() === "w") {
      hints.push({
        hint: "You have a strong position. Look for ways to convert your advantage — perhaps a discovered attack or a pin.",
        category: "tactics",
      })
    } else if (analysis.score < 0 && chess.turn() === "b") {
      hints.push({
        hint: "You're under pressure. Consider simplifying the position by trading pieces or creating counterplay.",
        category: "strategy",
      })
    }
  }

  // Piece development
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"]
  let undevelopedKnights = 0
  for (const file of files) {
    const startSquare = `${file}${chess.turn() === "w" ? "1" : "8"}` as Square
    const piece = chess.get(startSquare)
    if (piece?.type === "n" && piece.color === chess.turn()) undevelopedKnights++
  }
  if (undevelopedKnights > 0) {
    hints.push({
      hint: "You still have knights on their starting squares. Consider developing them toward the center.",
      category: "development",
    })
  }

  // Endgame hints
  if (moveCount > 30) {
    hints.push({
      hint: "In the endgame, activate your king — it becomes a powerful piece. Push passed pawns when possible.",
      category: "endgame",
    })
  }

  // Difficulty-based hint depth
  if (difficulty === "beginner") {
    const simple = hints[0] ?? {
      hint: "Look at all your pieces and find the one that can move to the most useful square.",
      category: "general" as const,
    }
    return simple
  }

  if (difficulty === "advanced" && analysis.bestMove) {
    const piece = analysis.bestMove.charAt(0)
    const pieceNames: Record<string, string> = {
      N: "knight", B: "bishop", R: "rook", Q: "queen", K: "king",
    }
    if (pieceNames[piece]) {
      return {
        hint: `Consider what your ${pieceNames[piece]} can accomplish. There may be a strong move involving that piece.`,
        category: "tactics",
      }
    }
  }

  return hints[Math.floor(Math.random() * hints.length)] ?? {
    hint: "Study the position carefully. What is your opponent threatening, and what are your own threats?",
    category: "general",
  }
}
