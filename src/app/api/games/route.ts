import { NextResponse } from "next/server"
import { listGames } from "@/lib/db/mongodb"

export async function GET() {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ games: [], source: "memory" })
    }
    const games = await listGames(10)
    return NextResponse.json({
      games: games.map((g) => ({
        id: g.id,
        status: g.status,
        moves: g.moves.length,
        playerColor: g.playerColor,
        difficulty: g.difficulty,
        updatedAt: g.updatedAt,
      })),
      source: "mongodb",
    })
  } catch (err) {
    return NextResponse.json({ games: [], error: String(err) })
  }
}
