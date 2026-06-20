"use client"

import type { ReactNode } from "react"
import { PlainMoveLabel } from "./PlainMoveLabel"

interface MobileMoveStripProps {
  moves: { san: string }[]
  currentMoveIndex: number
  onMoveClick: (index: number) => void
  onPrev: () => void
  onNext: () => void
}

export default function MobileMoveStrip({
  moves,
  currentMoveIndex,
  onMoveClick,
  onPrev,
  onNext,
}: MobileMoveStripProps) {
  if (moves.length === 0) return null

  return (
    <div className="lg:hidden shrink-0 flex items-center gap-0.5 px-1 py-1 bg-[#262421] border-t border-[#403d39]">
      <NavBtn onClick={onPrev} disabled={currentMoveIndex < 0} label="Previous move">
        ◀
      </NavBtn>

      <div className="flex-1 overflow-x-auto flex items-center gap-1 px-1 scrollbar-thin min-w-0">
        {moves.map((move, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onMoveClick(i)}
            className={`shrink-0 px-2 py-1 rounded text-xs transition-colors ${
              i === currentMoveIndex
                ? "bg-[#b58863] text-[#262421]"
                : "text-[#ccc] hover:bg-[#3a3a3a]"
            }`}
          >
            <PlainMoveLabel
              san={move.san}
              color={i % 2 === 0 ? "w" : "b"}
              size={16}
              variant="short"
            />
          </button>
        ))}
      </div>

      <NavBtn
        onClick={onNext}
        disabled={currentMoveIndex >= moves.length - 1}
        label="Next move"
      >
        ▶
      </NavBtn>
    </div>
  )
}

function NavBtn({
  children,
  onClick,
  disabled,
  label,
}: {
  children: ReactNode
  onClick: () => void
  disabled: boolean
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="shrink-0 w-8 h-8 flex items-center justify-center rounded text-[#aaa] hover:text-white hover:bg-[#403d39] disabled:opacity-30 transition-colors text-sm"
    >
      {children}
    </button>
  )
}
