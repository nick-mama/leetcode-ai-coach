# LeetCode AI Coach

A Chrome extension that acts as your personal technical interview coach, not a hint generator or solution bot. It studies how you think, tracks your weaknesses over time, and adapts its coaching to your learning profile.

[![Demo Video](https://img.youtube.com/vi/mP42j2LQJLM/maxresdefault.jpg)](https://youtu.be/mP42j2LQJLM)

> Click the thumbnail to watch the demo

---

## What Makes This Different

Most AI coding tools just give you the answer. This one doesn't.

LeetCode AI Coach opens as a sidebar directly on LeetCode or NeetCode, auto-detects the problem you're working on, and coaches you through it using the Socratic method. It asks guiding questions, pushing you to think through edge cases, and escalating hints only when you're genuinely stuck.

After each session it analyzes your performance and builds a learning profile that gets smarter over time.

**Core insight it generates:**

> "You consistently struggle with edge case handling (mentioned in 4 of 5 sessions). Strong hashmap intuition but communication score has plateaued at 7, focus on explaining tradeoffs."

---

## Features

- **Auto problem detection** - opens on any LeetCode or NeetCode problem and starts coaching automatically
- **Adaptive coaching** - hint level escalates from clarifying questions → pattern hints → approach description, never giving away the answer
- **Voice input** - speak your thinking out loud like a real interview
- **Session persistence** - resume any session exactly where you left off
- **AI tool use** - Claude automatically detects when you've solved the problem and ends the session
- **Weakness detection** - analyzes every session and identifies recurring patterns
- **Learning profile** - aggregates all sessions into a personal profile with communication score trends
- **NeetCode roadmap** - tracks your progress through the roadmap with mastery thresholds (2 mediums with 7+ comm score to advance)
- **Session dashboard** - view chat history and insights for every past session

---

## Tech Stack

| Layer     | Technology                              |
| --------- | --------------------------------------- |
| Frontend  | React + TypeScript + Vite + TailwindCSS |
| Backend   | Node.js + Express                       |
| AI        | Claude Haiku (Anthropic API)            |
| Database  | SQLite via better-sqlite3               |
| Extension | Chrome Manifest V3 Side Panel API       |
| Monorepo  | npm workspaces                          |

---

## Architecture

This project implements five AI agent primitives from scratch, no LangChain or agent framework:

- **Memory** - full conversation history fed into every AI call via SQLite
- **Context injection** - problem metadata + learner profile injected into system prompt
- **Stateful sessions** - session lifecycle tracked in database (active → completed)
- **Structured output** - analyzer returns JSON insights from session transcripts
- **Memory summarization** - profile generator aggregates past sessions into coaching context
- **Tool use** - Claude calls `detectSolved()` when it determines you've solved the problem

---

## Getting Started

**Prerequisites**

- Node.js 18+
- Anthropic API key - get one at [console.anthropic.com](https://console.anthropic.com)
- Chrome browser

**1. Clone the repo**

```bash
git clone https://github.com/nick-mama/leetcode-ai-coach.git
cd leetcode-ai-coach
```

**2. Install dependencies**

```bash
npm install
```

**3. Add your API key**

Create `packages/backend/.env`:

```
ANTHROPIC_API_KEY=your_key_here
```

**4. Start the backend**

```bash
npm run dev:backend
```

**5. Build the Chrome extension**

```bash
cd packages/frontend
npm run build
```

**6. Load the extension in Chrome**

- Go to `chrome://extensions/`
- Enable **Developer mode**
- Click **Load unpacked**
- Select `packages/frontend/dist`

**7. Use it**

- Navigate to any LeetCode or NeetCode problem
- Click the LeetCode AI Coach extension icon
- The coach starts automatically

---

## Project Structure

```
leetcode-ai-coach/
├── packages/
│   ├── backend/
│   │   └── src/
│   │       ├── db/           # SQLite schema + queries
│   │       ├── prompts/      # Coach, analyzer, and profile prompts
│   │       ├── routes/       # Express API routes
│   │       └── services/     # AI, analyzer, profiler
│   └── frontend/
│       ├── public/           # manifest.json, content.js, background.js
│       └── src/
│           ├── components/   # ChatWindow, Dashboard, Profile
│           └── lib/          # API client
└── package.json
```

---

## Why I Built This

I wanted to learn AI agent architecture, memory, tool use, structured output, context injection, by building something actually useful. This project implements all of those concepts from scratch without an agent framework, which forced me to understand how they work at the fundamental level.

The coaching philosophy is based on the Socratic method: the best way to learn is to be guided to the answer yourself, not handed it.
