"use client"

import Link from "next/link"

type NavActive = "home" | "play" | "multiplayer"

interface AppNavSidebarProps {
  active?: NavActive
}

const items: { id: NavActive; href: string; label: string; icon: string }[] = [
  { id: "home", href: "/", label: "Home", icon: "♞" },
  { id: "play", href: "/play", label: "Play AI", icon: "🤖" },
]

function navClass(active: boolean) {
  return `w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors ${
    active
      ? "bg-[#403d39] text-[#81b64c] ring-1 ring-[#81b64c]/40"
      : "text-[#888] hover:bg-[#403d39] hover:text-[#ccc]"
  }`
}

export default function AppNavSidebar({ active = "home" }: AppNavSidebarProps) {
  return (
    <nav
      className="w-14 shrink-0 bg-[#262421] border-r border-[#403d39] flex flex-col items-center py-3 gap-2"
      aria-label="Main navigation"
    >
      <Link href="/" className="mb-2 text-[#81b64c] text-xl font-bold" title="AI Chess Arena">
        ♞
      </Link>

      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          title={item.label}
          className={navClass(active === item.id)}
        >
          {item.icon}
        </Link>
      ))}

      <div className="flex-1" />

      <span className="text-[9px] text-[#555] uppercase tracking-wider rotate-180 [writing-mode:vertical-rl]">
        Arena
      </span>
    </nav>
  )
}
