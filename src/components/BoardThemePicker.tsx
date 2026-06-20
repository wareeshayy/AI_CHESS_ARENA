"use client"

import { BOARD_THEME_LIST, type BoardThemeId } from "@/lib/chess/board-themes"

interface BoardThemePickerProps {
  value: BoardThemeId
  onChange: (id: BoardThemeId) => void
}

export default function BoardThemePicker({ value, onChange }: BoardThemePickerProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
      <span className="text-[10px] uppercase tracking-wider text-[#888] shrink-0 font-semibold">Board</span>
      {BOARD_THEME_LIST.map((theme) => {
        const active = value === theme.id
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => onChange(theme.id)}
            title={theme.name}
            className={`shrink-0 flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${
              active
                ? "ring-2 ring-[#81b64c] bg-[#403d39]"
                : "ring-1 ring-[#5a5652] hover:ring-[#81b64c]/60 bg-[#363430]"
            }`}
          >
            <div
              className="w-10 h-10 rounded overflow-hidden border border-black/30"
              style={{
                backgroundImage: `url(${theme.boardImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <span className="text-[9px] text-[#ccc] whitespace-nowrap max-w-[52px] truncate">
              {theme.emoji} {theme.name.split(" ")[0]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
