# AI Chess Arena

[![CI](https://github.com/wareeshayy/AI_CHESS_ARENA/actions/workflows/ci.yml/badge.svg)](https://github.com/wareeshayy/AI_CHESS_ARENA/actions/workflows/ci.yml)

A web-based chess platform built with **Next.js** where users play against an AI opponent powered by **LLM tool calling**. The AI explains moves, suggests strategies, analyzes positions, and adapts to difficulty level.

**Repository:** [github.com/wareeshayy/AI_CHESS_ARENA](https://github.com/wareeshayy/AI_CHESS_ARENA)


**Live:** [ai_chess_arena](https://ai-chess-arena-xi.vercel.app/)

## Features

- **AI Chess Opponent** — Play vs AI with engine-backed move selection
- **Move Explanation** — Ask "Why did you move the knight?" in the Chat tab
- **Dynamic Difficulty** — Beginner, Intermediate, Advanced
- **Position Analysis** — Best move, hints, evaluation via tool calling
- **Post-Game Review** — Blunders, missed opportunities, best moves
- **Lichess-style Move List** — Two-column notation with piece icons and evaluation bar
- **Playback Controls** — Navigate, auto-play, flip board

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, React, Tailwind CSS, react-chessboard |
| Backend | Next.js API Routes |
| AI | OpenAI with Tool Calling |
| Engine | Minimax analyzer (Stockfish-style) |
| Database | MongoDB Atlas (optional) |
| Deploy | Vercel |

## Tool Calling Architecture

| Tool | Purpose |
|------|---------|
| `legal_move_validator` | Validate moves via chess.js |
| `board_analyzer` | Evaluate positions, find best move |
| `game_history` | Retrieve previous moves |
| `hint_generator` | Strategic hints without revealing moves |

## Getting Started

```bash
npm install
cp .env.example .env.local   # add a FREE Groq or Gemini key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Works without API keys — the engine fallback handles AI moves and chat.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | No | **Free** AI chat & reviews ([Groq console](https://console.groq.com/keys)) |
| `GEMINI_API_KEY` | No | **Free** alternative ([Google AI Studio](https://aistudio.google.com/apikey)) |
| `AI_PROVIDER` | No | `auto` (default), `groq`, `gemini`, or `openai` |
| `GROQ_MODEL` | No | Default: `llama-3.3-70b-versatile` |
| `GEMINI_MODEL` | No | Default: `gemini-2.0-flash` |
| `OPENAI_API_KEY` | No | Paid — enables OpenAI (requires billing credits) |
| `OPENAI_MODEL` | No | Default: `gpt-4o-mini` |
| `MONGODB_URI` | No | Persists games to MongoDB Atlas |
| `MONGODB_DB` | No | Database name (default: `chess_arena`) |

## Deploy on Vercel

### Option A — GitHub integration (recommended)

1. Push this repo to [AI_CHESS_ARENA](https://github.com/wareeshayy/AI_CHESS_ARENA)
2. Import the project in [Vercel](https://vercel.com/new)
3. Connect the GitHub repo — Vercel auto-deploys on every push to `main`
4. Add environment variables in the Vercel dashboard

### Option B — GitHub Actions deploy workflow

The repo includes `.github/workflows/deploy.yml`. Add these repository secrets in GitHub → Settings → Secrets and variables → Actions:

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | From [Vercel account tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | From `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | From `.vercel/project.json` after `vercel link` |

CI runs on every push and pull request via `.github/workflows/ci.yml` (lint + build).

## Project Structure

```
src/
├── app/
│   ├── api/          # game, move, chat, analyze, review, ai-move
│   └── page.tsx      # Main arena
├── components/       # ChessArena, MoveList, GameSidebar, etc.
└── lib/
    ├── ai/           # LLM + tool calling
    ├── chess/        # validator, analyzer, hints, notation
    ├── db/           # MongoDB
    └── types/        # TypeScript types
```
