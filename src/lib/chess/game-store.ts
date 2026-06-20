import type { GameState, MoveRecord } from "@/lib/types/game"

/** Tool 3: Game History — in-memory store with optional MongoDB sync */

const games = new Map<string, GameState>()

export function getGame(gameId: string): GameState | null {
  return games.get(gameId) ?? null
}

export function saveGame(game: GameState): void {
  games.set(game.id, game)
}

export function getGameHistory(gameId: string): { moves: MoveRecord[] } | null {
  const game = games.get(gameId)
  if (!game) return null
  return { moves: game.moves }
}

export function createGameId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// MongoDB integration (optional)
let mongoPromise: Promise<typeof import("@/lib/db/mongodb")> | null = null

async function getMongo() {
  if (!process.env.MONGODB_URI) return null
  if (!mongoPromise) {
    mongoPromise = import("@/lib/db/mongodb")
  }
  return mongoPromise
}

export async function persistGame(game: GameState): Promise<void> {
  saveGame(game)
  try {
    const mongo = await getMongo()
    if (mongo) {
      await mongo.upsertGame(game)
    }
  } catch (err) {
    console.warn("MongoDB persist failed, using in-memory store:", err)
  }
}

export async function loadGame(gameId: string): Promise<GameState | null> {
  const cached = getGame(gameId)
  if (cached) return cached

  try {
    const mongo = await getMongo()
    if (mongo) {
      const game = await mongo.getGameById(gameId)
      if (game) {
        saveGame(game)
        return game
      }
    }
  } catch (err) {
    console.warn("MongoDB load failed:", err)
  }

  return null
}
