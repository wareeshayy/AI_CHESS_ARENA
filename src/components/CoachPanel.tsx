"use client"

import { useRef, useEffect } from "react"
import MoveList from "./MoveList"
import PlaybackControls from "./PlaybackControls"
import type { CoachSentiment, MoveQuality } from "@/lib/ai/coach"
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
}

export default function CoachPanel({
  coachName,
  coachRating = 400,
  messages,
  isThinking,
  speechEnabled,
  onToggleSpeech,
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
}: CoachPanelProps) {
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isThinking])

  return (
    <div className="flex flex-col h-full bg-[#262421] text-[#ebebeb] rounded overflow-hidden border border-[#403d39]">
      {/* Header — Play Coach */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#403d39] bg-[#262421]">
        <h2 className="text-base font-bold text-white tracking-tight">Game Review</h2>
        <button
          onClick={onToggleSpeech}
          title={speechEnabled ? "Mute coach voice" : "Enable coach voice"}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            speechEnabled
              ? "bg-[#403d39] text-[#81b64c] hover:bg-[#4a4744]"
              : "bg-[#403d39] text-[#666] hover:bg-[#4a4744]"
          }`}
        >
          {speechEnabled ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          )}
        </button>
      </div>

      {/* Coach avatar + messages */}
      <div className="flex-1 overflow-y-auto min-h-0 px-3 py-3 space-y-4">
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
              <div className="bg-[#369] text-white text-sm rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%]">
                {msg.content}
              </div>
            </div>
          ),
        )}

        {isThinking && (
          <div className="flex items-center gap-2 pl-14">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-[#666] rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-[#666] rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-[#666] rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Move list */}
      <div className="border-t border-[#403d39] max-h-[180px] flex flex-col min-h-0 shrink-0">
        <MoveList
          moves={moves}
          currentMoveIndex={currentMoveIndex}
          onMoveClick={onMoveClick}
          showAnalysis={showAnalysis}
        />
      </div>

      {/* Playback */}
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
      />

      {/* Action buttons — Chess.com style */}
      <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-[#403d39] bg-[#262421]">
        <ActionBtn onClick={onResign} title="Resign" label="Resign">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z" />
          </svg>
        </ActionBtn>
        <ActionBtn onClick={onHint} title="Get a hint" label="Hint" primary>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
          </svg>
        </ActionBtn>
        <ActionBtn onClick={onFullReplay} title="Replay game" label="Replay">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
          </svg>
        </ActionBtn>
      </div>
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
    <div className="flex gap-3 items-start">
      <div className="shrink-0 w-11 h-11 rounded-full bg-[#403d39] border-2 border-[#5a5652] flex items-center justify-center">
        <span className="text-2xl">🧔</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 mb-1.5">
          <span className="text-sm font-bold text-white">{name}</span>
          <span className="text-xs text-[#999]">({rating})</span>
        </div>

        <div className="bg-white text-[#262421] text-sm leading-relaxed rounded-lg rounded-tl-sm px-4 py-3 shadow-sm">
          {showHeader && (
            <div className="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-[#e0e0e0]">
              <span className="font-bold">
                {moveSan} is {quality === "excellent" ? "excellent" : quality}
              </span>
              {quality === "excellent" && (
                <span className="w-5 h-5 rounded-full bg-[#81b64c] flex items-center justify-center">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
                    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                  </svg>
                </span>
              )}
              {evalScore !== undefined && (
                <span className="text-[#81b64c] text-xs font-bold ml-auto tabular-nums">
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

function ActionBtn({
  children,
  onClick,
  title,
  label,
  primary,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  label: string
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
        primary
          ? "bg-[#403d39] hover:bg-[#4a4744] text-[#81b64c]"
          : "bg-[#403d39] hover:bg-[#4a4744] text-[#999] hover:text-[#ccc]"
      }`}
    >
      {children}
      <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
    </button>
  )
}
