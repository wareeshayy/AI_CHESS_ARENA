import { NextResponse } from "next/server"
import { loadGame, persistGame } from "@/lib/chess/game-store"
import { chatWithAI } from "@/lib/ai/llm"

export async function POST(request: Request) {
  try {
    const { gameId, message } = await request.json()
    if (!gameId || !message) {
      return NextResponse.json({ error: "gameId and message required" }, { status: 400 })
    }

    const game = await loadGame(gameId)
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 })

    const history = game.chatHistory
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))

    const reply = await chatWithAI(
      message,
      game.fen,
      game.id,
      game.difficulty,
      game.personality,
      history,
    )

    game.chatHistory.push({ role: "user", content: message, timestamp: Date.now() })
    game.chatHistory.push({ role: "assistant", content: reply, timestamp: Date.now() })
    game.updatedAt = Date.now()
    await persistGame(game)

    return NextResponse.json({ reply, chatHistory: game.chatHistory })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
