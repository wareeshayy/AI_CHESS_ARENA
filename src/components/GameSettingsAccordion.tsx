"use client"

import { useState } from "react"
import BoardThemePicker from "./BoardThemePicker"
import type { BoardThemeId } from "@/lib/chess/board-themes"
import type { Difficulty, Personality } from "@/lib/types/game"

interface GameSettingsAccordionProps {
  difficulty: Difficulty
  personality: Personality
  playerColor: "w" | "b"
  boardTheme: BoardThemeId
  onDifficultyChange: (d: Difficulty) => void
  onPersonalityChange: (p: Personality) => void
  onPlayerColorChange: (c: "w" | "b") => void
  onBoardThemeChange: (t: BoardThemeId) => void
}

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"]
const PERSONALITIES: { id: Personality; label: string }[] = [
  { id: "friendly_coach", label: "Friendly Coach" },
  { id: "grandmaster", label: "Grandmaster" },
  { id: "aggressive_rival", label: "Aggressive Rival" },
  { id: "casual_opponent", label: "Casual Opponent" },
]

export default function GameSettingsAccordion({
  difficulty,
  personality,
  playerColor,
  boardTheme,
  onDifficultyChange,
  onPersonalityChange,
  onPlayerColorChange,
  onBoardThemeChange,
}: GameSettingsAccordionProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-[#403d39] shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-[#ccc] hover:bg-[#2e2c29] transition-colors"
      >
        <span className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-[#888]">
            <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
          Options
        </span>
        <span className="text-[#666] text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3 bg-[#2a2826]">
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-[#888] font-semibold">Difficulty</span>
            <select
              value={difficulty}
              onChange={(e) => onDifficultyChange(e.target.value as Difficulty)}
              className="mt-1 w-full bg-[#403d39] border border-[#5a5652] rounded-lg px-2 py-2 text-xs text-[#ebebeb]"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-[#888] font-semibold">Opponent</span>
            <select
              value={personality}
              onChange={(e) => onPersonalityChange(e.target.value as Personality)}
              className="mt-1 w-full bg-[#403d39] border border-[#5a5652] rounded-lg px-2 py-2 text-xs text-[#ebebeb]"
            >
              {PERSONALITIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#888] font-semibold">Play as</span>
            <div className="mt-1 flex gap-1">
              {(["w", "b"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onPlayerColorChange(c)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                    playerColor === c
                      ? "bg-[#81b64c] text-[#262421]"
                      : "bg-[#403d39] text-[#aaa] hover:bg-[#4a4744]"
                  }`}
                >
                  {c === "w" ? "♔ White" : "♚ Black"}
                </button>
              ))}
            </div>
          </div>

          <BoardThemePicker value={boardTheme} onChange={onBoardThemeChange} layout="grid" />
        </div>
      )}
    </div>
  )
}
