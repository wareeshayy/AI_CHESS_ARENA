"use client"

import { ChessPieceIcon } from "./ChessPieces"
import { sanToPieceMeta, sanToPlain, sanToPlainShort } from "@/lib/chess/plain-language"

interface PlainMoveLabelProps {
  san: string
  color: "w" | "b"
  size?: number
  variant?: "full" | "short" | "icon-only"
  className?: string
}

/** Neo piece icon + plain English move label (Chess.com-style) */
export function PlainMoveLabel({
  san,
  color,
  size = 22,
  variant = "full",
  className = "",
}: PlainMoveLabelProps) {
  const meta = sanToPieceMeta(san)
  const label = variant === "short" ? sanToPlainShort(san) : sanToPlain(san)

  if (san === "O-O" || san === "O-O-O") {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <ChessPieceIcon color={color} type="k" size={size} />
        <span>{label}</span>
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {meta && <ChessPieceIcon color={color} type={meta.type} size={size} />}
      {variant !== "icon-only" && <span>{label}</span>}
    </span>
  )
}
