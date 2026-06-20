/** Resolve which LLM provider to use (free providers first). */

export type AIProvider = "groq" | "gemini" | "openai"

export function resolveProvider(): AIProvider | null {
  const forced = process.env.AI_PROVIDER?.toLowerCase()

  if (forced === "groq" && process.env.GROQ_API_KEY) return "groq"
  if (forced === "gemini" && process.env.GEMINI_API_KEY) return "gemini"
  if (forced === "openai" && process.env.OPENAI_API_KEY) return "openai"
  if (forced && forced !== "auto") return null

  // auto: prefer free tiers
  if (process.env.GROQ_API_KEY) return "groq"
  if (process.env.GEMINI_API_KEY) return "gemini"
  if (process.env.OPENAI_API_KEY) return "openai"
  return null
}

export function getModelForProvider(provider: AIProvider): string {
  switch (provider) {
    case "groq":
      return process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile"
    case "gemini":
      return process.env.GEMINI_MODEL ?? "gemini-2.0-flash"
    case "openai":
      return process.env.OPENAI_MODEL ?? "gpt-4o-mini"
  }
}
