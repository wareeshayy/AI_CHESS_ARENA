import { NextRequest, NextResponse } from "next/server"
import { isValidEmail } from "@/lib/email/validate"
import { sendInviteEmail } from "@/lib/email/send-invite"
import { getRoom } from "@/lib/multiplayer/room-service"

function resolveInviteLink(request: NextRequest, roomId: string, clientLink?: string): string {
  if (clientLink?.startsWith("http")) return clientLink

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) return `${appUrl.replace(/\/$/, "")}/room/${roomId}`

  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) return `https://${vercelUrl}/room/${roomId}`

  const origin = request.headers.get("origin") ?? request.nextUrl.origin
  return `${origin}/room/${roomId}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { roomId, email, message, inviteLink: clientLink } = body as {
      roomId?: string
      email?: string
      message?: string
      inviteLink?: string
    }

    if (!roomId || !email) {
      return NextResponse.json({ error: "roomId and email are required" }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    const room = await getRoom(roomId.toLowerCase())
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    if (room.status !== "waiting" && room.players.filter((p) => p.connected).length >= 2) {
      return NextResponse.json({ error: "Room is full" }, { status: 400 })
    }

    const inviteLink = resolveInviteLink(request, roomId.toLowerCase(), clientLink)

    const params = {
      to: email,
      roomId: roomId.toLowerCase(),
      inviteLink,
      message: typeof message === "string" ? message.slice(0, 500) : undefined,
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Email service not configured. Add RESEND_API_KEY on Vercel." },
        { status: 503 },
      )
    }

    const result = await sendInviteEmail(params)

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          fallback: result.fallback,
          mailtoUrl: result.mailtoUrl,
          inviteLink,
        },
        { status: result.fallback === "mailto" ? 200 : 502 },
      )
    }

    return NextResponse.json({ ok: true, message: "Invite sent!", inviteLink })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
