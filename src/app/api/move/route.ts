import { NextResponse } from "next/server"
import { Chess } from "chess.js"
import { validateMove } from "@/lib/chess/validator"
import { analyzeBoard } from "@/lib/chess/analyzer"
import { loadGame, persistGame } from "@/lib/chess/game-store"
import { getAIMove } from "@/lib/ai/llm"
import type { MoveRecord } from "@/lib/types/game"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { gameId, move, from, to, promotion } = body

    const game = await loadGame(gameId)
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 })
    if (game.status !== "active") {
      return NextResponse.json({ error: "Game is over" }, { status: 400 })
    }

    const moveStr = move ?? (from && to ? `${from}${to}${promotion ?? ""}` : null)
    if (!moveStr) return NextResponse.json({ error: "No move provided" }, { status: 400 })

    const validation = validateMove(game.fen, moveStr)
    if (!validation.legal) {
      return NextResponse.json({ error: "Illegal move" }, { status: 400 })
    }

    const chess = new Chess(game.fen)
    const result = chess.move(moveStr, { strict: false })
    if (!result) return NextResponse.json({ error: "Move failed" }, { status: 400 })

    const analysis = analyzeBoard(chess.fen(), 1)
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

    if (validation.isCheckmate) {
      game.status = "checkmate"
      game.winner = result.color === game.playerColor ? "player" : "ai"
    } else if (validation.isStalemate || validation.isDraw) {
      game.status = validation.isStalemate ? "stalemate" : "draw"
      game.winner = "draw"
    }

    await persistGame(game)

    // AI response move if game still active and it's AI's turn
    let aiResponse = null
    const aiColor = game.playerColor === "w" ? "b" : "w"
    if (game.status === "active" && chess.turn() === aiColor) {
      const aiMove = await getAIMove(chess.fen(), game.id, game.difficulty, game.personality)
      const aiValidation = validateMove(chess.fen(), aiMove.move)

      if (aiValidation.legal) {
        const aiResult = chess.move(aiMove.move, { strict: false })
        if (aiResult) {
          const aiAnalysis = analyzeBoard(chess.fen(), 1)
          const aiRecord: MoveRecord = {
            san: aiResult.san,
            uci: `${aiResult.from}${aiResult.to}${aiResult.promotion ?? ""}`,
            fen: chess.fen(),
            color: aiResult.color,
            timestamp: Date.now(),
            evaluation: aiAnalysis.score,
          }
          game.moves.push(aiRecord)
          game.fen = chess.fen()
          game.pgn = chess.pgn()
          game.updatedAt = Date.now()

          if (aiValidation.isCheckmate) {
            game.status = "checkmate"
            game.winner = "ai"
          } else if (aiValidation.isStalemate || aiValidation.isDraw) {
            game.status = aiValidation.isStalemate ? "stalemate" : "draw"
            game.winner = "draw"
          }

          await persistGame(game)
          aiResponse = { ...aiMove, san: aiResult.san }
        }
      }
    }

    return NextResponse.json({ game, aiResponse })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
