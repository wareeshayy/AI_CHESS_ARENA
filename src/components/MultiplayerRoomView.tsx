"use client"

import { useMemo, useState } from "react"
import { Chess } from "chess.js"
import AppNavSidebar from "./AppNavSidebar"
import BoardStage from "./BoardStage"
import ChessBoardPanel from "./ChessBoardPanel"
import PlayerBar from "./PlayerBar"
import BoardThemePicker from "./BoardThemePicker"
import { useMultiplayerRoom } from "@/hooks/useMultiplayerRoom"
import { useBoardTheme } from "@/hooks/useBoardTheme"
import type { BoardThemeId } from "@/lib/chess/board-themes"

interface MultiplayerRoomViewProps {
  roomId: string
}

export default function MultiplayerRoomView({ roomId }: MultiplayerRoomViewProps) {
  const { room, yourColor, error, sendMove } = useMultiplayerRoom(roomId)
  const { themeId: boardTheme, setThemeId: setBoardTheme } = useBoardTheme()
  const [optionsOpen, setOptionsOpen] = useState(false)

  const orientation = yourColor === "black" ? "black" : "white"
  const playerChessColor = yourColor === "black" ? "b" : yourColor === "white" ? "w" : "w"

  const canMove =
    !!room &&
    room.status === "playing" &&
    !!yourColor &&
    room.currentTurn === playerChessColor

  const opponent = room?.players.find((p) => p.color && p.color !== yourColor)
  const waiting = room?.status === "waiting"
  const full = error === "Room is full"
  const inviteLink =
    typeof window !== "undefined" ? `${window.location.origin}/room/${roomId}` : `/room/${roomId}`

  const topName = orientation === "white" ? (opponent ? "Opponent" : "Waiting...") : "You"
  const bottomName = orientation === "white" ? "You" : opponent ? "Opponent" : "Waiting..."

  const statusMessage = useMemo(() => {
    if (full) return "Room is full"
    if (error && error !== "Room is full") return error
    if (waiting) return "Waiting for opponent..."
    if (room?.message) return room.message
    if (room?.status === "playing") return "Game in progress"
    if (room?.status === "finished") return room.message ?? "Game over"
    return "Connecting..."
  }, [room, waiting, error, full])

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink)
  }

  const handleMove = (from: string, to: string, promotion?: string) => {
    if (!canMove) return false
    sendMove(from, to, promotion)
    return true
  }

  return (
    <div className="h-screen overflow-hidden bg-[#312e2b] text-white flex">
      <AppNavSidebar active="home" />

      <div className="flex-1 min-w-0 min-h-0 flex">
        <div className="flex-1 min-w-0 min-h-0 flex flex-col px-2 py-1 overflow-hidden">
          <PlayerBar
            compact
            name={topName}
            color={orientation === "white" ? "b" : playerChessColor}
            isActive={
              room ? new Chess(room.fen).turn() === (orientation === "white" ? "b" : playerChessColor) : false
            }
          />

          <BoardStage loading={!room && !error}>
            <ChessBoardPanel
              fen={room?.fen ?? "start"}
              orientation={orientation}
              canMove={canMove}
              playerColor={playerChessColor}
              boardTheme={boardTheme as BoardThemeId}
              onMove={handleMove}
              lastMove={room?.lastMove}
            />
          </BoardStage>

          <PlayerBar
            compact
            name={bottomName}
            color={orientation === "white" ? playerChessColor : "b"}
            isActive={
              room ? new Chess(room.fen).turn() === (orientation === "white" ? playerChessColor : "b") : false
            }
          />
        </div>

        <aside className="w-[min(280px,28vw)] shrink-0 min-h-0 border-l border-[#403d39] flex flex-col bg-[#262421] overflow-hidden">
          <div className="shrink-0 px-3 py-2.5 border-b border-[#403d39] flex items-center justify-between">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <span>👥</span> Multiplayer
            </h2>
            <button
              type="button"
              onClick={copyLink}
              className="px-2 py-1 bg-[#403d39] hover:bg-[#4a4744] rounded text-[10px] font-bold"
            >
              Copy Link
            </button>
          </div>

          <div
            className={`shrink-0 px-3 py-1.5 text-center text-[11px] font-semibold ${
              full ? "bg-red-900/40 text-red-300" : waiting ? "bg-[#403d39] text-[#ccc]" : "bg-[#81b64c]/20 text-[#81b64c]"
            }`}
          >
            {statusMessage}
          </div>

          <div className="shrink-0 px-3 py-2 text-xs space-y-1 border-b border-[#403d39]">
            <p>
              Room: <span className="font-mono text-[#81b64c]">{roomId}</span>
            </p>
            {yourColor && (
              <p>
                You: <strong className="capitalize">{yourColor}</strong>
              </p>
            )}
            <p className="text-[#aaa]">Players: {room?.players.filter((p) => p.connected).length ?? 0}/2</p>
          </div>

          <div className="border-b border-[#403d39] shrink-0">
            <button
              type="button"
              onClick={() => setOptionsOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-[#ccc] hover:bg-[#2e2c29]"
            >
              <span>Options</span>
              <span className="text-[#666] text-xs">{optionsOpen ? "▲" : "▼"}</span>
            </button>
            {optionsOpen && (
              <div className="px-3 pb-3 bg-[#2a2826]">
                <BoardThemePicker value={boardTheme} onChange={setBoardTheme} layout="grid" />
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0" />
        </aside>
      </div>
    </div>
  )
}
