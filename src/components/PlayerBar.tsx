"use client"

import { ChessPieceIcon } from "./ChessPieces"
import type { PieceType } from "@/lib/chess/captured"

interface PlayerBarProps {
  name: string
  rating?: number
  color: "w" | "b"
  isActive: boolean
  isThinking?: boolean
  captured?: PieceType[]
  capturedPieceColor?: "w" | "b"
  materialAdvantage?: string | null
}

export default function PlayerBar({
  name,
  rating,
  color,
  isActive,
  isThinking,
  captured = [],
  capturedPieceColor,
  materialAdvantage,
}: PlayerBarProps) {
  const oppColor = capturedPieceColor ?? (color === "w" ? "b" : "w")

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
        isActive ? "bg-[#3a3937]" : "bg-[#262421]"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 ${
          color === "w"
            ? "bg-[#f0d9b5] border-[#b58863] text-[#262421]"
            : "bg-[#4a3728] border-[#b58863] text-[#f0d9b5]"
        }`}
      >
        <ChessPieceIcon color={color} type="k" size={26} />
      </div>

      <div className="flex-1 min-w-0 flex items-center gap-2">
        <div className="shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold text-sm truncate">{name}</span>
            {rating && <span className="text-[#999] text-xs">({rating})</span>}
          </div>
          {isThinking && (
            <span className="text-[#81b64c] text-xs animate-pulse">Thinking...</span>
          )}
        </div>

        {/* Captured pieces inline */}
        <div className="flex items-center gap-0.5 flex-wrap flex-1 min-w-0">
          {captured.map((type, i) => (
            <ChessPieceIcon key={`${type}-${i}`} color={oppColor} type={type} size={20} />
          ))}
          {materialAdvantage && (
            <span className="text-[#81b64c] text-xs font-bold ml-0.5 tabular-nums">
              {materialAdvantage}
            </span>
          )}
        </div>
      </div>

      <div className="text-[#999] text-xs font-mono tabular-nums shrink-0">--:--</div>
    </div>
  )
}
