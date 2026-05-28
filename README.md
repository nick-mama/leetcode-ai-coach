# LeetCode AI Coach

A local-first AI interview learning intelligence system that studies how you think while solving coding problems — not a hint generator or solution bot.

---

## What It Does

Most AI coding tools just give you the answer. This one doesn't.

LeetCode AI Coach acts as a senior engineer sitting next to you — asking guiding questions, identifying when you're skipping edge cases, tracking your reasoning patterns over time, and building a personal learning profile that gets smarter every session.

**Core insight it generates:**

> "You struggle with graph traversal state tracking, DP state transitions, and recognizing monotonic stack problems."

---

## Features

- **Adaptive Coaching** — Asks guiding questions before giving hints. Never gives away the solution.
- **Session Tracking** — Every conversation is saved locally to SQLite.
- **Streaming Responses** — Real-time token streaming from your local LLM.
- **Local-First** — Runs entirely on your machine. No API keys. No data sent anywhere.
- **Weakness Detection** — _(Week 2)_ Identifies recurring mistakes across sessions.
- **Learning Dashboard** — _(Week 2)_ Visualizes strengths, weaknesses, and progress over time.

---

## Tech Stack

| Layer    | Technology                              |
| -------- | --------------------------------------- |
| Frontend | React + TypeScript + Vite + TailwindCSS |
| Backend  | Node.js + Express                       |
| AI       | Ollama (local LLM)                      |
| Database | SQLite via better-sqlite3               |
| Monorepo | npm workspaces                          |

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Ollama](https://ollama.com/) running locally with a model pulled

---

## Getting Started

**1. Clone the repo**

```bash
git clone https://github.com/YOUR_USERNAME/leetcode-ai-coach.git
cd leetcode-ai-coach
```

**2. Install dependencies**

```bash
npm install
```

**3. Pull a model in Ollama**

```bash
ollama pull qwen2.5-coder
```

**4. Update the model name** in `packages/backend/src/services/ollama.js` if needed:

```js
const MODEL = "your-model-name:latest";
```

**5. Start the app**

```bash
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:3001`

---

## Project Structure

```
leetcode-ai-coach/
├── packages/
│   ├── backend/
│   │   └── src/
│   │       ├── db/          # SQLite schema + queries
│   │       ├── prompts/     # AI coaching prompt templates
│   │       ├── routes/      # Express API routes
│   │       └── services/    # Ollama integration
│   └── frontend/
│       └── src/
│           ├── components/  # React components
│           └── lib/         # API client
└── package.json             # Workspace root
```

---

## Why This Exists

Built to learn AI agent architecture, local LLM integration, and adaptive learning systems — while actually shipping something useful. The goal is a coach that understands how _you_ think, not just one that knows algorithms.
