"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { Chess } from "chess.js"
import ChessBoardPanel from "./ChessBoardPanel"
import CoachPanel, { type CoachMessage } from "./CoachPanel"
import AppNavSidebar from "./AppNavSidebar"
import AppMobileNav from "./AppMobileNav"
import BoardStage from "./BoardStage"
import PlayerBar from "./PlayerBar"
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
import { replaceSanInText } from "@/lib/chess/plain-language"
import {
  getCapturedAtIndex,
  materialAdvantage,
  formatAdvantage,
} from "@/lib/chess/captured"
import type { Difficulty, GameState, Personality } from "@/lib/types/game"

const COACH_RATINGS: Record<Personality, number> = {
  friendly_coach: 400,
  grandmaster: 2800,
  aggressive_rival: 1600,
  casual_opponent: 800,
}

const PERSONALITY_NAMES: Record<Personality, string> = {
  friendly_coach: "Coach David",
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
  const [mobilePanel, setMobilePanel] = useState(false)

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
            moveColor: tip.moveColor,
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
          const reply = replaceSanInText(data.reply)
          setCoachMessages((prev) => [
            ...prev,
            { role: "coach", content: reply, timestamp: Date.now(), sentiment: "tip" },
          ])
          speak(reply)
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
          addCoachTip({ text: replaceSanInText(data.explanation), sentiment: "tip" })
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
    <div className="arena-shell h-[100dvh] overflow-hidden bg-[#312e2b] text-white flex flex-col md:flex-row">
      <AppNavSidebar active="play" />

      <div className="flex-1 min-w-0 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        <div
          className={`flex flex-col min-w-0 min-h-0 px-1 py-1 lg:px-2 lg:flex-1 ${
            mobilePanel ? "hidden lg:flex" : "flex flex-1"
          }`}
        >
          <PlayerBar
            compact
            name={topPlayer.name}
            color={topPlayer.color}
            isActive={game ? new Chess(fen === "start" ? undefined : fen).turn() === topPlayer.color : false}
            isThinking={topPlayer.isAI && aiThinking}
            rating={topPlayer.isAI ? COACH_RATINGS[game?.personality ?? settings.personality] : undefined}
            captured={topPlayer.isAI ? aiCaptured : playerCaptured}
            capturedPieceColor={topPlayer.isAI ? playerColor : aiColor}
            materialAdvantage={topPlayer.isAI ? aiAdv : playerAdv}
          />

          <BoardStage loading={loading}>
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
          </BoardStage>

          <PlayerBar
            compact
            name={bottomPlayer.name}
            color={bottomPlayer.color}
            isActive={game ? new Chess(fen === "start" ? undefined : fen).turn() === bottomPlayer.color : false}
            isThinking={bottomPlayer.isAI && aiThinking}
            rating={bottomPlayer.isAI ? undefined : 1200}
            captured={bottomPlayer.isAI ? aiCaptured : playerCaptured}
            capturedPieceColor={bottomPlayer.isAI ? playerColor : aiColor}
            materialAdvantage={bottomPlayer.isAI ? aiAdv : playerAdv}
          />

          <button
            type="button"
            onClick={() => setMobilePanel(true)}
            className="lg:hidden shrink-0 mt-1 py-2.5 bg-[#403d39] hover:bg-[#4a4744] rounded-lg text-xs font-bold text-[#ccc]"
          >
            Coach &amp; options
          </button>
        </div>

        <aside
          className={`min-h-0 overflow-hidden border-[#403d39] ${
            mobilePanel
              ? "flex flex-1 w-full lg:w-[min(300px,30vw)] lg:shrink-0 lg:border-l"
              : "hidden lg:flex lg:w-[min(300px,30vw)] lg:shrink-0 lg:border-l"
          }`}
        >
          <button
            type="button"
            onClick={() => setMobilePanel(false)}
            className="lg:hidden shrink-0 w-full px-3 py-2 text-left text-xs font-bold text-[#81b64c] border-b border-[#403d39] bg-[#262421]"
          >
            ← Back to board
          </button>
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
            onNewGame={startGame}
            newGameLoading={loading || aiThinking}
            gameOverMessage={gameOverMessage}
            settings={{
              difficulty: settings.difficulty,
              personality: settings.personality,
              playerColor: settings.playerColor,
              boardTheme,
              onDifficultyChange: (d) => setSettings((s) => ({ ...s, difficulty: d })),
              onPersonalityChange: (p) => setSettings((s) => ({ ...s, personality: p })),
              onPlayerColorChange: (c) => setSettings((s) => ({ ...s, playerColor: c })),
              onBoardThemeChange: setBoardTheme,
            }}
          />
        </aside>
      </div>

      <AppMobileNav active="play" />
    </div>
  )
}
