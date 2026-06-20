"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Chess } from "chess.js"
import AppNavSidebar from "./AppNavSidebar"
import BoardStage from "./BoardStage"
import ChessBoardPanel from "./ChessBoardPanel"
import PlayerBar from "./PlayerBar"
import BoardThemePicker from "./BoardThemePicker"
import RoomInvitePanel from "./RoomInvitePanel"
import MobileGameActionBar, { ActionIcons } from "./MobileGameActionBar"
import CoachBubble from "./CoachBubble"
import { useMultiplayerRoom } from "@/hooks/useMultiplayerRoom"
import { useBoardTheme } from "@/hooks/useBoardTheme"
import type { BoardThemeId } from "@/lib/chess/board-themes"

interface MultiplayerRoomViewProps {
  roomId: string
}

export default function MultiplayerRoomView({ roomId }: MultiplayerRoomViewProps) {
  const router = useRouter()
  const { room, yourColor, error, joining, sendMove, leaveRoom } = useMultiplayerRoom(roomId)
  const { themeId: boardTheme, setThemeId: setBoardTheme } = useBoardTheme()
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [mobilePanel, setMobilePanel] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

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
  const roomNotFound = error === "Room not found"
  const inviteLink =
    typeof window !== "undefined" ? `${window.location.origin}/room/${roomId}` : `/room/${roomId}`

  const topName = orientation === "white" ? (opponent ? "Opponent" : "Waiting...") : "You"
  const bottomName = orientation === "white" ? "You" : opponent ? "Opponent" : "Waiting..."

  const statusMessage = useMemo(() => {
    if (joining && !room) return "Connecting..."
    if (full) return "Room is full"
    if (roomNotFound) return "This room doesn't exist or has expired."
    if (error && error !== "Room is full") return error
    if (waiting) return "Waiting for opponent..."
    if (room?.message) return room.message
    if (room?.status === "playing") return "Game in progress"
    if (room?.status === "finished") return room.message ?? "Game over"
    return "Connecting..."
  }, [room, waiting, error, full, roomNotFound, joining])

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleLeave = async () => {
    await leaveRoom()
    router.push("/")
  }

  const createNewRoom = async () => {
    const res = await fetch("/api/room/create", { method: "POST" })
    const data = await res.json()
    if (data.roomId) router.push(`/room/${data.roomId}`)
  }

  const canInvite = !full && waiting && !roomNotFound

  const handleMove = (from: string, to: string, promotion?: string) => {
    if (!canMove) return false
    sendMove(from, to, promotion)
    return true
  }

  const sidePanel = (
    <>
      <div className="shrink-0 px-3 py-2 border-b border-[#403d39] flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <span>👥</span> Multiplayer
        </h2>
        <button
          type="button"
          onClick={copyLink}
          className="px-2 py-1.5 bg-[#403d39] hover:bg-[#4a4744] rounded text-[10px] font-bold shrink-0"
        >
          {linkCopied ? "Copied!" : "Copy Link"}
        </button>
      </div>

      <div
        className={`shrink-0 px-3 py-1.5 text-center text-[11px] font-semibold ${
          full || roomNotFound
            ? "bg-red-900/40 text-red-300"
            : waiting
              ? "bg-[#403d39] text-[#ccc]"
              : "bg-[#81b64c]/20 text-[#81b64c]"
        }`}
      >
        {statusMessage}
      </div>

      {roomNotFound && (
        <div className="shrink-0 px-3 py-3 flex flex-col gap-2 border-b border-[#403d39]">
          <button
            type="button"
            onClick={createNewRoom}
            className="w-full py-2.5 bg-[#81b64c] hover:bg-[#9bc96a] text-[#1a1a1a] rounded-lg text-sm font-bold"
          >
            Create new room
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full py-2.5 bg-[#403d39] hover:bg-[#4a4744] rounded-lg text-sm font-bold"
          >
            Go home
          </button>
        </div>
      )}

      <div className="shrink-0 px-3 py-2 text-xs space-y-1 border-b border-[#403d39]">
        {yourColor && (
          <p>
            You play: <strong className="capitalize">{yourColor}</strong>
          </p>
        )}
        <p className="text-[#aaa]">
          {room?.players.filter((p) => p.connected).length ?? 0} of 2 players joined
        </p>
      </div>

      <RoomInvitePanel roomId={roomId} inviteLink={inviteLink} disabled={!canInvite} />

      <div className="border-b border-[#403d39] shrink-0">
        <button
          type="button"
          onClick={() => setOptionsOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-[#ccc] hover:bg-[#2e2c29]"
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
    </>
  )

  return (
    <div className="arena-shell h-[100dvh] overflow-hidden bg-[#312e2b] text-white flex flex-col md:flex-row">
      <AppNavSidebar active="home" />

      <div className="flex-1 min-w-0 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        <div
          className={`flex flex-col min-w-0 min-h-0 px-1 py-1 lg:px-2 lg:flex-1 ${
            mobilePanel ? "hidden lg:flex" : "flex flex-1"
          }`}
        >
          <PlayerBar
            compact
            name={topName}
            color={orientation === "white" ? "b" : playerChessColor}
            isActive={
              room ? new Chess(room.fen).turn() === (orientation === "white" ? "b" : playerChessColor) : false
            }
          />

          {!roomNotFound && (
            <div className="lg:hidden shrink-0 bg-[#312e2b] border-b border-[#403d39]">
              <CoachBubble
                name="Multiplayer"
                rating={1200}
                text={statusMessage}
                compact
              />
            </div>
          )}

          <BoardStage loading={joining && !room && !roomNotFound}>
            {roomNotFound && !mobilePanel ? (
              <div className="flex flex-col items-center justify-center gap-4 p-6 text-center max-w-xs mx-auto">
                <p className="text-lg font-bold text-[#ccc]">Room not found</p>
                <p className="text-sm text-[#888]">
                  The link may be wrong, or the room expired. Create a new room to play with a friend.
                </p>
                <button
                  type="button"
                  onClick={createNewRoom}
                  className="w-full py-3 bg-[#81b64c] hover:bg-[#9bc96a] text-[#1a1a1a] rounded-lg font-bold"
                >
                  Create new room
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="w-full py-2.5 bg-[#403d39] hover:bg-[#4a4744] rounded-lg text-sm font-bold"
                >
                  Go home
                </button>
              </div>
            ) : (
              <ChessBoardPanel
                fen={room?.fen ?? "start"}
                orientation={orientation}
                canMove={canMove}
                playerColor={playerChessColor}
                boardTheme={boardTheme as BoardThemeId}
                onMove={handleMove}
                lastMove={room?.lastMove}
              />
            )}
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

        <aside
          className={`bg-[#262421] flex flex-col min-h-0 overflow-y-auto scrollbar-thin border-[#403d39] ${
            mobilePanel
              ? "flex flex-1 w-full lg:w-[min(300px,30vw)] lg:shrink-0 lg:border-l"
              : "hidden lg:flex lg:w-[min(300px,30vw)] lg:shrink-0 lg:border-l"
          }`}
        >
          <button
            type="button"
            onClick={() => setMobilePanel(false)}
            className="lg:hidden shrink-0 px-3 py-2 text-left text-xs font-bold text-[#81b64c] border-b border-[#403d39]"
          >
            ← Back to board
          </button>
          {sidePanel}
        </aside>
      </div>

      <MobileGameActionBar
        items={[
          {
            id: "options",
            label: "Options",
            icon: ActionIcons.options,
            onClick: () => setMobilePanel(true),
          },
          {
            id: "leave",
            label: "Leave",
            icon: ActionIcons.resign,
            onClick: handleLeave,
            disabled: roomNotFound,
          },
          {
            id: "invite",
            label: "Invite",
            icon: ActionIcons.invite,
            onClick: () => setMobilePanel(true),
            disabled: !canInvite,
          },
          {
            id: "link",
            label: linkCopied ? "Copied!" : "Link",
            icon: ActionIcons.link,
            onClick: copyLink,
            disabled: roomNotFound,
          },
        ]}
      />
    </div>
  )
}
