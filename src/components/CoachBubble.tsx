"use client"

import type { CoachSentiment, MoveQuality } from "@/lib/ai/coach"
import { formatEvalScore } from "./EvalBar"
import { PlainMoveLabel } from "./PlainMoveLabel"

export interface CoachBubbleProps {
  name: string
  rating: number
  text: string
  sentiment?: CoachSentiment
  moveSan?: string
  moveColor?: "w" | "b"
  quality?: MoveQuality
  eval?: number
  compact?: boolean
}

export default function CoachBubble({
  name,
  rating,
  text,
  sentiment = "neutral",
  moveSan,
  moveColor = "w",
  quality,
  eval: evalScore,
  compact = false,
}: CoachBubbleProps) {
  const showHeader = moveSan && quality && quality !== "good"

  return (
    <div className={`flex gap-2 items-start ${compact ? "px-2 py-1.5" : ""}`}>
      <div
        className={`shrink-0 rounded-full bg-[#403d39] border-2 border-[#5a5652] flex items-center justify-center ${
          compact ? "w-8 h-8" : "w-9 h-9"
        }`}
      >
        <span className={compact ? "text-base" : "text-lg"}>🧔</span>
      </div>

      <div className="flex-1 min-w-0">
        {!compact && (
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-xs font-bold text-white">{name}</span>
            <span className="text-[10px] text-[#999]">({rating})</span>
          </div>
        )}

        <div
          className={`bg-white text-[#262421] leading-relaxed rounded-lg rounded-tl-sm shadow-sm ${
            compact ? "text-[11px] px-2.5 py-1.5" : "text-xs px-3 py-2"
          }`}
        >
          {showHeader && moveSan && (
            <div className="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-[#e0e0e0] flex-wrap">
              <PlainMoveLabel san={moveSan} color={moveColor} size={20} variant="short" />
              <span className="font-bold text-[11px] capitalize">
                — {quality === "excellent" ? "excellent!" : quality}
              </span>
              {evalScore !== undefined && (
                <span className="text-[#81b64c] text-[10px] font-bold ml-auto tabular-nums">
                  {formatEvalScore(evalScore)}
                </span>
              )}
            </div>
          )}
          <p className="text-[#333]">{text}</p>
        </div>
      </div>
    </div>
  )
}
