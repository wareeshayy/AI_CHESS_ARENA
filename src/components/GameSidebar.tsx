"use client"

import { useState, useRef, useEffect } from "react"
import MoveList from "./MoveList"
import PlaybackControls from "./PlaybackControls"
import type { ChatMessage } from "@/lib/types/game"

type Tab = "moves" | "chat" | "info"

interface GameSidebarProps {
  moves: { san: string; timeSpent?: number; evaluation?: number }[]
  currentMoveIndex: number
  onMoveClick: (index: number) => void
  chatHistory: ChatMessage[]
  onSendMessage: (message: string) => void
  isLoading: boolean
  showAnalysis: boolean
  onToggleAnalysis: () => void
  gameStatus: string
  difficulty: string
  personality: string
  aiThinking: boolean
  onFirst: () => void
  onPrev: () => void
  onPlayPause: () => void
  onNext: () => void
  onLast: () => void
  onFlip: () => void
  onReset: () => void
  isPlaying: boolean
  onFullReplay: () => void
}

export default function GameSidebar(props: GameSidebarProps) {
  const [tab, setTab] = useState<Tab>("moves")
  const [chatInput, setChatInput] = useState("")
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [props.chatHistory])

  const handleSend = () => {
    if (!chatInput.trim() || props.isLoading) return
    props.onSendMessage(chatInput.trim())
    setChatInput("")
  }

  return (
    <div className="flex flex-col h-full bg-[#262626] text-[#ccc] rounded-lg overflow-hidden border border-[#333]">
      {/* Top tabs */}
      <div className="flex border-b border-[#333] bg-[#1e1e1e]">
        {(["moves", "chat", "info"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm capitalize transition-colors ${
              tab === t
                ? "text-white border-b-2 border-[#629924] bg-[#262626]"
                : "text-[#888] hover:text-[#ccc]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Analysis toggle */}
      {tab === "moves" && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#333] bg-[#2a2a2a]">
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={props.showAnalysis}
              onChange={props.onToggleAnalysis}
              className="accent-[#629924]"
            />
            <span className="text-[#aaa]">Analysis</span>
          </label>
          <span className="text-[10px] text-[#666]">| Stockfish Lite</span>
        </div>
      )}

      {/* Tab content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {tab === "moves" && (
          <>
            <MoveList
              moves={props.moves}
              currentMoveIndex={props.currentMoveIndex}
              onMoveClick={props.onMoveClick}
              showAnalysis={props.showAnalysis}
            />
            <PlaybackControls
              currentMoveIndex={props.currentMoveIndex}
              totalMoves={props.moves.length}
              isPlaying={props.isPlaying}
              onFirst={props.onFirst}
              onPrev={props.onPrev}
              onPlayPause={props.onPlayPause}
              onNext={props.onNext}
              onLast={props.onLast}
              onFlip={props.onFlip}
              onReset={props.onReset}
              onFullReplay={props.onFullReplay}
            />
          </>
        )}

        {tab === "chat" && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {props.chatHistory.length === 0 && (
                <p className="text-[#666] text-sm text-center mt-8">
                  Ask the AI coach anything!<br />
                  <span className="text-xs">Try: &quot;Why did you move the knight?&quot;</span>
                </p>
              )}
              {props.chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`text-sm rounded-lg px-3 py-2 ${
                    msg.role === "user"
                      ? "bg-[#369] text-white ml-6"
                      : "bg-[#333] text-[#ddd] mr-6"
                  }`}
                >
                  {msg.content}
                </div>
              ))}
              {props.isLoading && (
                <div className="text-[#888] text-sm animate-pulse">AI is thinking...</div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-2 border-t border-[#333] flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about moves, strategy..."
                className="flex-1 bg-[#333] border border-[#444] rounded px-3 py-2 text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#629924]"
                disabled={props.isLoading}
              />
              <button
                onClick={handleSend}
                disabled={props.isLoading || !chatInput.trim()}
                className="px-3 py-2 bg-[#629924] text-white rounded text-sm hover:bg-[#7ab832] disabled:opacity-50 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {tab === "info" && (
          <div className="p-4 space-y-4 text-sm overflow-y-auto">
            <InfoRow label="Status" value={props.gameStatus} />
            <InfoRow label="Difficulty" value={props.difficulty} />
            <InfoRow label="Personality" value={props.personality.replace(/_/g, " ")} />
            <InfoRow label="Moves" value={String(props.moves.length)} />
            {props.aiThinking && (
              <div className="text-[#629924] animate-pulse">AI is thinking...</div>
            )}
            <div className="pt-4 border-t border-[#333]">
              <h3 className="text-[#888] text-xs uppercase mb-2">Quick Actions</h3>
              <div className="space-y-2">
                <QuickAction onClick={() => props.onSendMessage("What's the best move?")}>
                  Best move?
                </QuickAction>
                <QuickAction onClick={() => props.onSendMessage("Give me a hint")}>
                  Get a hint
                </QuickAction>
                <QuickAction onClick={() => props.onSendMessage("Analyze this position")}>
                  Analyze position
                </QuickAction>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#888] capitalize">{label}</span>
      <span className="text-white capitalize">{value}</span>
    </div>
  )
}

function QuickAction({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 rounded bg-[#333] hover:bg-[#3a3a3a] text-[#ccc] text-sm transition-colors"
    >
      {children}
    </button>
  )
}
