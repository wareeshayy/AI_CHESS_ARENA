# AI Chess Arena

[![CI](https://github.com/wareeshayy/AI_CHESS_ARENA/actions/workflows/ci.yml/badge.svg)](https://github.com/wareeshayy/AI_CHESS_ARENA/actions/workflows/ci.yml)

A web-based chess platform built with **Next.js** where users play against an AI coach or friends in real-time multiplayer rooms. **Coach David** explains every move in plain English — pawns, knights, kings, and queens — not chess notation.

**Repository:** [github.com/wareeshayy/AI_CHESS_ARENA](https://github.com/wareeshayy/AI_CHESS_ARENA)

**Live:** [ai-chess-arena.vercel.app](https://ai-chess-arena-xi.vercel.app/)

## Features

- **Coach David** — Plain-language move feedback with Neo piece icons (no Nf3 or Bxe5)
- **AI Opponent** — Engine-backed moves with AI chat (free tier supported)
- **Multiplayer Rooms** — Create a room, share a link or email invite, play 2-player chess
- **Board Themes** — Wood, green, marble, glass, and more
- **Move List** — Piece icons + human-readable labels and evaluation bar
- **Post-Game Review** — Blunders, missed chances, and encouragement

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, React, Tailwind CSS, react-chessboard |
| Backend | Next.js API Routes, Socket.io (local dev) |
| AI |  LLM with tool calling |
| Engine | Minimax analyzer |
| Database | MongoDB Atlas (optional) |
| Email | Resend (optional, for room invites) |
| Deploy | Vercel |

## Getting Started

```bash
npm install
npm run dev                  # includes Socket.io for multiplayer
```

Open [http://localhost:3000](http://localhost:3000).

Works without API keys — the engine fallback handles AI moves and coaching.

See `.env.example` for all optional configuration (AI keys, MongoDB, Resend email).

## Project Structure

```
src/
├── app/
│   ├── api/          # game, move, chat, room, invite
│   ├── play/         # AI coach mode
│   └── room/         # multiplayer
├── components/       # ChessArena, CoachPanel, PlainMoveLabel, etc.
└── lib/
    ├── ai/           # coach, LLM, tools
    ├── chess/        # analyzer, plain-language, board themes
    └── multiplayer/  # rooms, socket sync
```

CI runs on every push and pull request via `.github/workflows/ci.yml` (lint + build).
