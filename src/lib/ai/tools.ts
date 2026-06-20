import type { ChatCompletionTool } from "openai/resources/chat/completions"

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
    friendly_coach: "You are a warm, encouraging chess coach who celebrates good moves and gently corrects mistakes.",
    grandmaster: "You are a precise, analytical grandmaster who speaks with authority and depth.",
    aggressive_rival: "You are a fierce competitive rival who plays aggressively and trash-talks lightly.",
    casual_opponent: "You are a relaxed casual player who keeps things fun and lighthearted.",
  }

  const difficultyMap: Record<string, string> = {
    beginner: "Use simple language. Explain basic concepts like forks, pins, and development. Avoid deep theory.",
    intermediate: "Use moderate chess terminology. Discuss plans, piece activity, and common tactical motifs.",
    advanced: "Use advanced terminology. Discuss prophylaxis, pawn structures, and deep strategic concepts.",
  }

  return `You are a professional chess coach and opponent in AI Chess Arena.

Personality: ${personalityMap[personality] ?? personalityMap.friendly_coach}
Difficulty level: ${difficultyMap[difficulty] ?? difficultyMap.intermediate}

Current FEN: ${fen}
Game ID: ${gameId}

Rules:
- NEVER generate illegal moves. Always call legal_move_validator before making a move.
- Use board_analyzer to evaluate positions before choosing moves.
- Use game_history to understand the flow of the game.
- Use hint_generator when the user asks for hints.
- Explain moves in language appropriate to the difficulty level.
- Provide strategic insights after each move.

When making a move, respond with JSON:
{"move": "Nf3", "reasoning": "Controls the center and develops a piece.", "evaluation": "+0.8"}

When answering questions, be conversational and educational.`
}
