"use client"

interface PlaybackControlsProps {
  currentMoveIndex: number
  totalMoves: number
  isPlaying: boolean
  onFirst: () => void
  onPrev: () => void
  onPlayPause: () => void
  onNext: () => void
  onLast: () => void
  onFlip: () => void
  onReset: () => void
  onFullReplay: () => void
}

export default function PlaybackControls({
  currentMoveIndex,
  totalMoves,
  isPlaying,
  onFirst,
  onPrev,
  onPlayPause,
  onNext,
  onLast,
  onFlip,
  onReset,
  onFullReplay,
}: PlaybackControlsProps) {
  return (
    <div className="border-t border-[#333] p-2 space-y-2">
      {totalMoves > 0 && (
        <button
          onClick={onFullReplay}
          disabled={isPlaying}
          className="w-full py-2 rounded bg-[#81b64c] hover:bg-[#9bc55c] disabled:opacity-50 text-[#262421] text-xs font-bold transition-colors flex items-center justify-center gap-2"
        >
          <span>▶</span> Replay Game
        </button>
      )}
      <div className="flex items-center justify-center gap-1">
        <ControlBtn onClick={onFirst} title="First move" disabled={currentMoveIndex < 0}>
          ⏮
        </ControlBtn>
        <ControlBtn onClick={onPrev} title="Previous" disabled={currentMoveIndex < 0}>
          ◀
        </ControlBtn>
        <ControlBtn onClick={onPlayPause} title={isPlaying ? "Pause" : "Play"} className="w-10">
          {isPlaying ? "⏸" : "▶"}
        </ControlBtn>
        <ControlBtn onClick={onNext} title="Next" disabled={currentMoveIndex >= totalMoves - 1}>
          ▶
        </ControlBtn>
        <ControlBtn onClick={onLast} title="Last move" disabled={currentMoveIndex >= totalMoves - 1}>
          ⏭
        </ControlBtn>
      </div>
      <div className="flex items-center justify-center gap-2">
        <SmallBtn onClick={onFlip} title="Flip board">⇅</SmallBtn>
        <SmallBtn onClick={onReset} title="New game">↻</SmallBtn>
        <span className="text-[10px] text-[#666] ml-2">
          {currentMoveIndex + 1} / {totalMoves}
        </span>
      </div>
    </div>
  )
}

function ControlBtn({
  children,
  onClick,
  title,
  disabled,
  className = "",
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded bg-[#3a3a3a] text-[#ccc] hover:bg-[#4a4a4a] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm ${className}`}
    >
      {children}
    </button>
  )
}

function SmallBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded bg-[#333] text-[#888] hover:bg-[#444] hover:text-white transition-colors text-xs"
    >
      {children}
    </button>
  )
}
