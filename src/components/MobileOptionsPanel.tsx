"use client"

import BoardThemePicker from "./BoardThemePicker"
import MoveList from "./MoveList"
import PlaybackControls from "./PlaybackControls"
import type { BoardThemeId } from "@/lib/chess/board-themes"

interface MobileOptionsPanelProps {
  boardTheme: BoardThemeId
  onBoardThemeChange: (theme: BoardThemeId) => void
  moves: { san: string; timeSpent?: number; evaluation?: number }[]
  currentMoveIndex: number
  onMoveClick: (index: number) => void
  showAnalysis?: boolean
  isPlaying: boolean
  onFirst: () => void
  onPrev: () => void
  onPlayPause: () => void
  onNext: () => void
  onLast: () => void
  onFlip: () => void
  onFullReplay: () => void
}

export default function MobileOptionsPanel({
  boardTheme,
  onBoardThemeChange,
  moves,
  currentMoveIndex,
  onMoveClick,
  showAnalysis = true,
  isPlaying,
  onFirst,
  onPrev,
  onPlayPause,
  onNext,
  onLast,
  onFlip,
  onFullReplay,
}: MobileOptionsPanelProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[#262421] text-[#ebebeb] pb-14">
      <div className="shrink-0 px-3 py-2.5 border-b border-[#403d39]">
        <h2 className="text-sm font-bold text-white">Options</h2>
      </div>

      <div className="shrink-0 px-3 py-3 border-b border-[#403d39] bg-[#2a2826]">
        <BoardThemePicker value={boardTheme} onChange={onBoardThemeChange} layout="grid" />
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        <div className="shrink-0 px-3 py-2 border-b border-[#403d39]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#888]">Move summary</h3>
        </div>
        <div className="flex-1 min-h-[120px] flex flex-col">
          <MoveList
            moves={moves}
            currentMoveIndex={currentMoveIndex}
            onMoveClick={onMoveClick}
            showAnalysis={showAnalysis}
          />
        </div>
      </div>

      <PlaybackControls
        currentMoveIndex={currentMoveIndex}
        totalMoves={moves.length}
        isPlaying={isPlaying}
        onFirst={onFirst}
        onPrev={onPrev}
        onPlayPause={onPlayPause}
        onNext={onNext}
        onLast={onLast}
        onFlip={onFlip}
        onReset={onFlip}
        onFullReplay={onFullReplay}
        compact
      />
    </div>
  )
}
