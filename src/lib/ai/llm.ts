import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"
import { validateMove } from "@/lib/chess/validator"
import { analyzeBoard, formatEvaluation } from "@/lib/chess/analyzer"
import { generateHint } from "@/lib/chess/hints"
import { getGameHistory } from "@/lib/chess/game-store"
import { CHESS_TOOLS, buildSystemPrompt } from "@/lib/ai/tools"
import { geminiChat, groqChat, openaiChat } from "@/lib/ai/free-llm"
import { resolveProvider } from "@/lib/ai/provider"
import type { AIMoveResponse, Difficulty, Personality } from "@/lib/types/game"

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

function localFallbackReply(
  message: string,
  fen: string,
  difficulty: Difficulty,
): string {
  const analysis = analyzeBoard(fen)
  if (message.toLowerCase().includes("hint")) {
    return generateHint(fen, difficulty).hint
  }
  if (message.toLowerCase().includes("best move")) {
    return `The engine suggests ${analysis.bestMove} with an evaluation of ${formatEvaluation(analysis.score)}.`
  }
  return `I'm your chess coach! The current evaluation is ${formatEvaluation(analysis.score)}. Ask me about moves, strategy, or request a hint!`
}

function enrichSystemPrompt(base: string, fen: string, gameId: string, difficulty: Difficulty): string {
  const analysis = analyzeBoard(fen)
  const history = getGameHistory(gameId)
  const hint = generateHint(fen, difficulty)
  return `${base}

Live engine data (use this in your answer):
- Best move: ${analysis.bestMove}
- Evaluation: ${formatEvaluation(analysis.score)}
- Strategic hint: ${hint.hint}
- Moves played: ${history?.moves.length ?? 0}`
}

async function chatWithTools(
  provider: "groq" | "openai",
  messages: ChatCompletionMessageParam[],
): Promise<string> {
  const chat = provider === "groq" ? groqChat : openaiChat

  let response = await chat(messages, { tools: CHESS_TOOLS })
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

    response = await chat(messages, { tools: CHESS_TOOLS })
    iterations++
  }

  return response.choices[0]?.message?.content ?? "I'm not sure how to respond to that."
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
  _gameId: string,
  difficulty: Difficulty,
  _personality: Personality,
): Promise<AIMoveResponse> {
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
  const provider = resolveProvider()
  if (!provider) {
    return localFallbackReply(message, fen, difficulty)
  }

  const system = enrichSystemPrompt(
    buildSystemPrompt(difficulty, personality, fen, gameId),
    fen,
    gameId,
    difficulty,
  )

  try {
    if (provider === "gemini") {
      return await geminiChat(system, history, message)
    }

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: system },
      ...history.map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
      { role: "user", content: message },
    ]

    return await chatWithTools(provider, messages)
  } catch (err) {
    console.warn(`LLM (${provider}) failed, using engine fallback:`, err)
    return localFallbackReply(message, fen, difficulty)
  }
}

export async function generatePostGameReview(
  gameId: string,
  moves: { san: string; color: "w" | "b" }[],
  difficulty: Difficulty,
): Promise<string> {
  const moveList = moves.map((m, i) => `${i + 1}. ${m.color === "w" ? "White" : "Black"}: ${m.san}`).join("\n")
  const provider = resolveProvider()

  const fallback = `## Post-Game Review\n\n**Game Summary:** ${moves.length} moves played.\n\n**Key Observations:**\n- Review your opening moves for proper development\n- Look for tactical opportunities you may have missed\n- Practice endgame techniques\n\nKeep playing to improve!`

  if (!provider) return fallback

  const prompt = `Review this chess game (ID: ${gameId}). Difficulty: ${difficulty}.
Provide: 1) Blunders 2) Missed opportunities 3) Best moves 4) Overall assessment. Be encouraging.

Moves:
${moveList}`

  try {
    if (provider === "gemini") {
      return await geminiChat(
        "You are an encouraging chess coach writing post-game reviews.",
        [],
        prompt,
      )
    }

    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are a chess coach reviewing a completed game. Difficulty: ${difficulty}. Be encouraging.`,
      },
      { role: "user", content: prompt },
    ]

    const chat = provider === "groq" ? groqChat : openaiChat
    const response = await chat(messages)
    return response.choices[0]?.message?.content ?? fallback
  } catch (err) {
    console.warn(`Review LLM (${provider}) failed:`, err)
    return fallback
  }
}

/** Groq/Gemini-powered position explanation for the coach */
export async function explainPosition(
  fen: string,
  gameId: string,
  difficulty: Difficulty,
  personality: Personality,
  focus: "position" | "best-move" | "last-move" = "position",
): Promise<string> {
  const analysis = analyzeBoard(fen)
  const hint = generateHint(fen, difficulty)
  const provider = resolveProvider()

  const focusPrompt = {
    position: "Explain the current position: who is better, key plans, and what both sides should aim for.",
    "best-move": `Recommend the best move (${analysis.bestMove}) and explain why in simple terms.`,
    "last-move": "Comment on the last move played and whether it was good.",
  }[focus]

  const engineContext = `Engine eval: ${formatEvaluation(analysis.score)}. Best move: ${analysis.bestMove}. Hint: ${hint.hint}`

  if (!provider) {
    return `${focusPrompt} ${engineContext}`
  }

  const system = enrichSystemPrompt(
    buildSystemPrompt(difficulty, personality, fen, gameId),
    fen,
    gameId,
    difficulty,
  )

  try {
    if (provider === "gemini") {
      return await geminiChat(system, [], `${focusPrompt}\n\n${engineContext}`)
    }

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: system },
      { role: "user", content: `${focusPrompt}\n\n${engineContext}\n\nKeep answer under 3 sentences.` },
    ]
    const chat = provider === "groq" ? groqChat : openaiChat
    const response = await chat(messages)
    return response.choices[0]?.message?.content ?? engineContext
  } catch (err) {
    console.warn(`Explain LLM (${provider}) failed:`, err)
    return engineContext
  }
}
