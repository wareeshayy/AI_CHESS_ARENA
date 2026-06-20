import { Chess } from "chess.js"
import type { BoardAnalysis } from "@/lib/types/game"

const PIECE_VALUES: Record<string, number> = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 0,
}

const PST: Record<string, number[]> = {
  p: [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
  n: [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
  b: [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,5,10,10,5,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
  r: [0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
  q: [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
  k: [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20],
}

function evaluatePosition(chess: Chess): number {
  if (chess.isCheckmate()) return chess.turn() === "w" ? -10000 : 10000
  if (chess.isStalemate() || chess.isDraw()) return 0

  const board = chess.board()
  let score = 0

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (!piece) continue
      const idx = piece.color === "w" ? row * 8 + col : (7 - row) * 8 + col
      const val = PIECE_VALUES[piece.type]
      const pst = PST[piece.type]?.[idx] ?? 0
      score += piece.color === "w" ? val + pst : -(val + pst)
    }
  }

  // Mobility bonus
  const mobility = chess.moves().length * 2
  score += chess.turn() === "w" ? mobility : -mobility

  return score
}

function minimax(chess: Chess, depth: number, alpha: number, beta: number, maximizing: boolean): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluatePosition(chess)
  }

  const moves = chess.moves({ verbose: true })
  if (maximizing) {
    let maxEval = -Infinity
    for (const move of moves) {
      chess.move(move)
      maxEval = Math.max(maxEval, minimax(chess, depth - 1, alpha, beta, false))
      chess.undo()
      alpha = Math.max(alpha, maxEval)
      if (beta <= alpha) break
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (const move of moves) {
      chess.move(move)
      minEval = Math.min(minEval, minimax(chess, depth - 1, alpha, beta, true))
      chess.undo()
      beta = Math.min(beta, minEval)
      if (beta <= alpha) break
    }
    return minEval
  }
}

/** Tool 2: Board Analyzer (Stockfish-style evaluation engine) */
export function analyzeBoard(fen: string, depth = 3): BoardAnalysis {
  const chess = new Chess(fen)
  const moves = chess.moves({ verbose: true })

  if (moves.length === 0) {
    const score = evaluatePosition(chess) / 100
    return { score, bestMove: "", bestMoveUci: "", depth }
  }

  let bestMove = moves[0]
  let bestScore = chess.turn() === "w" ? -Infinity : Infinity

  for (const move of moves) {
    chess.move(move)
    const score = minimax(chess, depth - 1, -Infinity, Infinity, chess.turn() === "w")
    chess.undo()

    if (chess.turn() === "w") {
      if (score > bestScore) { bestScore = score; bestMove = move }
    } else {
      if (score < bestScore) { bestScore = score; bestMove = move }
    }
  }

  return {
    score: bestScore / 100,
    bestMove: bestMove.san,
    bestMoveUci: `${bestMove.from}${bestMove.to}${bestMove.promotion ?? ""}`,
    depth,
  }
}

export function formatEvaluation(score: number): string {
  if (Math.abs(score) > 50) return score > 0 ? "#+" : "#-"
  const sign = score >= 0 ? "+" : ""
  return `${sign}${score.toFixed(1)}`
}
