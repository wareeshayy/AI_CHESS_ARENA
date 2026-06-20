export type Difficulty = "beginner" | "intermediate" | "advanced";
export type Personality =
  | "friendly_coach"
  | "grandmaster"
  | "aggressive_rival"
  | "casual_opponent";

export interface MoveRecord {
  san: string;
      // e.g. "Nf3"
  uci: string         // e.g. "g1f3"
  fen: string
  color: "w" | "b"
  timestamp: number
  timeSpent?: number  // seconds
  evaluation?: number // centipawns from white's perspective
}

export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
  timestamp: number
}

export interface GameState {
  id: string
  fen: string
  pgn: string
  moves: MoveRecord[]
  difficulty: Difficulty
  personality: Personality
  playerColor: "w" | "b"
  status: "active" | "checkmate" | "stalemate" | "draw" | "resigned"
  winner?: "player" | "ai" | "draw"
  createdAt: number
  updatedAt: number
  chatHistory: ChatMessage[]
}

export interface LegalMoveResult {
  legal: boolean
  fen?: string
  san?: string
  isCheck?: boolean
  isCheckmate?: boolean
  isStalemate?: boolean
  isDraw?: boolean
}

export interface BoardAnalysis {
  score: number       // pawns, white perspective
  bestMove: string    // SAN
  bestMoveUci: string
  depth: number
  mate?: number
}

export interface HintResult {
  hint: string
  category: "development" | "tactics" | "strategy" | "endgame" | "general"
}

export interface AIMoveResponse {
  move: string
  reasoning: string
  evaluation: string
}
