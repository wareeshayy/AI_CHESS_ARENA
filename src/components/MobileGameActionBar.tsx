"use client"

import type { ReactNode } from "react"

interface MobileGameActionBarProps {
  items: {
    id: string
    label: string
    icon: ReactNode
    onClick: () => void
    disabled?: boolean
  }[]
}

export default function MobileGameActionBar({ items }: MobileGameActionBarProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#262421] border-t border-[#403d39] safe-bottom"
      aria-label="Game actions"
    >
      <div className="flex items-stretch h-14">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            disabled={item.disabled}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-[#aaa] hover:text-[#ccc] hover:bg-[#2e2c29] disabled:opacity-40 transition-colors"
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

export const ActionIcons = {
  options: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
    </svg>
  ),
  resign: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z" />
    </svg>
  ),
  invite: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  ),
  link: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
    </svg>
  ),
  hint: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
    </svg>
  ),
  flip: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6zM6 6h12v2H6V6z" />
    </svg>
  ),
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  ),
}
