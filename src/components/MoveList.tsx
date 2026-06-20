"use client"

import {
  groupMovesIntoPairs,
  evaluationToBarHeight,
  evaluationBarColor,
} from "@/lib/chess/notation"
import { PlainMoveLabel } from "./PlainMoveLabel"

interface MoveListProps {
  moves: { san: string; timeSpent?: number; evaluation?: number }[]
  currentMoveIndex: number
  onMoveClick: (index: number) => void
  showAnalysis?: boolean
}

function MoveCell({
  san,
  color,
  index,
  isActive,
  timeSpent,
  onClick,
}: {
  san: string
  color: "w" | "b"
  index: number
  isActive: boolean
  timeSpent?: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors min-w-0 ${
        isActive
          ? "bg-[#b58863] text-[#262421]"
          : "text-[#ccc] hover:bg-[#3a3a3a] hover:text-white"
      }`}
    >
      <PlainMoveLabel san={san} color={color} size={18} variant="short" className="truncate" />
      {timeSpent !== undefined && (
        <span className="ml-0.5 text-[10px] text-[#888] shrink-0">{timeSpent.toFixed(1)}s</span>
      )}
    </button>
  )
}

export default function MoveList({
  moves,
  currentMoveIndex,
  onMoveClick,
  showAnalysis = true,
}: MoveListProps) {
  const pairs = groupMovesIntoPairs(moves)

  if (pairs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#666] text-sm">
        No moves yet. Make your first move!
      </div>
    )
  }

  return (
    <div className="flex flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {pairs.map((pair) => (
          <div
            key={pair.number}
            className={`flex items-center text-sm border-b border-[#333] ${
              pair.number % 2 === 0 ? "bg-[#2a2a2a]" : "bg-[#262626]"
            }`}
          >
            <span className="w-10 shrink-0 text-right pr-2 text-[#888] font-mono text-xs">
              {pair.number}.
            </span>
            <div className="flex-1 flex min-w-0">
              {pair.white && (
                <MoveCell
                  san={pair.white.san}
                  color="w"
                  index={pair.white.index}
                  isActive={currentMoveIndex === pair.white.index}
                  timeSpent={pair.white.timeSpent}
                  onClick={() => onMoveClick(pair.white!.index)}
                />
              )}
              {pair.black && (
                <MoveCell
                  san={pair.black.san}
                  color="b"
                  index={pair.black.index}
                  isActive={currentMoveIndex === pair.black.index}
                  timeSpent={pair.black.timeSpent}
                  onClick={() => onMoveClick(pair.black!.index)}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {showAnalysis && (
        <div className="w-3 shrink-0 flex flex-col gap-px py-1 bg-[#1a1a1a]">
          {pairs.map((pair) => {
            const eval_ = pair.black?.evaluation ?? pair.white?.evaluation
            const height = evaluationToBarHeight(eval_)
            const color = evaluationBarColor(eval_)
            return (
              <div
                key={pair.number}
                className="flex-1 min-h-[28px] relative bg-[#333] rounded-sm mx-0.5 overflow-hidden"
              >
                <div
                  className="absolute bottom-0 left-0 right-0 transition-all duration-300"
                  style={{ height: `${height}%`, backgroundColor: color }}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
