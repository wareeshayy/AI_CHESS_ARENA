import { NextResponse } from "next/server"
import { analyzeBoard, formatEvaluation } from "@/lib/chess/analyzer"
import { generateHint } from "@/lib/chess/hints"
import { validateMove, getLegalMoves } from "@/lib/chess/validator"
import { loadGame } from "@/lib/chess/game-store"
import type { Difficulty } from "@/lib/types/game"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { fen, gameId, type, move, difficulty } = body

    const gameFen = fen ?? (gameId ? (await loadGame(gameId))?.fen : null)
    if (!gameFen) return NextResponse.json({ error: "FEN required" }, { status: 400 })

    switch (type) {
      case "validate": {
        const result = validateMove(gameFen, move)
        return NextResponse.json(result)
      }
      case "analyze": {
        const analysis = analyzeBoard(gameFen)
        return NextResponse.json({
          ...analysis,
          evaluation: formatEvaluation(analysis.score),
        })
      }
      case "hint": {
        const hint = generateHint(gameFen, (difficulty ?? "intermediate") as Difficulty)
        return NextResponse.json(hint)
      }
      case "legal_moves":
        return NextResponse.json({ moves: getLegalMoves(gameFen) })
      default:
        return NextResponse.json({ error: "Unknown analysis type" }, { status: 400 })
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
