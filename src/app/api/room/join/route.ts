import { NextResponse } from "next/server"
import { joinRoom } from "@/lib/multiplayer/room-service"

export async function POST(request: Request) {
  try {
    const { roomId, playerId } = await request.json()
    if (!roomId || !playerId) {
      return NextResponse.json({ error: "roomId and playerId required" }, { status: 400 })
    }

    const result = await joinRoom(roomId, playerId)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.error === "Room is full" ? 403 : 404 })
    }

    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
