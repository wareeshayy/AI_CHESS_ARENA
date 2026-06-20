import { NextResponse } from "next/server"
import { loadGame } from "@/lib/chess/game-store"
import { generatePostGameReview } from "@/lib/ai/llm"

export async function POST(request: Request) {
  try {
    const { gameId } = await request.json()
    const game = await loadGame(gameId)
    if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 })

    const review = await generatePostGameReview(
      game.id,
      game.moves.map((m) => ({ san: m.san, color: m.color })),
      game.difficulty,
    )

    return NextResponse.json({ review })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
