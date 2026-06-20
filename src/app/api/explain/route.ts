import { NextResponse } from "next/server"
import { loadGame } from "@/lib/chess/game-store"
import { explainPosition } from "@/lib/ai/llm"

export async function POST(request: Request) {
  try {
    const { gameId, focus } = await request.json()
    if (!gameId) {
      return NextResponse.json({ error: "gameId required" }, { status: 400 })
    }

    const game = await loadGame(gameId)
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 })

    const explanation = await explainPosition(
      game.fen,
      game.id,
      game.difficulty,
      game.personality,
      focus ?? "position",
    )

    return NextResponse.json({ explanation })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
