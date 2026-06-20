import type { PieceType } from "@/lib/chess/captured"

const PIECE_NAMES: Record<string, string> = {
  K: "king",
  Q: "queen",
  R: "rook",
  B: "bishop",
  N: "knight",
}

const PROMOTION_NAMES: Record<string, string> = {
  q: "queen",
  r: "rook",
  b: "bishop",
  n: "knight",
}

/** Piece type + color for Neo icon display from SAN */
export function sanToPieceMeta(
  san: string,
): { type: PieceType | "k"; color?: "w" | "b" } | null {
  const clean = san.replace(/[+#?]/g, "")
  if (clean === "O-O" || clean === "O-O-O") return { type: "k" }
  const first = clean.charAt(0)
  if (PIECE_NAMES[first]) {
    const typeMap: Record<string, PieceType | "k"> = {
      K: "k", Q: "q", R: "r", B: "b", N: "n",
    }
    return { type: typeMap[first] ?? "k" }
  }
  return { type: "p" }
}

function squareLabel(square: string): string {
  return square.toLowerCase()
}

function trailingSquare(san: string): string {
  const match = san.match(/([a-h][1-8])/)
  return match ? match[1] : ""
}

/** Convert SAN to beginner-friendly English (no Nf3, Bxe5, etc.) */
export function sanToPlain(san: string): string {
  const isCheck = san.includes("+")
  const isMate = san.includes("#")
  const clean = san.replace(/[+#?]/g, "")

  if (clean === "O-O") return "castling kingside"
  if (clean === "O-O-O") return "castling queenside"

  const suffix = isMate ? ", delivering checkmate" : isCheck ? ", giving check" : ""

  // Promotion e8=Q or exd8=Q
  const promoMatch = clean.match(/=([qrbnQRBN])$/)
  if (promoMatch) {
    const base = clean.slice(0, -2)
    const promo = PROMOTION_NAMES[promoMatch[1].toLowerCase()] ?? "queen"
    if (base.includes("x")) {
      const sq = trailingSquare(base)
      return `pawn captures on ${squareLabel(sq)} and promotes to a ${promo}${suffix}`
    }
    const sq = trailingSquare(base)
    return `pawn moves to ${squareLabel(sq)} and promotes to a ${promo}${suffix}`
  }

  // Pawn moves: e4, exd5, cxd8
  if (/^[a-h]/.test(clean)) {
    if (clean.includes("x")) {
      const sq = trailingSquare(clean)
      return `pawn captures on ${squareLabel(sq)}${suffix}`
    }
    const sq = trailingSquare(clean)
    return `pawn to ${squareLabel(sq)}${suffix}`
  }

  const pieceKey = clean.charAt(0)
  const piece = PIECE_NAMES[pieceKey]
  if (!piece) return clean

  if (clean.includes("x")) {
    const sq = trailingSquare(clean)
    return `${piece} captures on ${squareLabel(sq)}${suffix}`
  }

  const sq = trailingSquare(clean)
  return sq ? `${piece} to ${squareLabel(sq)}${suffix}` : `${piece} move${suffix}`
}

/** Short label for compact UI: "Knight → f3" */
export function sanToPlainShort(san: string): string {
  const plain = sanToPlain(san)
  return plain.replace(/^(\w+) to /, "$1 → ").replace(/^(\w+) captures on /, "$1 × ")
}

/** Wrap coach/LLM text — replace common SAN patterns with plain English */
export function plainLanguageInstruction(): string {
  return `IMPORTANT: Speak in simple, friendly English for beginners. Always name pieces fully (pawn, knight, bishop, rook, queen, king). Describe squares plainly (e.g. "e4", "f3"). NEVER use chess notation like Nf3, Bxe5, Qh4+, or O-O in your replies to the player.`
}

/** Replace standalone SAN tokens in a string with plain descriptions */
export function replaceSanInText(text: string): string {
  return text
    .replace(/\bO-O-O\b/g, "castling queenside")
    .replace(/\bO-O\b/g, "castling kingside")
    .replace(/\b([KQRBN])([a-h]?[1-8]?)?x([a-h][1-8])(\+|#)?\b/g, (_, p, _f, sq, mate) => {
      const piece = PIECE_NAMES[p] ?? "piece"
      const tail = mate === "#" ? ", checkmate" : mate === "+" ? ", check" : ""
      return `${piece} captures on ${sq}${tail}`
    })
    .replace(/\b([KQRBN])([a-h]?[1-8]?)?([a-h][1-8])(\+|#)?\b/g, (_, p, _f, sq, mate) => {
      const piece = PIECE_NAMES[p] ?? "piece"
      const tail = mate === "#" ? ", checkmate" : mate === "+" ? ", check" : ""
      return `${piece} to ${sq}${tail}`
    })
    .replace(/\b([a-h])x([a-h][1-8])(\+|#)?\b/g, (_, _f, sq, mate) => {
      const tail = mate === "#" ? ", checkmate" : mate === "+" ? ", check" : ""
      return `pawn captures on ${sq}${tail}`
    })
    .replace(/\b([a-h][1-8])(\+|#)?\b/g, (_, sq, mate) => {
      const tail = mate === "#" ? ", checkmate" : mate === "+" ? ", check" : ""
      return `pawn to ${sq}${tail}`
    })
}
