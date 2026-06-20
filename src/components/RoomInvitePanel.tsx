"use client"

import { useCallback, useRef, useState } from "react"
import { isValidEmail } from "@/lib/email/validate"

interface RoomInvitePanelProps {
  roomId: string
  inviteLink: string
  disabled?: boolean
}

export default function RoomInvitePanel({ roomId, inviteLink, disabled }: RoomInvitePanelProps) {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const lastSentRef = useRef("")

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

      if (res.ok && data.ok) {
        lastSentRef.current = trimmed
        setFeedback({ type: "ok", text: `Invite sent to ${trimmed}!` })
        return
      }

      setFeedback({ type: "err", text: data.error ?? "Could not send invite" })
    } catch (err) {
      const msg = err instanceof Error && err.name === "AbortError"
        ? "Request timed out — try again"
        : "Network error — try again"
      setFeedback({ type: "err", text: msg })
    } finally {
      setSending(false)
    }
  }, [roomId, inviteLink, message, disabled, sending, email])

  const handleEmailBlur = () => {
    const trimmed = email.trim()
    if (isValidEmail(trimmed) && trimmed !== lastSentRef.current && !disabled) {
      void sendInvite()
    }
  }

  return (
    <div className="shrink-0 px-3 py-3 border-b border-[#403d39] space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-[#888] font-semibold">
        Invite a friend by email
      </p>

      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          if (feedback) setFeedback(null)
        }}
        onBlur={handleEmailBlur}
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

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => void sendInvite()}
          disabled={disabled || sending || !isValidEmail(email.trim())}
          className="flex-1 py-2 bg-[#81b64c] hover:bg-[#9bc55c] disabled:opacity-50 rounded-lg text-[#262421] text-xs font-bold transition-colors"
        >
          {sending ? "Sending…" : "Send invite"}
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
        <p className={`text-[11px] ${feedback.type === "ok" ? "text-[#81b64c]" : "text-red-400"}`}>
          {feedback.text}
        </p>
      )}
    </div>
  )
}
