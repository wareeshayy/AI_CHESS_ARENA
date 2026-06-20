import { NextResponse } from "next/server"
import { makeMove } from "@/lib/multiplayer/room-service"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const { roomId } = await params
    const { playerId, from, to, promotion } = await request.json()

    if (!playerId || !from || !to) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const result = await makeMove(roomId, playerId, from, to, promotion)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
