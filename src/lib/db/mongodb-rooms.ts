import { MongoClient, Db } from "mongodb"

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB ?? "chess_arena"

let client: MongoClient | null = null
let db: Db | null = null

export async function getDb(): Promise<Db> {
  if (db) return db
  if (!uri) throw new Error("MONGODB_URI not configured")
  client = new MongoClient(uri)
  await client.connect()
  db = client.db(dbName)
  return db
}
