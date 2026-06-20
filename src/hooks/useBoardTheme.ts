"use client"

import { useCallback, useState } from "react"
import { DEFAULT_BOARD_THEME, type BoardThemeId } from "@/lib/chess/board-themes"

const STORAGE_KEY = "chess-board-theme"

function readStoredTheme(): BoardThemeId {
  if (typeof window === "undefined") return DEFAULT_BOARD_THEME
  const saved = localStorage.getItem(STORAGE_KEY) as BoardThemeId | null
  return saved ?? DEFAULT_BOARD_THEME
}

export function useBoardTheme() {
  const [themeId, setThemeIdState] = useState<BoardThemeId>(readStoredTheme)

  const setThemeId = useCallback((id: BoardThemeId) => {
    setThemeIdState(id)
    localStorage.setItem(STORAGE_KEY, id)
  }, [])

  return { themeId, setThemeId }
}
