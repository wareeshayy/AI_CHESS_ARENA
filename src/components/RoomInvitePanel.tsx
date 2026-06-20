"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { isValidEmail } from "@/lib/email/invite"

interface RoomInvitePanelProps {
  roomId: string
  inviteLink: string
  disabled?: boolean
}

export default function RoomInvitePanel({ roomId, inviteLink, disabled }: RoomInvitePanelProps) {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "ok" | "err" | "info"; text: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const lastSentRef = useRef("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sendInvite = useCallback(
    async (targetEmail: string) => {
      const trimmed = targetEmail.trim()
      if (!trimmed || !isValidEmail(trimmed) || disabled) return
      if (lastSentRef.current === trimmed) return

      setSending(true)
      setFeedback({ type: "info", text: `Sending invite to ${trimmed}…` })

      try {
        const res = await fetch("/api/room/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId,
            email: trimmed,
            message: message.trim() || undefined,
            inviteLink,
          }),
        })
        const data = await res.json()

        if (res.ok && data.ok) {
          lastSentRef.current = trimmed
          setFeedback({ type: "ok", text: `Invite sent to ${trimmed}!` })
          return
        }

        setFeedback({ type: "err", text: data.error ?? "Could not send invite" })
      } catch {
        setFeedback({ type: "err", text: "Network error — try again" })
      } finally {
        setSending(false)
      }
    },
    [roomId, inviteLink, message, disabled],
  )

  // Auto-send when a valid email is entered (debounced)
  useEffect(() => {
    if (disabled || sending) return

    const trimmed = email.trim()
    if (!isValidEmail(trimmed)) {
      if (!trimmed) setFeedback(null)
      return
    }

    if (lastSentRef.current === trimmed) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void sendInvite(trimmed)
    }, 700)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [email, disabled, sending, sendInvite])

  // Re-send with updated message if email already sent
  useEffect(() => {
    if (disabled || sending || !message.trim()) return
    const trimmed = email.trim()
    if (!isValidEmail(trimmed) || lastSentRef.current !== trimmed) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      lastSentRef.current = ""
      void sendInvite(trimmed)
    }, 1200)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-send when message changes
  }, [message])

  return (
    <div className="shrink-0 px-3 py-3 border-b border-[#403d39] space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-[#888] font-semibold">
        Invite friend — email sends automatically
      </p>

      <input
        type="email"
        value={email}
        onChange={(e) => {
          const next = e.target.value
          if (lastSentRef.current && next.trim() !== lastSentRef.current) {
            lastSentRef.current = ""
          }
          setEmail(next)
        }}
        placeholder="Enter friend&apos;s email…"
        disabled={disabled}
        autoComplete="email"
        className="w-full bg-[#403d39] border border-[#5a5652] rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-[#777] focus:outline-none focus:border-[#81b64c] disabled:opacity-50"
      />

      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Optional message (included in email)…"
        disabled={disabled}
        maxLength={500}
        className="w-full bg-[#403d39] border border-[#5a5652] rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-[#777] focus:outline-none focus:border-[#81b64c] disabled:opacity-50"
      />

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={copyLink}
          className="flex-1 py-2 bg-[#403d39] hover:bg-[#4a4744] rounded-lg text-[#ccc] text-xs font-bold transition-colors"
        >
          {copied ? "Link copied!" : "Copy room link"}
        </button>
      </div>

      {sending && (
        <p className="text-[11px] text-[#aaa] animate-pulse">Generating and sending invite email…</p>
      )}

      {feedback && !sending && (
        <p
          className={`text-[11px] ${
            feedback.type === "ok" ? "text-[#81b64c]" : feedback.type === "info" ? "text-[#aaa]" : "text-red-400"
          }`}
        >
          {feedback.text}
        </p>
      )}
    </div>
  )
}
