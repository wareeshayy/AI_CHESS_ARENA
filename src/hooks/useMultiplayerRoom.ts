"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"
import type { JoinResult, MultiplayerRoom, RoomColor } from "@/lib/multiplayer/types"

const PLAYER_KEY = "chess-player-id"

export function getPlayerId(): string {
  if (typeof window === "undefined") return ""
  let id = sessionStorage.getItem(PLAYER_KEY)
  if (!id) {
    id = `p_${Math.random().toString(36).slice(2, 11)}`
    sessionStorage.setItem(PLAYER_KEY, id)
  }
  return id
}

export function useMultiplayerRoom(roomId: string) {
  const [room, setRoom] = useState<MultiplayerRoom | null>(null)
  const [yourColor, setYourColor] = useState<RoomColor | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const playerIdRef = useRef("")
  const socketRef = useRef<Socket | null>(null)
  const versionRef = useRef(0)
  const connectedRef = useRef(false)

  const ensurePlayerId = useCallback(() => {
    if (!playerIdRef.current) {
      playerIdRef.current = getPlayerId()
    }
    return playerIdRef.current
  }, [])

  const applyJoinResult = useCallback((result: JoinResult) => {
    if (!result.ok) {
      setError(result.error ?? "Failed to join")
      return
    }
    if (result.room) setRoom(result.room)
    if (result.yourColor) setYourColor(result.yourColor)
    setError(null)
  }, [])

  useEffect(() => {
    if (!roomId) return
    ensurePlayerId()
    let pollTimer: ReturnType<typeof setInterval> | null = null
    let socketConnected = false

    const markConnected = () => {
      connectedRef.current = true
      setConnected(true)
    }

    const joinViaApi = async () => {
      const res = await fetch("/api/room/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, playerId: playerIdRef.current }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to join")
        return
      }
      applyJoinResult(data)
      markConnected()
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/room/${roomId}?since=${versionRef.current}`)
        const data = await res.json()
        if (data.unchanged) return
        if (data.room) {
          versionRef.current = data.room.version
          setRoom(data.room)
          const me = data.room.players.find((p: { id: string }) => p.id === playerIdRef.current)
          if (me?.color) setYourColor(me.color)
        }
      } catch {
        /* ignore poll errors */
      }
    }

    const socket = io({
      path: "/api/socket/io",
      transports: ["websocket", "polling"],
      reconnection: true,
    })
    socketRef.current = socket

    socket.on("connect", () => {
      socketConnected = true
      socket.emit(
        "join-room",
        { roomId, playerId: playerIdRef.current },
        (result: JoinResult) => {
          applyJoinResult(result)
          markConnected()
        },
      )
    })

    socket.on("room-update", (updated: MultiplayerRoom) => {
      versionRef.current = updated.version
      setRoom(updated)
      const me = updated.players.find((p) => p.id === playerIdRef.current)
      if (me?.color) setYourColor(me.color)
    })

    socket.on("connect_error", () => {
      if (!socketConnected) {
        joinViaApi()
        pollTimer = setInterval(poll, 1200)
      }
    })

    const fallbackTimer = setTimeout(() => {
      if (!connectedRef.current) {
        joinViaApi()
        if (!pollTimer) pollTimer = setInterval(poll, 1200)
      }
    }, 2500)

    return () => {
      clearTimeout(fallbackTimer)
      if (pollTimer) clearInterval(pollTimer)
      if (playerIdRef.current) {
        fetch(`/api/room/${roomId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: playerIdRef.current }),
        }).catch(() => {})
      }
      socket.disconnect()
    }
  }, [roomId, applyJoinResult, ensurePlayerId])

  const sendMove = useCallback(
    async (from: string, to: string, promotion?: string): Promise<boolean> => {
      const playerId = playerIdRef.current
      const socket = socketRef.current

      if (socket?.connected) {
        return new Promise((resolve) => {
          socket.emit(
            "move",
            { roomId, playerId, from, to, promotion },
            (result: { ok: boolean; room?: MultiplayerRoom }) => {
              if (result.room) setRoom(result.room)
              resolve(result.ok)
            },
          )
        })
      }

      const res = await fetch(`/api/room/${roomId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, from, to, promotion }),
      })
      const data = await res.json()
      if (data.room) setRoom(data.room)
      return data.ok === true
    },
    [roomId],
  )

  return { room, yourColor, error, connected, sendMove }
}
