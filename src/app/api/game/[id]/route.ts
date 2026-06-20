import { NextResponse } from "next/server"
import { loadGame } from "@/lib/chess/game-store"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const game = await loadGame(id)
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 })
  return NextResponse.json(game)
}
