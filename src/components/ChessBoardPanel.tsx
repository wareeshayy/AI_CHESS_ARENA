"use client"

import { useState, useCallback, useMemo } from "react"
import { Chess, type Square } from "chess.js"
import { Chessboard } from "react-chessboard"
import type { PieceDropHandlerArgs, SquareHandlerArgs } from "react-chessboard"
import { neoPieces, NeoPieceImg } from "./NeoPieces"
import { EvalBar, MoveQualityBadge } from "./EvalBar"
import type { MoveQuality } from "@/lib/ai/coach"
import {
  getThemeStyles,
  squareHighlight,
  squareDot,
  type BoardThemeId,
} from "@/lib/chess/board-themes"

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

interface ChessBoardPanelProps {
  fen: string
  orientation: "white" | "black"
  canMove: boolean
  playerColor: "w" | "b"
  boardTheme?: BoardThemeId
  onMove: (from: string, to: string, promotion?: string) => boolean
  lastMove?: { from: string; to: string }
  evaluation?: number
  moveQuality?: MoveQuality
  hintArrow?: { from: string; to: string }
}

export default function ChessBoardPanel({
  fen,
  orientation,
  canMove,
  playerColor,
  boardTheme = "classic-wood",
  onMove,
  lastMove,
  evaluation = 0,
  moveQuality,
  hintArrow,
}: ChessBoardPanelProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [promotionPending, setPromotionPending] = useState<{ from: string; to: string } | null>(null)

  const styles = useMemo(() => getThemeStyles(boardTheme), [boardTheme])

  const positionFen = fen === "start" ? START_FEN : fen

  const chessState = useMemo(() => {
    try {
      return new Chess(positionFen)
    } catch {
      return null
    }
  }, [positionFen])

  const kingInCheckSquare = useMemo(() => {
    if (!chessState?.isCheck()) return null
    const board = chessState.board()
    const turn = chessState.turn()
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c]
        if (p?.type === "k" && p.color === turn) {
          return `${String.fromCharCode(97 + c)}${8 - r}`
        }
      }
    }
    return null
  }, [chessState])

  const legalMoves = useMemo(() => chessState?.moves({ verbose: true }) ?? [], [chessState])

  const legalTargets = useMemo(() => {
    if (!selectedSquare) return new Set<string>()
    return new Set(legalMoves.filter((m) => m.from === selectedSquare).map((m) => m.to))
  }, [selectedSquare, legalMoves])

  const arrows = useMemo(() => {
    if (!hintArrow) return []
    return [{ startSquare: hintArrow.from, endSquare: hintArrow.to, color: "rgba(129, 182, 76, 0.85)" }]
  }, [hintArrow])

  const squareStyles = useMemo(() => {
    const result: Record<string, React.CSSProperties> = {}

    if (lastMove) {
      result[lastMove.from] = squareHighlight(styles.lastMove)
      result[lastMove.to] = squareHighlight(styles.lastMove)
    }
    if (selectedSquare) result[selectedSquare] = squareHighlight(styles.selected)
    if (kingInCheckSquare) result[kingInCheckSquare] = { background: styles.check }

    legalTargets.forEach((sq) => {
      const isCapture = legalMoves.some((m) => m.from === selectedSquare && m.to === sq && m.captured)
      result[sq] = { ...result[sq], ...squareDot(isCapture) }
    })

    return result
  }, [lastMove, selectedSquare, legalTargets, legalMoves, kingInCheckSquare, styles])

  const tryMove = useCallback(
    (from: string, to: string, promotion?: string): boolean => {
      const chess = new Chess(positionFen)
      const moves = chess.moves({ square: from as Square, verbose: true })
      const match = moves.find((m) => m.to === to)
      if (!match) return false
      if (match.promotion && !promotion) {
        setPromotionPending({ from, to })
        setSelectedSquare(null)
        return false
      }
      const ok = onMove(from, to, promotion ?? match.promotion)
      if (ok) {
        setSelectedSquare(null)
        setPromotionPending(null)
      }
      return ok
    },
    [positionFen, onMove],
  )

  const handlePieceDrop = ({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean => {
    if (!canMove || !targetSquare) return false
    return tryMove(sourceSquare, targetSquare)
  }

  const handleSquareClick = ({ square, piece }: SquareHandlerArgs) => {
    if (!canMove) return
    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null)
        return
      }
      if (legalTargets.has(square)) {
        tryMove(selectedSquare, square)
        return
      }
    }
    if (piece && piece.pieceType.charAt(0) === playerColor) setSelectedSquare(square)
    else setSelectedSquare(null)
  }

  const evalForBar = playerColor === "w" ? evaluation : -evaluation

  return (
    <div className="flex items-stretch w-full max-w-[min(100vw-2rem,640px)]">
      <EvalBar
        evaluation={evalForBar}
        orientation={orientation}
        evalLight={styles.evalLight}
        evalDark={styles.evalDark}
        borderColor={styles.boardBorder}
      />

      <div className="relative flex-1 aspect-square">
        <Chessboard
          options={{
            position: positionFen,
            boardOrientation: orientation,
            pieces: neoPieces,
            onPieceDrop: handlePieceDrop,
            onSquareClick: handleSquareClick,
            allowDragging: canMove,
            canDragPiece: ({ piece }) => canMove && piece.pieceType.charAt(0) === playerColor,
            animationDurationInMs: 200,
            showAnimations: true,
            showNotation: true,
            squareStyles,
            arrows,
            squareStyle: styles.squareTransparent,
            darkSquareStyle: styles.squareTransparent,
            lightSquareStyle: styles.squareTransparent,
            darkSquareNotationStyle: styles.notationDark,
            lightSquareNotationStyle: styles.notationLight,
            alphaNotationStyle: { ...styles.notationLight, ...styles.notationAlpha },
            numericNotationStyle: { ...styles.notationLight, ...styles.notationNumeric },
            boardStyle: styles.boardFrameStyle,
          }}
        />

        {lastMove && moveQuality && (
          <MoveQualityBadge quality={moveQuality} square={lastMove.to} orientation={orientation} />
        )}

        {promotionPending && (
          <div className="absolute inset-0 bg-black/55 flex items-center justify-center z-10">
            <div className="bg-[#262421] rounded-lg p-4 border border-[#403d39] shadow-xl">
              <p className="text-[#ebebeb] text-sm mb-3 text-center font-semibold">Promote pawn to:</p>
              <div className="flex gap-2">
                {(["q", "r", "b", "n"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => tryMove(promotionPending.from, promotionPending.to, p)}
                    className="w-14 h-14 bg-[#403d39] hover:bg-[#5a5652] rounded flex items-center justify-center"
                  >
                    <NeoPieceImg color={playerColor} type={p} size={44} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
