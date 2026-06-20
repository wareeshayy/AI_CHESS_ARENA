"use client"

import Link from "next/link"

type NavActive = "home" | "play" | "multiplayer"

interface AppMobileNavProps {
  active?: NavActive
}

const items: { id: NavActive; href: string; label: string; icon: string }[] = [
  { id: "home", href: "/", label: "Home", icon: "♞" },
  { id: "play", href: "/play", label: "Play AI", icon: "🤖" },
]

export default function AppMobileNav({ active = "home" }: AppMobileNavProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 h-14 bg-[#262421] border-t border-[#403d39] flex items-stretch safe-bottom"
      aria-label="Mobile navigation"
    >
      {items.map((item) => {
        const isActive = active === item.id
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
              isActive ? "text-[#81b64c]" : "text-[#888]"
            }`}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
