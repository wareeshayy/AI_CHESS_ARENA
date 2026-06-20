import { NextResponse } from "next/server"
import { Chess } from "chess.js"
import { validateMove } from "@/lib/chess/validator"
import { analyzeBoard } from "@/lib/chess/analyzer"
import { loadGame, persistGame } from "@/lib/chess/game-store"
import { getAIMove } from "@/lib/ai/llm"
import type { MoveRecord } from "@/lib/types/game"

/** Trigger AI to make the first move when player is black */
export async function POST(request: Request) {
  try {
    const { gameId } = await request.json()
    const game = await loadGame(gameId)
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 })
    if (game.status !== "active") {
      return NextResponse.json({ error: "Game is over" }, { status: 400 })
    }

    const chess = new Chess(game.fen)
    const aiColor = game.playerColor === "w" ? "b" : "w"
    if (chess.turn() !== aiColor) {
      return NextResponse.json({ error: "Not AI turn" }, { status: 400 })
    }

    const aiMove = await getAIMove(chess.fen(), game.id, game.difficulty, game.personality)
    const validation = validateMove(chess.fen(), aiMove.move)
    if (!validation.legal) {
      return NextResponse.json({ error: "AI generated illegal move" }, { status: 500 })
    }

    const result = chess.move(aiMove.move, { strict: false })
    if (!result) return NextResponse.json({ error: "AI move failed" }, { status: 500 })

    const analysis = analyzeBoard(chess.fen(), 2)
    const moveRecord: MoveRecord = {
      san: result.san,
      uci: `${result.from}${result.to}${result.promotion ?? ""}`,
      fen: chess.fen(),
      color: result.color,
      timestamp: Date.now(),
      evaluation: analysis.score,
    }

    game.moves.push(moveRecord)
    game.fen = chess.fen()
    game.pgn = chess.pgn()
    game.updatedAt = Date.now()
    await persistGame(game)

    return NextResponse.json({ game, aiResponse: { ...aiMove, san: result.san } })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
