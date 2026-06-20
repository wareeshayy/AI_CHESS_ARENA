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
  const [joining, setJoining] = useState(true)
  const playerIdRef = useRef("")
  const socketRef = useRef<Socket | null>(null)
  const versionRef = useRef(0)
  const connectedRef = useRef(false)
  const joinedRef = useRef(false)

  const ensurePlayerId = useCallback(() => {
    if (!playerIdRef.current) {
      playerIdRef.current = getPlayerId()
    }
    return playerIdRef.current
  }, [])

  const applyJoinResult = useCallback((result: JoinResult) => {
    if (!result.ok) {
      setError(result.error ?? "Failed to join")
      return false
    }
    if (result.room) {
      setRoom(result.room)
      versionRef.current = result.room.version
    }
    if (result.yourColor) setYourColor(result.yourColor)
    setError(null)
    joinedRef.current = true
    return true
  }, [])

  useEffect(() => {
    if (!roomId) return
    ensurePlayerId()
    joinedRef.current = false
    setJoining(true)
    setError(null)

    let pollTimer: ReturnType<typeof setInterval> | null = null
    let socketConnected = false
    let cancelled = false

    const markConnected = () => {
      connectedRef.current = true
      setConnected(true)
    }

    const joinViaApi = async (): Promise<boolean> => {
      if (joinedRef.current) {
        setJoining(false)
        return true
      }

      const maxAttempts = 4
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (cancelled) return false
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, 700 * attempt))
        }

        try {
          const res = await fetch("/api/room/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, playerId: playerIdRef.current }),
          })
          const data = await res.json()
          if (cancelled) return false

          if (!res.ok) {
            const msg = data.error ?? "Failed to join"
            const retryable = msg === "Room not found" && attempt < maxAttempts - 1
            if (retryable) continue
            if (!joinedRef.current) setError(msg)
            return false
          }

          applyJoinResult(data)
          markConnected()
          return true
        } catch {
          if (attempt === maxAttempts - 1 && !cancelled && !joinedRef.current) {
            setError("Could not connect to room")
          }
          if (attempt < maxAttempts - 1) continue
          return false
        }
      }

      return false
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/room/${roomId}?since=${versionRef.current}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.unchanged) return
        if (data.room) {
          versionRef.current = data.room.version
          setRoom(data.room)
          setError(null)
          const me = data.room.players.find((p: { id: string }) => p.id === playerIdRef.current)
          if (me?.color) setYourColor(me.color)
        }
      } catch {
        /* ignore poll errors */
      }
    }

    // Join immediately (Vercel has no Socket.io)
    void joinViaApi().finally(() => {
      if (!cancelled) setJoining(false)
    })
    pollTimer = setInterval(poll, 1500)

    const socket = io({
      path: "/api/socket/io",
      transports: ["websocket", "polling"],
      reconnection: true,
      timeout: 3000,
    })
    socketRef.current = socket

    socket.on("connect", () => {
      socketConnected = true
      if (!joinedRef.current) {
        socket.emit(
          "join-room",
          { roomId, playerId: playerIdRef.current },
          (result: JoinResult) => {
            if (applyJoinResult(result)) markConnected()
            setJoining(false)
          },
        )
      }
    })

    socket.on("room-update", (updated: MultiplayerRoom) => {
      versionRef.current = updated.version
      setRoom(updated)
      setError(null)
      const me = updated.players.find((p) => p.id === playerIdRef.current)
      if (me?.color) setYourColor(me.color)
    })

    socket.on("connect_error", () => {
      if (!socketConnected && !joinedRef.current) {
        void joinViaApi().finally(() => {
          if (!cancelled) setJoining(false)
        })
      }
    })

    return () => {
      cancelled = true
      if (pollTimer) clearInterval(pollTimer)
      socket.disconnect()
    }
  }, [roomId, applyJoinResult, ensurePlayerId])

  const leaveRoom = useCallback(async () => {
    if (!playerIdRef.current) return
    await fetch(`/api/room/${roomId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: playerIdRef.current }),
    }).catch(() => {})
  }, [roomId])

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

  return { room, yourColor, error, connected, joining, sendMove, leaveRoom }
}
