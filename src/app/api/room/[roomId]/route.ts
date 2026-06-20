import { NextRequest, NextResponse } from "next/server"
import { getRoom, leaveRoom } from "@/lib/multiplayer/room-service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const { roomId } = await params
    const since = request.nextUrl.searchParams.get("since")
    const room = await getRoom(roomId)

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    if (since && parseInt(since, 10) >= room.version) {
      return NextResponse.json({ unchanged: true, version: room.version })
    }

    return NextResponse.json({ room })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const { roomId } = await params
    const { playerId } = await request.json()
    if (!playerId) {
      return NextResponse.json({ error: "playerId required" }, { status: 400 })
    }
    const room = await leaveRoom(roomId, playerId)
    return NextResponse.json({ room })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
