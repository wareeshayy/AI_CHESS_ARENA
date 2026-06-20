import { MongoClient, Db, Collection } from "mongodb"
import type { GameState } from "@/lib/types/game"

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB ?? "chess_arena"

let client: MongoClient | null = null
let db: Db | null = null

async function getDb(): Promise<Db> {
  if (db) return db
  if (!uri) throw new Error("MONGODB_URI not configured")
  client = new MongoClient(uri)
  await client.connect()
  db = client.db(dbName)
  return db
}

async function getCollection(): Promise<Collection<GameState>> {
  const database = await getDb()
  return database.collection<GameState>("games")
}

export async function upsertGame(game: GameState): Promise<void> {
  const col = await getCollection()
  await col.updateOne({ id: game.id }, { $set: game }, { upsert: true })
}

export async function getGameById(id: string): Promise<GameState | null> {
  const col = await getCollection()
  return col.findOne({ id })
}

export async function listGames(limit = 20): Promise<GameState[]> {
  const col = await getCollection()
  return col.find({}).sort({ updatedAt: -1 }).limit(limit).toArray()
}
