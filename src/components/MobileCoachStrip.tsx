"use client"

import CoachBubble from "./CoachBubble"
import type { CoachMessage } from "./CoachPanel"

interface MobileCoachStripProps {
  coachName: string
  coachRating: number
  messages: CoachMessage[]
  isThinking: boolean
  fallbackText?: string
}

export default function MobileCoachStrip({
  coachName,
  coachRating,
  messages,
  isThinking,
  fallbackText = "Setting up your game...",
}: MobileCoachStripProps) {
  const lastCoach = [...messages].reverse().find((m) => m.role === "coach")

  const text = isThinking
    ? "Thinking..."
    : lastCoach?.content ?? fallbackText

  return (
    <div className="lg:hidden shrink-0 bg-[#312e2b] border-b border-[#403d39] max-h-[88px] overflow-hidden">
      <CoachBubble
        name={coachName}
        rating={coachRating}
        text={text}
        sentiment={lastCoach?.sentiment}
        moveSan={lastCoach?.moveSan}
        moveColor={lastCoach?.moveColor}
        quality={lastCoach?.quality}
        eval={lastCoach?.eval}
        compact
      />
    </div>
  )
}
