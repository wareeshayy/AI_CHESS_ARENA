import { Chess } from "chess.js"
import { randomBytes } from "crypto"
import type { JoinResult, MultiplayerRoom, RoomColor, RoomMove } from "./types"

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

/** In-memory store (socket server + dev fallback) */
const memoryRooms = new Map<string, MultiplayerRoom>()

function generateRoomId(): string {
  return randomBytes(3).toString("hex")
}

function colorToChess(c: RoomColor): "w" | "b" {
  return c === "white" ? "w" : "b"
}

function chessToColor(c: "w" | "b"): RoomColor {
  return c === "w" ? "white" : "black"
}

function freshRoom(roomId: string): MultiplayerRoom {
  return {
    roomId,
    players: [],
    gameStarted: false,
    fen: START_FEN,
    currentTurn: "w",
    moves: [],
    status: "waiting",
    updatedAt: Date.now(),
    version: 1,
  }
}

async function getCollection() {
  if (!process.env.MONGODB_URI) return null
  const { getDb } = await import("@/lib/db/mongodb-rooms")
  return getDb().then((db) => db.collection<MultiplayerRoom>("rooms"))
}

export async function getRoom(roomId: string): Promise<MultiplayerRoom | null> {
  const normalized = roomId.toLowerCase().trim()

  // Serverless: memory is per-instance — always read MongoDB first
  try {
    const col = await getCollection()
    if (col) {
      const doc = await col.findOne({ roomId: normalized })
      if (doc) {
        memoryRooms.set(normalized, doc)
        return doc
      }
    }
  } catch (err) {
    console.warn("MongoDB getRoom failed:", err)
  }

  return memoryRooms.get(normalized) ?? null
}

async function saveRoom(room: MultiplayerRoom): Promise<MultiplayerRoom> {
  room.updatedAt = Date.now()
  room.version += 1
  memoryRooms.set(room.roomId, room)

  const col = await getCollection()
  if (col) {
    try {
      await col.updateOne({ roomId: room.roomId }, { $set: room }, { upsert: true })
      return room
    } catch (err) {
      console.error("MongoDB saveRoom failed:", err)
      if (process.env.VERCEL) {
        throw new Error(
          "Could not save room — check MONGODB_URI on Vercel (Network Access must allow 0.0.0.0/0).",
        )
      }
      throw err
    }
  }

  if (process.env.VERCEL) {
    throw new Error("MongoDB is required for multiplayer on Vercel. Set MONGODB_URI in env vars.")
  }

  return room
}

export async function createRoom(): Promise<MultiplayerRoom> {
  let roomId = generateRoomId()
  while (await getRoom(roomId)) {
    roomId = generateRoomId()
  }
  const room = freshRoom(roomId)
  return saveRoom(room)
}

export async function joinRoom(roomId: string, playerId: string): Promise<JoinResult> {
  const normalized = roomId.toLowerCase().trim()
  let room = await getRoom(normalized)

  if (!room) {
    return { ok: false, error: "Room not found" }
  }

  const existing = room.players.find((p) => p.id === playerId)
  if (existing) {
    existing.connected = true
    await saveRoom(room)
    return {
      ok: true,
      room,
      yourColor: existing.color ?? undefined,
    }
  }

  if (room.players.length >= 2) {
    return { ok: false, error: "Room is full" }
  }

  room.players.push({ id: playerId, color: null, connected: true })

  if (room.players.length === 2) {
    const firstWhite = Math.random() > 0.5
    room.players[0].color = firstWhite ? "white" : "black"
    room.players[1].color = firstWhite ? "black" : "white"
    room.gameStarted = true
    room.status = "playing"
    room.message = "Opponent found! Game starting..."
  } else {
    room.message = "Waiting for opponent..."
  }

  room = await saveRoom(room)
  const yourColor = room.players.find((p) => p.id === playerId)?.color ?? undefined
  return { ok: true, room, yourColor: yourColor ?? undefined }
}

export async function leaveRoom(roomId: string, playerId: string): Promise<MultiplayerRoom | null> {
  const room = await getRoom(roomId.toLowerCase())
  if (!room) return null

  const player = room.players.find((p) => p.id === playerId)
  if (!player) return room

  player.connected = false

  if (room.status === "playing") {
    room.status = "finished"
    room.message = "Opponent left — you win!"
    const winner = room.players.find((p) => p.id !== playerId && p.color)
    room.winner = winner?.color ?? "draw"
  }

  return saveRoom(room)
}

export async function makeMove(
  roomId: string,
  playerId: string,
  from: string,
  to: string,
  promotion?: string,
): Promise<{ ok: boolean; error?: string; room?: MultiplayerRoom }> {
  const room = await getRoom(roomId.toLowerCase())
  if (!room) return { ok: false, error: "Room not found" }
  if (!room.gameStarted || room.status !== "playing") {
    return { ok: false, error: "Game not active" }
  }

  const player = room.players.find((p) => p.id === playerId)
  if (!player?.color) return { ok: false, error: "Not in room" }

  const chess = new Chess(room.fen)
  if (chess.turn() !== colorToChess(player.color)) {
    return { ok: false, error: "Not your turn" }
  }

  let result
  try {
    result = chess.move({
      from,
      to,
      promotion: promotion as "q" | "r" | "b" | "n" | undefined,
    })
  } catch {
    return { ok: false, error: "Illegal move" }
  }
  if (!result) return { ok: false, error: "Illegal move" }

  const move: RoomMove = {
    from,
    to,
    san: result.san,
    uci: `${from}${to}${result.promotion ?? ""}`,
    color: result.color,
  }

  room.fen = chess.fen()
  room.currentTurn = chess.turn()
  room.lastMove = { from, to }
  room.moves.push(move)
  room.message = undefined

  if (chess.isGameOver()) {
    room.status = "finished"
    room.gameStarted = false
    if (chess.isCheckmate()) {
      room.winner = chessToColor(chess.turn() === "w" ? "b" : "w")
      room.message = "Checkmate!"
    } else if (chess.isStalemate()) {
      room.winner = "draw"
      room.message = "Stalemate — draw"
    } else {
      room.winner = "draw"
      room.message = "Game over — draw"
    }
  }

  const saved = await saveRoom(room)
  return { ok: true, room: saved }
}

/** Sync in-memory from Mongo on server start */
export function getMemoryRoom(roomId: string): MultiplayerRoom | undefined {
  return memoryRooms.get(roomId.toLowerCase())
}

export function setMemoryRoom(room: MultiplayerRoom): void {
  memoryRooms.set(room.roomId, room)
}
