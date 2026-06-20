"use client"

import { useCallback, useState } from "react"
import { isValidEmail } from "@/lib/email/validate"
import { buildMailtoUrl } from "@/lib/email/templates"

interface RoomInvitePanelProps {
  roomId: string
  inviteLink: string
  disabled?: boolean
}

export default function RoomInvitePanel({ roomId, inviteLink, disabled }: RoomInvitePanelProps) {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "ok" | "info" | "err"; text: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const mailtoParams = () => ({
    to: email.trim(),
    roomId,
    inviteLink,
    message: message.trim() || undefined,
  })

  const openEmailApp = useCallback(() => {
    const trimmed = email.trim()
    if (!trimmed || !isValidEmail(trimmed)) {
      setFeedback({ type: "err", text: "Enter a valid email first" })
      return
    }
    window.location.href = buildMailtoUrl(mailtoParams())
    setFeedback({ type: "info", text: "Email app opened — tap Send to deliver the invite." })
  }, [email, inviteLink, message, roomId])

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sendInvite = useCallback(async () => {
    const trimmed = email.trim()
    if (!trimmed || !isValidEmail(trimmed) || disabled || sending) return

    setSending(true)
    setFeedback(null)

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 25000)

      const res = await fetch("/api/room/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          roomId,
          email: trimmed,
          message: message.trim() || undefined,
          inviteLink,
        }),
      })
      clearTimeout(timeout)

      const data = await res.json()

      if (data.ok) {
        setFeedback({ type: "ok", text: `Invite sent to ${trimmed}!` })
        return
      }

      if (data.fallback === "mailto" && data.mailtoUrl) {
        window.location.href = data.mailtoUrl as string
        setFeedback({
          type: "info",
          text: "Your email app opened — send the invite from there, or copy the link below.",
        })
        return
      }

      setFeedback({ type: "err", text: data.error ?? "Could not send invite" })
    } catch (err) {
      const msg =
        err instanceof Error && err.name === "AbortError"
          ? "Request timed out — try Email app or Copy link"
          : "Network error — try Email app or Copy link"
      setFeedback({ type: "err", text: msg })
    } finally {
      setSending(false)
    }
  }, [roomId, inviteLink, message, disabled, sending, email])

  return (
    <div className="shrink-0 px-3 py-3 border-b border-[#403d39] space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-[#888] font-semibold">
        Invite a friend
      </p>

      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          if (feedback) setFeedback(null)
        }}
        onKeyDown={(e) => e.key === "Enter" && void sendInvite()}
        placeholder="friend@email.com"
        disabled={disabled || sending}
        autoComplete="email"
        className="w-full bg-[#403d39] border border-[#5a5652] rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-[#777] focus:outline-none focus:border-[#81b64c] disabled:opacity-50"
      />

      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Optional message…"
        disabled={disabled || sending}
        maxLength={500}
        className="w-full bg-[#403d39] border border-[#5a5652] rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-[#777] focus:outline-none focus:border-[#81b64c] disabled:opacity-50"
      />

      <div className="flex gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => void sendInvite()}
          disabled={disabled || sending || !isValidEmail(email.trim())}
          className="flex-1 min-w-[100px] py-2 bg-[#81b64c] hover:bg-[#9bc55c] disabled:opacity-50 rounded-lg text-[#262421] text-xs font-bold transition-colors"
        >
          {sending ? "Sending…" : "Auto send"}
        </button>
        <button
          type="button"
          onClick={openEmailApp}
          disabled={disabled || !isValidEmail(email.trim())}
          className="flex-1 min-w-[100px] py-2 bg-[#369] hover:bg-[#4a8] disabled:opacity-50 rounded-lg text-white text-xs font-bold transition-colors"
        >
          Email app
        </button>
        <button
          type="button"
          onClick={copyLink}
          className="px-3 py-2 bg-[#403d39] hover:bg-[#4a4744] rounded-lg text-[#ccc] text-xs font-bold transition-colors"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>

      {feedback && (
        <p
          className={`text-[11px] leading-snug ${
            feedback.type === "ok"
              ? "text-[#81b64c]"
              : feedback.type === "info"
                ? "text-[#aaa]"
                : "text-red-400"
          }`}
        >
          {feedback.text}
        </p>
      )}
    </div>
  )
}
