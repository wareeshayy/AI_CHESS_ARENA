"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

interface BoardStageProps {
  children: ReactNode
  loading?: boolean
  loadingText?: string
}

/** Fits the largest possible square inside the available area between player bars */
export default function BoardStage({ children, loading, loadingText = "Setting up..." }: BoardStageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const update = () => {
      const { width, height } = el.getBoundingClientRect()
      setSize(Math.floor(Math.min(width, height)))
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 min-w-0 w-full flex items-center justify-center overflow-hidden"
    >
      {size > 0 && (
        <div
          className="relative shrink-0"
          style={{ width: size, height: size }}
        >
          {loading && (
            <div className="absolute inset-0 z-20 bg-[#312e2b]/80 flex items-center justify-center rounded">
              <div className="text-[#81b64c] animate-pulse font-semibold text-sm">{loadingText}</div>
            </div>
          )}
          <div className="absolute inset-0 overflow-hidden">{children}</div>
        </div>
      )}
    </div>
  )
}
