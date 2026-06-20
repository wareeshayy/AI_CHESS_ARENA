"use client"

import { useRef, useEffect, useState, type ReactNode } from "react"
import MoveList from "./MoveList"
import PlaybackControls from "./PlaybackControls"
import GameSettingsAccordion from "./GameSettingsAccordion"
import type { CoachSentiment, MoveQuality } from "@/lib/ai/coach"
import type { BoardThemeId } from "@/lib/chess/board-themes"
import type { Difficulty, Personality } from "@/lib/types/game"
import { formatEvalScore } from "./EvalBar"

export interface CoachMessage {
  role: "coach" | "user"
  content: string
  timestamp: number
  sentiment?: CoachSentiment
  moveSan?: string
  quality?: MoveQuality
  eval?: number
}

interface CoachPanelProps {
  coachName: string
  coachRating?: number
  messages: CoachMessage[]
  isThinking: boolean
  speechEnabled: boolean
  onToggleSpeech: () => void
  onAskCoach?: (message: string) => void
  onExplain?: (focus: "position" | "best-move" | "last-move") => void
  chatLoading?: boolean
  moves: { san: string; timeSpent?: number; evaluation?: number }[]
  currentMoveIndex: number
  onMoveClick: (index: number) => void
  showAnalysis: boolean
  onHint: () => void
  onResign: () => void
  isPlaying: boolean
  onFirst: () => void
  onPrev: () => void
  onPlayPause: () => void
  onNext: () => void
  onLast: () => void
  onFlip: () => void
  onFullReplay: () => void
  onNewGame?: () => void
  newGameLoading?: boolean
  gameOverMessage?: string | null
  settings?: {
    difficulty: Difficulty
    personality: Personality
    playerColor: "w" | "b"
    boardTheme: BoardThemeId
    onDifficultyChange: (d: Difficulty) => void
    onPersonalityChange: (p: Personality) => void
    onPlayerColorChange: (c: "w" | "b") => void
    onBoardThemeChange: (t: BoardThemeId) => void
  }
}

export default function CoachPanel({
  coachName,
  coachRating = 400,
  messages,
  isThinking,
  speechEnabled,
  onToggleSpeech,
  onAskCoach,
  onExplain,
  chatLoading = false,
  moves,
  currentMoveIndex,
  onMoveClick,
  showAnalysis,
  onHint,
  onResign,
  isPlaying,
  onFirst,
  onPrev,
  onPlayPause,
  onNext,
  onLast,
  onFlip,
  onFullReplay,
  onNewGame,
  newGameLoading = false,
  gameOverMessage,
  settings,
}: CoachPanelProps) {
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [chatInput, setChatInput] = useState("")

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isThinking, chatLoading])

  const submitChat = () => {
    const text = chatInput.trim()
    if (!text || !onAskCoach || chatLoading) return
    onAskCoach(text)
    setChatInput("")
  }

  return (
    <div className="flex flex-col h-full bg-[#262421] text-[#ebebeb] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#403d39] shrink-0">
        <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <span className="text-base">🤖</span> Play Coach
        </h2>
        <button
          onClick={onToggleSpeech}
          title={speechEnabled ? "Mute coach voice" : "Enable coach voice"}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            speechEnabled
              ? "bg-[#403d39] text-[#81b64c] hover:bg-[#4a4744]"
              : "bg-[#403d39] text-[#666] hover:bg-[#4a4744]"
          }`}
        >
          {speechEnabled ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          )}
        </button>
      </div>

      {gameOverMessage && (
        <div className="shrink-0 bg-[#81b64c]/20 border-b border-[#81b64c]/30 px-3 py-1.5 text-center text-[11px] font-semibold text-[#81b64c]">
          {gameOverMessage}
        </div>
      )}

      {settings && (
        <GameSettingsAccordion
          difficulty={settings.difficulty}
          personality={settings.personality}
          playerColor={settings.playerColor}
          boardTheme={settings.boardTheme}
          onDifficultyChange={settings.onDifficultyChange}
          onPersonalityChange={settings.onPersonalityChange}
          onPlayerColorChange={settings.onPlayerColorChange}
          onBoardThemeChange={settings.onBoardThemeChange}
        />
      )}

      <div className="flex-1 overflow-y-auto min-h-0 px-3 py-2 space-y-3 scrollbar-thin">
        {messages.length === 0 && !isThinking && (
          <CoachBubble
            name={coachName}
            rating={coachRating}
            text="Setting up your game..."
            sentiment="tip"
          />
        )}

        {messages.map((msg, i) =>
          msg.role === "coach" ? (
            <CoachBubble
              key={i}
              name={coachName}
              rating={coachRating}
              text={msg.content}
              sentiment={msg.sentiment}
              moveSan={msg.moveSan}
              quality={msg.quality}
              eval={msg.eval}
            />
          ) : (
            <div key={i} className="flex justify-end">
              <div className="bg-[#369] text-white text-sm rounded-2xl rounded-tr-sm px-3 py-2 max-w-[85%]">
                {msg.content}
              </div>
            </div>
          ),
        )}

        {isThinking && (
          <div className="flex items-center gap-2 pl-12">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-[#666] rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-[#666] rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-[#666] rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        {chatLoading && (
          <div className="flex items-center gap-2 pl-12 text-xs text-[#888]">Coach is thinking...</div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="shrink-0 px-3 py-2 border-t border-[#403d39] flex items-center justify-around bg-[#2a2826]">
        <ToolbarBtn onClick={onHint} title="Hint" label="Hint">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
          </svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={onFlip} title="Flip board" label="Flip">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6zM6 6h12v2H6V6z" />
          </svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={onFullReplay} title="Replay" label="Replay">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
          </svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={onResign} title="Resign" label="Resign">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z" />
          </svg>
        </ToolbarBtn>
      </div>

      {onExplain && (
        <div className="px-3 py-1.5 border-t border-[#403d39] flex flex-wrap gap-1 shrink-0">
          {(
            [
              ["position", "Explain position"],
              ["best-move", "Best move"],
              ["last-move", "Last move"],
            ] as const
          ).map(([focus, label]) => (
            <button
              key={focus}
              type="button"
              disabled={chatLoading}
              onClick={() => onExplain(focus)}
              className="text-[10px] font-semibold px-2 py-1 rounded-full bg-[#403d39] hover:bg-[#4a4744] text-[#ccc] hover:text-white disabled:opacity-50 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {onAskCoach && (
        <div className="px-3 py-1.5 border-t border-[#403d39] flex gap-2 shrink-0">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitChat()}
            placeholder="Ask your coach..."
            disabled={chatLoading}
            className="flex-1 bg-[#403d39] border border-[#5a5652] rounded-lg px-2 py-1.5 text-xs text-white placeholder:text-[#777] focus:outline-none focus:border-[#81b64c]"
          />
          <button
            type="button"
            onClick={submitChat}
            disabled={chatLoading || !chatInput.trim()}
            className="px-2.5 py-1.5 bg-[#81b64c] hover:bg-[#9bc55c] disabled:opacity-50 rounded-lg text-[#262421] font-bold text-xs"
          >
            Ask
          </button>
        </div>
      )}

      <div className="border-t border-[#403d39] max-h-[100px] flex flex-col min-h-0 shrink-0">
        <MoveList
          moves={moves}
          currentMoveIndex={currentMoveIndex}
          onMoveClick={onMoveClick}
          showAnalysis={showAnalysis}
        />
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
        onReset={onResign}
        onFullReplay={onFullReplay}
        compact
      />

      {onNewGame && (
        <div className="shrink-0 p-3 border-t border-[#403d39] bg-[#262421]">
          <button
            type="button"
            onClick={onNewGame}
            disabled={newGameLoading}
            className="w-full py-3.5 bg-[#81b64c] hover:bg-[#9bc55c] disabled:opacity-50 rounded-lg font-bold text-[#262421] text-sm transition-colors"
          >
            {newGameLoading ? "Starting..." : "New Game"}
          </button>
        </div>
      )}
    </div>
  )
}

function CoachBubble({
  name,
  rating,
  text,
  sentiment = "neutral",
  moveSan,
  quality,
  eval: evalScore,
}: {
  name: string
  rating: number
  text: string
  sentiment?: CoachSentiment
  moveSan?: string
  quality?: MoveQuality
  eval?: number
}) {
  const showHeader = moveSan && quality && quality !== "good"

  return (
    <div className="flex gap-2 items-start">
      <div className="shrink-0 w-9 h-9 rounded-full bg-[#403d39] border-2 border-[#5a5652] flex items-center justify-center">
        <span className="text-lg">🧔</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-xs font-bold text-white">{name}</span>
          <span className="text-[10px] text-[#999]">({rating})</span>
        </div>

        <div className="bg-white text-[#262421] text-xs leading-relaxed rounded-lg rounded-tl-sm px-3 py-2 shadow-sm">
          {showHeader && (
            <div className="flex items-center gap-2 mb-1 pb-1 border-b border-[#e0e0e0]">
              <span className="font-bold text-[11px]">
                {moveSan} is {quality === "excellent" ? "excellent" : quality}
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

function ToolbarBtn({
  children,
  onClick,
  title,
  label,
}: {
  children: ReactNode
  onClick: () => void
  title: string
  label: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[#888] hover:text-[#ccc] hover:bg-[#403d39] transition-colors"
    >
      {children}
      <span className="text-[9px] font-semibold">{label}</span>
    </button>
  )
}
