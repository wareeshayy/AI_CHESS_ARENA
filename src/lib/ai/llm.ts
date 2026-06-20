import OpenAI from "openai"
import { validateMove } from "@/lib/chess/validator"
import { analyzeBoard, formatEvaluation } from "@/lib/chess/analyzer"
import { generateHint } from "@/lib/chess/hints"
import { getGameHistory } from "@/lib/chess/game-store"
import { CHESS_TOOLS, buildSystemPrompt } from "@/lib/ai/tools"
import type { AIMoveResponse, Difficulty, Personality } from "@/lib/types/game"

function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null
  return new OpenAI({ apiKey: key })
}

function executeToolCall(name: string, args: Record<string, string>): unknown {
  switch (name) {
    case "legal_move_validator":
      return validateMove(args.fen, args.move)
    case "board_analyzer":
      return analyzeBoard(args.fen)
    case "game_history":
      return getGameHistory(args.gameId) ?? { moves: [] }
    case "hint_generator":
      return generateHint(args.fen, (args.difficulty ?? "intermediate") as Difficulty)
    default:
      return { error: `Unknown tool: ${name}` }
  }
}

/** Fast engine move for gameplay — no LLM latency */
export function getEngineMove(fen: string, difficulty: Difficulty): AIMoveResponse {
  const depth = difficulty === "beginner" ? 2 : difficulty === "intermediate" ? 2 : 3
  const analysis = analyzeBoard(fen, depth)

  const reasoningMap: Record<Difficulty, string> = {
    beginner: `I'll play ${analysis.bestMove}. This develops my pieces and helps control the center.`,
    intermediate: `${analysis.bestMove} improves piece activity (${formatEvaluation(analysis.score)}).`,
    advanced: `Engine recommends ${analysis.bestMove} at depth ${analysis.depth} (${formatEvaluation(analysis.score)}).`,
  }

  return {
    move: analysis.bestMove,
    reasoning: reasoningMap[difficulty],
    evaluation: formatEvaluation(analysis.score),
  }
}

export async function getAIMove(
  fen: string,
  gameId: string,
  difficulty: Difficulty,
  personality: Personality,
): Promise<AIMoveResponse> {
  // Use fast engine for move selection during gameplay
  return getEngineMove(fen, difficulty)
}

export async function chatWithAI(
  message: string,
  fen: string,
  gameId: string,
  difficulty: Difficulty,
  personality: Personality,
  history: { role: "user" | "assistant"; content: string }[],
): Promise<string> {
  const openai = getOpenAI()
  if (!openai) {
    const analysis = analyzeBoard(fen)
    if (message.toLowerCase().includes("hint")) {
      const hint = generateHint(fen, difficulty)
      return hint.hint
    }
    if (message.toLowerCase().includes("best move")) {
      return `The engine suggests ${analysis.bestMove} with an evaluation of ${formatEvaluation(analysis.score)}.`
    }
    return `I'm your chess coach! The current evaluation is ${formatEvaluation(analysis.score)}. Ask me about moves, strategy, or request a hint!`
  }

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(difficulty, personality, fen, gameId) },
    ...history.map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
    { role: "user", content: message },
  ]

  let response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages,
    tools: CHESS_TOOLS,
    tool_choice: "auto",
  })

  let iterations = 0
  while (response.choices[0]?.message?.tool_calls && iterations < 5) {
    const toolCalls = response.choices[0].message.tool_calls
    messages.push(response.choices[0].message)

    for (const call of toolCalls) {
      if (call.type !== "function") continue
      const args = JSON.parse(call.function.arguments) as Record<string, string>
      const result = executeToolCall(call.function.name, args)
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      })
    }

    response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages,
      tools: CHESS_TOOLS,
      tool_choice: "auto",
    })
    iterations++
  }

  return response.choices[0]?.message?.content ?? "I'm not sure how to respond to that."
}

export async function generatePostGameReview(
  gameId: string,
  moves: { san: string; color: "w" | "b" }[],
  difficulty: Difficulty,
): Promise<string> {
  const openai = getOpenAI()
  const moveList = moves.map((m, i) => `${i + 1}. ${m.color === "w" ? "White" : "Black"}: ${m.san}`).join("\n")

  if (!openai) {
    return `## Post-Game Review\n\n**Game Summary:** ${moves.length} moves played.\n\n**Key Observations:**\n- Review your opening moves for proper development\n- Look for tactical opportunities you may have missed\n- Practice endgame techniques\n\nKeep playing to improve!`
  }

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a chess coach reviewing a completed game. Difficulty: ${difficulty}. Provide: 1) Blunders 2) Missed opportunities 3) Best moves 4) Overall assessment. Be encouraging.`,
      },
      {
        role: "user",
        content: `Review this game (ID: ${gameId}):\n${moveList}`,
      },
    ],
  })

  return response.choices[0]?.message?.content ?? "Review unavailable."
}
