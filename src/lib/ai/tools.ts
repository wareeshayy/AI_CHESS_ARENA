import type { ChatCompletionTool } from "openai/resources/chat/completions"
import { plainLanguageInstruction } from "@/lib/chess/plain-language"

export const CHESS_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "legal_move_validator",
      description: "Validate whether a chess move is legal for the given position. Always call this before making a move.",
      parameters: {
        type: "object",
        properties: {
          fen: { type: "string", description: "FEN string of the current position" },
          move: { type: "string", description: "Move in SAN (Nf3) or UCI (g1f3) format" },
        },
        required: ["fen", "move"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "board_analyzer",
      description: "Evaluate the current board position and find the best move using engine analysis.",
      parameters: {
        type: "object",
        properties: {
          fen: { type: "string", description: "FEN string of the current position" },
        },
        required: ["fen"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "game_history",
      description: "Retrieve the move history of the current game.",
      parameters: {
        type: "object",
        properties: {
          gameId: { type: "string", description: "The game ID" },
        },
        required: ["gameId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "hint_generator",
      description: "Generate a strategic hint without revealing the exact best move.",
      parameters: {
        type: "object",
        properties: {
          fen: { type: "string", description: "FEN string of the current position" },
          difficulty: {
            type: "string",
            enum: ["beginner", "intermediate", "advanced"],
            description: "Player difficulty level",
          },
        },
        required: ["fen", "difficulty"],
      },
    },
  },
]

export function buildSystemPrompt(
  difficulty: string,
  personality: string,
  fen: string,
  gameId: string,
): string {
  const personalityMap: Record<string, string> = {
    friendly_coach: "You are Coach David — a warm, patient teacher who explains chess like talking to a friend. Use simple words.",
    grandmaster: "You are Coach Magnus — precise but still plain-spoken, avoiding jargon when possible.",
    aggressive_rival: "You are Coach Max — competitive and direct, but always name pieces clearly (pawn, knight, etc.).",
    casual_opponent: "You are Coach Sam — relaxed and fun, keeping explanations easy to follow.",
  }

  const difficultyMap: Record<string, string> = {
    beginner: "Assume the player is new. Explain ideas with everyday language — forks, pins, and development in simple terms.",
    intermediate: "Use clear plans and tactics, still avoiding chess notation in speech.",
    advanced: "Discuss strategy deeply, but still say 'knight to f3' instead of 'Nf3'.",
  }

  return `You are a professional chess coach in AI Chess Arena.

Personality: ${personalityMap[personality] ?? personalityMap.friendly_coach}
Difficulty level: ${difficultyMap[difficulty] ?? difficultyMap.intermediate}

Current FEN: ${fen}
Game ID: ${gameId}

${plainLanguageInstruction()}

Rules:
- NEVER generate illegal moves. Always call legal_move_validator before making a move.
- Use board_analyzer to evaluate positions before choosing moves.
- Use game_history to understand the flow of the game.
- Use hint_generator when the user asks for hints.
- Explain every move using piece names and square names only.

When making a move internally, use standard notation in JSON only:
{"move": "Nf3", "reasoning": "The knight heads to f3 and controls the center.", "evaluation": "+0.8"}

When speaking to the player, rewrite all moves in plain English in the reasoning field too.

When answering questions, be conversational, encouraging, and educational.`
}
