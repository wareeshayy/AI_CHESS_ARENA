"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import AppNavSidebar from "./AppNavSidebar"
import AppMobileNav from "./AppMobileNav"

export default function HomeLobby() {
  const router = useRouter()
  const [joinCode, setJoinCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createRoom = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/room/create", { method: "POST" })
      const data = await res.json()
      if (data.roomId) router.push(`/room/${data.roomId}`)
      else setError(data.error ?? "Failed to create room")
    } catch {
      setError("Failed to create room")
    } finally {
      setLoading(false)
    }
  }

  const joinRoom = () => {
    const code = joinCode.trim().toLowerCase().replace(/.*\/room\//, "")
    if (!code) return
    router.push(`/room/${code}`)
  }

  return (
    <div className="arena-shell h-[100dvh] overflow-hidden bg-[#312e2b] text-white flex flex-col md:flex-row">
      <AppNavSidebar active="home" />

      <main className="flex-1 min-h-0 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-md space-y-4">
          <h1 className="text-2xl font-bold text-center text-[#ebebeb] mb-6">Choose Mode</h1>

          <Link
            href="/play"
            className="block w-full py-4 px-6 bg-[#81b64c] hover:bg-[#9bc55c] rounded-lg text-center font-bold text-[#262421] transition-colors"
          >
            Play vs AI Coach
          </Link>

          <button
            type="button"
            onClick={createRoom}
            disabled={loading}
            className="w-full py-4 px-6 bg-[#369] hover:bg-[#4a8] disabled:opacity-50 rounded-lg font-bold transition-colors"
          >
            {loading ? "Creating..." : "Create Multiplayer Room"}
          </button>

          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && joinRoom()}
              placeholder="Room code or link"
              className="flex-1 bg-[#403d39] border border-[#5a5652] rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-[#81b64c]"
            />
            <button
              type="button"
              onClick={joinRoom}
              className="px-5 py-3 bg-[#403d39] hover:bg-[#4a4744] border border-[#5a5652] rounded-lg font-bold text-sm"
            >
              Join
            </button>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <p className="text-[#888] text-xs text-center pt-2">
            Multiplayer: share room link with a friend. No login required.
          </p>
        </div>
      </main>

      <AppMobileNav active="home" />
    </div>
  )
}
