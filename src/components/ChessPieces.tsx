"use client"

import { NeoPieceImg } from "./NeoPieces"
import type { PieceType } from "@/lib/chess/captured"

interface ChessPieceIconProps {
  color: "w" | "b"
  type: PieceType | "k"
  size?: number
}

/** Renders a chess piece icon (Neo/cburnett set) */
export function ChessPieceIcon({ color, type, size = 28 }: ChessPieceIconProps) {
  return <NeoPieceImg color={color} type={type} size={size} />
}

/** Side-by-side captured pieces for both players */
interface CapturedSideBySideProps {
  playerCaptured: PieceType[]
  aiCaptured: PieceType[]
  playerColor: "w" | "b"
  aiColor: "w" | "b"
  playerAdvantage: string | null
  aiAdvantage: string | null
  playerName: string
  aiName: string
}

export function CapturedSideBySide({
  playerCaptured,
  aiCaptured,
  playerColor,
  aiColor,
  playerAdvantage,
  aiAdvantage,
  playerName,
  aiName,
}: CapturedSideBySideProps) {
  const opponentOfPlayer = playerColor === "w" ? "b" : "w"
  const opponentOfAi = aiColor === "w" ? "b" : "w"

  return (
    <div className="flex items-stretch gap-2 px-2 py-1.5 bg-[#262421] rounded border border-[#403d39]">
      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <span className="text-[10px] text-[#999] uppercase tracking-wide truncate">{playerName}</span>
        <div className="flex items-center gap-px flex-wrap min-h-6">
          {playerCaptured.length === 0 ? (
            <span className="text-[#555] text-xs">—</span>
          ) : (
            playerCaptured.map((type, i) => (
              <ChessPieceIcon key={`p-${type}-${i}`} color={opponentOfPlayer} type={type} size={20} />
            ))
          )}
          {playerAdvantage && (
            <span className="text-[#999] text-xs font-semibold ml-1 tabular-nums">{playerAdvantage}</span>
          )}
        </div>
      </div>

      <div className="w-px bg-[#403d39] shrink-0" />

      <div className="flex-1 flex flex-col gap-0.5 min-w-0 items-end text-right">
        <span className="text-[10px] text-[#999] uppercase tracking-wide truncate">{aiName}</span>
        <div className="flex items-center justify-end gap-px flex-wrap min-h-6">
          {aiAdvantage && (
            <span className="text-[#999] text-xs font-semibold mr-1 tabular-nums">{aiAdvantage}</span>
          )}
          {aiCaptured.length === 0 ? (
            <span className="text-[#555] text-xs">—</span>
          ) : (
            aiCaptured.map((type, i) => (
              <ChessPieceIcon key={`a-${type}-${i}`} color={opponentOfAi} type={type} size={20} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
