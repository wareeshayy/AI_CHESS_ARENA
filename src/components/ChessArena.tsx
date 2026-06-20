"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { Chess } from "chess.js"
import ChessBoardPanel from "./ChessBoardPanel"
import CoachPanel, { type CoachMessage } from "./CoachPanel"
import BoardThemePicker from "./BoardThemePicker"
import PlayerBar from "./PlayerBar"
import { CapturedSideBySide } from "./ChessPieces"
import { useCoachSpeech } from "@/hooks/useCoachSpeech"
import { useBoardTheme } from "@/hooks/useBoardTheme"
import {
  getWelcomeMessage,
  getCoachFeedbackAfterPlayerMove,
  getCoachFeedbackAfterAIMove,
  getHintMessage,
  getGameOverCoachMessage,
  getCoachName,
  type CoachTip,
  type MoveQuality,
} from "@/lib/ai/coach"
import {
  getCapturedAtIndex,
  materialAdvantage,
  formatAdvantage,
} from "@/lib/chess/captured"
import type { Difficulty, GameState, Personality } from "@/lib/types/game"

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"]
const PERSONALITIES: { id: Personality; label: string }[] = [
  { id: "friendly_coach", label: "Friendly Coach" },
  { id: "grandmaster", label: "Grandmaster" },
  { id: "aggressive_rival", label: "Aggressive Rival" },
  { id: "casual_opponent", label: "Casual Opponent" },
]

const COACH_RATINGS: Record<Personality, number> = {
  friendly_coach: 400,
  grandmaster: 2800,
  aggressive_rival: 1600,
  casual_opponent: 800,
}

const PERSONALITY_NAMES: Record<Personality, string> = {
  friendly_coach: "Coach Alex",
  grandmaster: "GM Stockfish",
  aggressive_rival: "Rival Max",
  casual_opponent: "Casual Sam",
}

export default function ChessArena() {
  const [game, setGame] = useState<GameState | null>(null)
  const [fen, setFen] = useState("start")
  const [viewIndex, setViewIndex] = useState(-1)
  const [orientation, setOrientation] = useState<"white" | "black">("white")
  const [isPlaying, setIsPlaying] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(true)
  const [aiThinking, setAiThinking] = useState(false)
  const [loading, setLoading] = useState(true)
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([])
  const { speechEnabled, speak, toggleSpeech } = useCoachSpeech(true)
  const { themeId: boardTheme, setThemeId: setBoardTheme } = useBoardTheme()
  const [chatLoading, setChatLoading] = useState(false)
  const playInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const gameInitRef = useRef(0)

  const [settings, setSettings] = useState({
    difficulty: "intermediate" as Difficulty,
    personality: "friendly_coach" as Personality,
    playerColor: "w" as "w" | "b",
  })

  const [lastMove, setLastMove] = useState<{ from: string; to: string }>()
  const [gameOverMessage, setGameOverMessage] = useState<string | null>(null)
  const [review, setReview] = useState<string | null>(null)

  const personality = game?.personality ?? settings.personality
  const coachName = getCoachName(personality)

  const [lastMoveQuality, setLastMoveQuality] = useState<MoveQuality>(null)
  const [currentEval, setCurrentEval] = useState(0)
  const lastSpokenRef = useRef("")

  const addCoachTip = useCallback(
    (tip: CoachTip, shouldSpeak = true) => {
      if (tip.silent || !tip.text.trim()) return
      if (tip.text === lastSpokenRef.current) return

      lastSpokenRef.current = tip.text
      setCoachMessages((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].content === tip.text) return prev
        return [
          ...prev,
          {
            role: "coach" as const,
            content: tip.text,
            timestamp: Date.now(),
            sentiment: tip.sentiment,
            moveSan: tip.moveSan,
            quality: tip.quality,
            eval: tip.eval,
          },
        ]
      })
      if (shouldSpeak) speak(tip.text)
      if (tip.quality) setLastMoveQuality(tip.quality)
      if (tip.eval !== undefined) setCurrentEval(tip.eval)
    },
    [speak],
  )

  const coachAfterMoves = useCallback(
    (updatedGame: GameState, prevMoveCount: number) => {
      const newMoves = updatedGame.moves.slice(prevMoveCount)

      for (let i = 0; i < newMoves.length; i++) {
        const m = newMoves[i]
        const idx = prevMoveCount + i
        if (m.color === updatedGame.playerColor) {
          const tip = getCoachFeedbackAfterPlayerMove(
            updatedGame.moves,
            idx,
            updatedGame.playerColor,
          )
          addCoachTip(tip)
        } else {
          const tip = getCoachFeedbackAfterAIMove(updatedGame.moves, idx)
          if (tip) addCoachTip(tip)
        }
      }

      const last = updatedGame.moves.at(-1)
      if (last?.evaluation !== undefined) {
        const sign = updatedGame.playerColor === "w" ? 1 : -1
        setCurrentEval(last.evaluation * sign)
      }
    },
    [addCoachTip],
  )

  const isLive = game != null && viewIndex === game.moves.length - 1

  const canPlayerMove =
    !loading &&
    !aiThinking &&
    game?.status === "active" &&
    isLive &&
    (() => {
      if (!game) return false
      try {
        return new Chess(game.fen).turn() === game.playerColor
      } catch {
        return false
      }
    })()

  const startGame = useCallback(async () => {
    const initId = ++gameInitRef.current
    setLoading(true)
    setGameOverMessage(null)
    setReview(null)
    setViewIndex(-1)
    setLastMove(undefined)
    setCoachMessages([])
    lastSpokenRef.current = ""
    setLastMoveQuality(null)
    setCurrentEval(0)

    try {
      const res = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      const newGame: GameState = await res.json()
      if (initId !== gameInitRef.current) return

      setGame(newGame)
      setFen(newGame.fen)
      setOrientation(settings.playerColor === "w" ? "white" : "black")

      const welcome = getWelcomeMessage(settings.personality, settings.playerColor)
      addCoachTip(welcome)

      if (settings.playerColor === "b") {
        setAiThinking(true)
        const aiRes = await fetch("/api/ai-move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId: newGame.id }),
        })
        const aiData = await aiRes.json()
        if (initId !== gameInitRef.current) return
        if (aiData.game) {
          setGame(aiData.game)
          setFen(aiData.game.fen)
          setViewIndex(aiData.game.moves.length - 1)
          const last = aiData.game.moves.at(-1)
          if (last) {
            setLastMove({ from: last.uci.slice(0, 2), to: last.uci.slice(2, 4) })
          }
          coachAfterMoves(aiData.game, 0)
        }
        setAiThinking(false)
      }
    } finally {
      if (initId === gameInitRef.current) setLoading(false)
    }
  }, [settings, addCoachTip, coachAfterMoves])

  const handleGameOver = useCallback(
    async (g: GameState) => {
      const messages: Record<string, string> = {
        checkmate: g.winner === "player" ? "Checkmate! You win!" : "Checkmate! AI wins.",
        stalemate: "Stalemate — Draw.",
        draw: "Draw.",
      }
      setGameOverMessage(messages[g.status] ?? "Game over.")
      const coachTip = getGameOverCoachMessage(g.status, g.winner)
      addCoachTip(coachTip)
      try {
        const res = await fetch("/api/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId: g.id }),
        })
        const data = await res.json()
        setReview(data.review)
      } catch {
        /* ignore */
      }
    },
    [addCoachTip],
  )

  useEffect(() => {
    queueMicrotask(() => {
      void startGame()
    })
  }, [startGame])

  // Sync board when reviewing past moves (not during live play)
  const goToMove = useCallback(
    (index: number) => {
      if (!game) return
      setIsPlaying(false)
      if (playInterval.current) clearInterval(playInterval.current)
      const clamped = Math.max(-1, Math.min(index, game.moves.length - 1))
      setViewIndex(clamped)
      if (clamped < 0) {
        setFen(new Chess().fen())
        setLastMove(undefined)
      } else {
        const m = game.moves[clamped]
        setFen(m.fen)
        setLastMove({ from: m.uci.slice(0, 2), to: m.uci.slice(2, 4) })
      }
    },
    [game],
  )

  const handleMove = useCallback(
    (from: string, to: string, promotion?: string): boolean => {
      if (!game || !canPlayerMove) return false

      const chess = new Chess(game.fen)
      let result
      try {
        result = chess.move({ from, to, promotion: promotion as "q" | "r" | "b" | "n" | undefined })
      } catch {
        return false
      }
      if (!result) return false

      // Instant board update (Chess.com-style responsiveness)
      setFen(chess.fen())
      setLastMove({ from, to })
      setAiThinking(true)

      const moveStr = `${from}${to}${promotion ?? ""}`

      const prevMoveCount = game.moves.length

      fetch("/api/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id, move: moveStr }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setFen(game.fen)
            return
          }
          setGame(data.game)
          setFen(data.game.fen)
          setViewIndex(data.game.moves.length - 1)
          const last = data.game.moves.at(-1)
          if (last) setLastMove({ from: last.uci.slice(0, 2), to: last.uci.slice(2, 4) })
          coachAfterMoves(data.game, prevMoveCount)
          if (data.game.status !== "active") handleGameOver(data.game)
        })
        .catch(() => setFen(game.fen))
        .finally(() => setAiThinking(false))

      return true
    },
    [game, canPlayerMove, coachAfterMoves, handleGameOver],
  )

  const handleHint = () => {
    if (!game) return
    addCoachTip(getHintMessage(game.fen))
  }

  const handleAskCoach = useCallback(
    async (message: string) => {
      if (!game) return
      setCoachMessages((prev) => [
        ...prev,
        { role: "user", content: message, timestamp: Date.now() },
      ])
      setChatLoading(true)
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId: game.id, message }),
        })
        const data = await res.json()
        if (data.reply) {
          setCoachMessages((prev) => [
            ...prev,
            { role: "coach", content: data.reply, timestamp: Date.now(), sentiment: "tip" },
          ])
          speak(data.reply)
        }
      } catch {
        addCoachTip({ text: "Could not reach the coach. Try again.", sentiment: "tip" }, false)
      } finally {
        setChatLoading(false)
      }
    },
    [game, speak, addCoachTip],
  )

  const handleExplain = useCallback(
    async (focus: "position" | "best-move" | "last-move") => {
      if (!game) return
      setChatLoading(true)
      try {
        const res = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId: game.id, focus }),
        })
        const data = await res.json()
        if (data.explanation) {
          addCoachTip({ text: data.explanation, sentiment: "tip" })
        }
      } catch {
        addCoachTip({ text: "Analysis unavailable right now.", sentiment: "tip" }, false)
      } finally {
        setChatLoading(false)
      }
    },
    [game, addCoachTip],
  )

  const handleResign = () => {
    if (!game || game.status !== "active") return
    addCoachTip({ text: "You resigned. Start a new game when ready.", sentiment: "tip" })
    setGame({ ...game, status: "resigned", winner: "ai" })
    setGameOverMessage("You resigned.")
  }

  const navigateMove = goToMove

  const handlePlayPause = () => {
    if (!game || game.moves.length === 0) return
    if (isPlaying) {
      setIsPlaying(false)
      if (playInterval.current) clearInterval(playInterval.current)
      return
    }
    setIsPlaying(true)
    let idx = viewIndex < 0 ? 0 : viewIndex
    playInterval.current = setInterval(() => {
      if (idx >= game.moves.length - 1) {
        setIsPlaying(false)
        if (playInterval.current) clearInterval(playInterval.current)
        return
      }
      idx++
      goToMove(idx)
    }, 700)
  }

  const startFullReplay = useCallback(() => {
    if (!game || game.moves.length === 0) return
    setIsPlaying(false)
    if (playInterval.current) clearInterval(playInterval.current)

    goToMove(-1)
    setIsPlaying(true)

    let idx = 0
    playInterval.current = setInterval(() => {
      if (idx >= game.moves.length) {
        setIsPlaying(false)
        if (playInterval.current) clearInterval(playInterval.current)
        return
      }
      goToMove(idx)
      idx++
    }, 900)
  }, [game, goToMove])

  useEffect(() => () => { if (playInterval.current) clearInterval(playInterval.current) }, [])

  const aiName = PERSONALITY_NAMES[game?.personality ?? settings.personality]
  const playerColor = game?.playerColor ?? settings.playerColor
  const aiColor = playerColor === "w" ? "b" : "w"
  const isWhiteBottom = orientation === "white"

  const topPlayer = isWhiteBottom
    ? { name: aiName, color: aiColor as "w" | "b", isAI: true }
    : { name: "You", color: playerColor, isAI: false }
  const bottomPlayer = isWhiteBottom
    ? { name: "You", color: playerColor, isAI: false }
    : { name: aiName, color: aiColor as "w" | "b", isAI: true }

  const captured = useMemo(
    () => getCapturedAtIndex(game?.moves ?? [], viewIndex),
    [game?.moves, viewIndex],
  )

  const playerCaptured = playerColor === "w" ? captured.byWhite : captured.byBlack
  const aiCaptured = aiColor === "w" ? captured.byWhite : captured.byBlack
  const playerAdv = formatAdvantage(materialAdvantage(captured, playerColor))
  const aiAdv = formatAdvantage(materialAdvantage(captured, aiColor))

  return (
    <div className="min-h-screen bg-[#312e2b] text-white">
      {/* Top nav — Chess.com style */}
      <header className="bg-[#262421] border-b border-[#403d39] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[#81b64c] text-xl font-bold">♞</span>
          <span className="font-bold text-[#ebebeb]">AI Chess Arena</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={settings.difficulty}
            onChange={(e) => setSettings((s) => ({ ...s, difficulty: e.target.value as Difficulty }))}
            className="bg-[#403d39] border border-[#5a5652] rounded px-2 py-1.5 text-xs text-[#ebebeb]"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
            ))}
          </select>
          <select
            value={settings.personality}
            onChange={(e) => setSettings((s) => ({ ...s, personality: e.target.value as Personality }))}
            className="bg-[#403d39] border border-[#5a5652] rounded px-2 py-1.5 text-xs text-[#ebebeb]"
          >
            {PERSONALITIES.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <select
            value={settings.playerColor}
            onChange={(e) => setSettings((s) => ({ ...s, playerColor: e.target.value as "w" | "b" }))}
            className="bg-[#403d39] border border-[#5a5652] rounded px-2 py-1.5 text-xs text-[#ebebeb]"
          >
            <option value="w">Play as White</option>
            <option value="b">Play as Black</option>
          </select>
          <button
            onClick={startGame}
            disabled={loading || aiThinking}
            className="px-4 py-1.5 bg-[#81b64c] hover:bg-[#9bc55c] disabled:opacity-50 rounded text-xs font-bold text-[#262421] transition-colors"
          >
            {loading ? "Loading..." : "New Game"}
          </button>
        </div>
      </header>

      {gameOverMessage && (
        <div className="bg-[#81b64c]/20 border-b border-[#81b64c]/30 px-4 py-2 text-center text-sm font-semibold">
          {gameOverMessage}
        </div>
      )}

      {/* Main play area — Chess.com layout */}
      <div className="flex flex-col lg:flex-row gap-0 lg:gap-4 p-3 lg:p-4 max-w-[1200px] mx-auto">
        {/* Board column */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <PlayerBar
            name={topPlayer.name}
            color={topPlayer.color}
            isActive={game ? new Chess(fen === "start" ? undefined : fen).turn() === topPlayer.color : false}
            isThinking={topPlayer.isAI && aiThinking}
            rating={topPlayer.isAI ? 1800 : undefined}
            captured={topPlayer.isAI ? aiCaptured : playerCaptured}
            capturedPieceColor={topPlayer.isAI ? playerColor : aiColor}
            materialAdvantage={topPlayer.isAI ? aiAdv : playerAdv}
          />

          {/* Captured pieces — side by side */}
          {game && (
            <CapturedSideBySide
              playerCaptured={playerCaptured}
              aiCaptured={aiCaptured}
              playerColor={playerColor}
              aiColor={aiColor}
              playerAdvantage={playerAdv}
              aiAdvantage={aiAdv}
              playerName="You"
              aiName={aiName}
            />
          )}

          <div className="relative">
            {loading && (
              <div className="absolute inset-0 z-20 bg-[#312e2b]/80 flex items-center justify-center rounded">
                <div className="text-[#81b64c] animate-pulse font-semibold">Setting up game...</div>
              </div>
            )}
            <div className="mb-2">
              <BoardThemePicker value={boardTheme} onChange={setBoardTheme} />
            </div>
            <ChessBoardPanel
              fen={fen}
              orientation={orientation}
              canMove={canPlayerMove}
              playerColor={playerColor}
              boardTheme={boardTheme}
              onMove={handleMove}
              lastMove={lastMove}
              evaluation={currentEval}
              moveQuality={lastMoveQuality}
            />
          </div>

          <PlayerBar
            name={bottomPlayer.name}
            color={bottomPlayer.color}
            isActive={game ? new Chess(fen === "start" ? undefined : fen).turn() === bottomPlayer.color : false}
            isThinking={bottomPlayer.isAI && aiThinking}
            rating={bottomPlayer.isAI ? undefined : 1200}
            captured={bottomPlayer.isAI ? aiCaptured : playerCaptured}
            capturedPieceColor={bottomPlayer.isAI ? playerColor : aiColor}
            materialAdvantage={bottomPlayer.isAI ? aiAdv : playerAdv}
          />

          {game && game.moves.length > 0 && (
            <button
              onClick={startFullReplay}
              disabled={isPlaying}
              className="mt-2 w-full py-2.5 bg-[#b58863] hover:bg-[#c99870] disabled:opacity-50 rounded text-sm font-bold text-[#262421] transition-colors flex items-center justify-center gap-2 border border-[#8b6914]/40"
            >
              {isPlaying ? "⏸ Replaying..." : "▶ Review / Replay Game"}
            </button>
          )}

          {!isLive && game && game.moves.length > 0 && (
            <button
              onClick={() => {
              if (!game) return
              setViewIndex(game.moves.length - 1)
              setFen(game.fen)
              const last = game.moves.at(-1)
              if (last) setLastMove({ from: last.uci.slice(0, 2), to: last.uci.slice(2, 4) })
            }}
              className="mt-2 w-full py-2 bg-[#81b64c] hover:bg-[#9bc55c] rounded text-sm font-bold text-[#262421] transition-colors"
            >
              Back to live game
            </button>
          )}

          {review && (
            <div className="mt-3 bg-[#262421] rounded-lg p-4 text-sm text-[#ccc] border border-[#403d39]">
              <h3 className="text-white font-semibold mb-2">Post-Game Review</h3>
              <div className="whitespace-pre-wrap">{review}</div>
            </div>
          )}
        </div>

        {/* Coach panel — Play Coach */}
        <div className="w-full lg:w-[380px] h-[480px] lg:h-[720px] shrink-0 mt-3 lg:mt-0">
          <CoachPanel
            coachName={coachName}
            coachRating={COACH_RATINGS[personality]}
            messages={coachMessages}
            isThinking={aiThinking}
            speechEnabled={speechEnabled}
            onToggleSpeech={toggleSpeech}
            onAskCoach={handleAskCoach}
            onExplain={handleExplain}
            chatLoading={chatLoading}
            moves={game?.moves.map((m) => ({
              san: m.san,
              timeSpent: m.timeSpent,
              evaluation: m.evaluation,
            })) ?? []}
            currentMoveIndex={viewIndex}
            onMoveClick={navigateMove}
            showAnalysis={showAnalysis}
            onHint={handleHint}
            onResign={handleResign}
            isPlaying={isPlaying}
            onFirst={() => navigateMove(-1)}
            onPrev={() => navigateMove(viewIndex - 1)}
            onPlayPause={handlePlayPause}
            onNext={() => navigateMove(viewIndex + 1)}
            onLast={() => navigateMove((game?.moves.length ?? 1) - 1)}
            onFlip={() => setOrientation((o) => (o === "white" ? "black" : "white"))}
            onFullReplay={startFullReplay}
          />
        </div>
      </div>
    </div>
  )
}
