export type RoomColor = "white" | "black"
export type RoomStatus = "waiting" | "playing" | "finished"

export interface RoomPlayer {
  id: string
  color: RoomColor | null
  connected: boolean
}

export interface RoomMove {
  from: string
  to: string
  san: string
  uci: string
  color: "w" | "b"
}

export interface MultiplayerRoom {
  roomId: string
  players: RoomPlayer[]
  gameStarted: boolean
  fen: string
  currentTurn: "w" | "b"
  moves: RoomMove[]
  lastMove?: { from: string; to: string }
  status: RoomStatus
  winner?: RoomColor | "draw"
  message?: string
  updatedAt: number
  version: number
}

export interface JoinResult {
  ok: boolean
  error?: string
  room?: MultiplayerRoom
  yourColor?: RoomColor
}
