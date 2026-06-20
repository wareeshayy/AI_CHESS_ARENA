"use client"

import type { MoveQuality } from "@/lib/ai/coach"

interface EvalBarProps {
  evaluation: number
  orientation: "white" | "black"
}

export function EvalBar({ evaluation, orientation }: EvalBarProps) {
  const clamped = Math.max(-8, Math.min(8, evaluation))
  const whitePct = 50 + (clamped / 8) * 50
  const whiteOnTop = orientation === "white"

  return (
    <div className="w-5 shrink-0 overflow-hidden self-stretch min-h-[200px] flex flex-col border border-[#211f1c] border-r-0">
      {whiteOnTop ? (
        <>
          <div className="bg-[#eeeed2] transition-all duration-500" style={{ flex: whitePct }} />
          <div className="bg-[#b58863] transition-all duration-500" style={{ flex: 100 - whitePct }} />
        </>
      ) : (
        <>
          <div className="bg-[#b58863] transition-all duration-500" style={{ flex: 100 - whitePct }} />
          <div className="bg-[#eeeed2] transition-all duration-500" style={{ flex: whitePct }} />
        </>
      )}
    </div>
  )
}

interface MoveBadgeProps {
  quality: MoveQuality
  square: string
  orientation: "white" | "black"
}

export function MoveQualityBadge({ quality, square, orientation }: MoveBadgeProps) {
  if (!quality || quality === "good") return null

  const file = square.charCodeAt(0) - 97
  const rank = parseInt(square[1], 10)
  const row = orientation === "white" ? 8 - rank : rank - 1
  const col = orientation === "white" ? file : 7 - file

  const bg =
    quality === "excellent"
      ? "bg-[#81b64c]"
      : quality === "inaccuracy"
        ? "bg-[#f0a030]"
        : "bg-[#e74c3c]"

  return (
    <div
      className="absolute pointer-events-none z-10"
      style={{ left: `${(col / 8) * 100}%`, top: `${(row / 8) * 100}%`, width: "12.5%", height: "12.5%" }}
    >
      <div
        className={`absolute top-0.5 right-0.5 w-5 h-5 rounded-full ${bg} flex items-center justify-center shadow-md border border-white/30`}
      >
        {quality === "excellent" ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
            <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
          </svg>
        ) : (
          <span className="text-white text-[9px] font-bold">
            {quality === "inaccuracy" ? "?!" : quality === "mistake" ? "?" : "??"}
          </span>
        )}
      </div>
    </div>
  )
}

export function formatEvalScore(eval_: number): string {
  const sign = eval_ >= 0 ? "+" : ""
  return `${sign}${eval_.toFixed(2)}`
}
