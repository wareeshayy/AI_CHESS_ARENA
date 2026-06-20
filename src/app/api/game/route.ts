import { NextResponse } from "next/server"
import { createNewGame } from "@/lib/chess/validator"
import { createGameId, persistGame } from "@/lib/chess/game-store"
import type { Difficulty, GameState, Personality } from "@/lib/types/game"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const difficulty = (body.difficulty ?? "intermediate") as Difficulty
    const personality = (body.personality ?? "friendly_coach") as Personality
    const playerColor = (body.playerColor ?? "w") as "w" | "b"

    const { fen, pgn } = createNewGame()
    const now = Date.now()

    const game: GameState = {
      id: createGameId(),
      fen,
      pgn,
      moves: [],
      difficulty,
      personality,
      playerColor,
      status: "active",
      createdAt: now,
      updatedAt: now,
      chatHistory: [],
    }

    await persistGame(game)
    return NextResponse.json(game)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
