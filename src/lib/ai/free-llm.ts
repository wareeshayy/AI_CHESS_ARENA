import OpenAI from "openai"
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"
import { getModelForProvider } from "@/lib/ai/provider"

export function createGroqClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  })
}

export function createOpenAIClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function groqChat(
  messages: ChatCompletionMessageParam[],
  options?: { tools?: OpenAI.ChatCompletionTool[]; toolChoice?: "auto" | "none" },
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  const client = createGroqClient()
  return client.chat.completions.create({
    model: getModelForProvider("groq"),
    messages,
    tools: options?.tools,
    tool_choice: options?.tools ? (options.toolChoice ?? "auto") : undefined,
    temperature: 0.7,
    max_tokens: 1024,
  })
}

export async function openaiChat(
  messages: ChatCompletionMessageParam[],
  options?: { tools?: OpenAI.ChatCompletionTool[]; toolChoice?: "auto" | "none" },
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  const client = createOpenAIClient()
  return client.chat.completions.create({
    model: getModelForProvider("openai"),
    messages,
    tools: options?.tools,
    tool_choice: options?.tools ? (options.toolChoice ?? "auto") : undefined,
    temperature: 0.7,
    max_tokens: 1024,
  })
}

type GeminiRole = "user" | "model"

interface GeminiMessage {
  role: "user" | "assistant"
  content: string
}

export async function geminiChat(
  systemPrompt: string,
  history: GeminiMessage[],
  userMessage: string,
): Promise<string> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error("GEMINI_API_KEY not configured")

  const model = getModelForProvider("gemini")
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`

  const contents: { role: GeminiRole; parts: { text: string }[] }[] = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))
  contents.push({ role: "user", parts: [{ text: userMessage }] })

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error (${res.status}): ${err.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "I couldn't generate a response."
}
