import { NextResponse } from "next/server"
import { createRoom } from "@/lib/multiplayer/room-service"

export async function POST() {
  try {
    const room = await createRoom()
    return NextResponse.json({
      roomId: room.roomId,
      link: `/room/${room.roomId}`,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
