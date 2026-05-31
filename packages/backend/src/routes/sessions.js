import express from "express";
import {
  problemQueries,
  sessionQueries,
  turnQueries,
  insightQueries,
} from "../db/queries.js";
import {
  buildSystemPrompt,
  buildMessages,
  computeHintLevel,
} from "../prompts/coach.js";
import { analyzeSession } from "../services/analyzer.js";
import { generateProfile } from "../services/profiler.js";
import { chatStream } from "../services/ai.js";

const router = express.Router();

// POST /api/sessions/start
// Creates a problem (if new) and starts a session
router.post("/start", (req, res) => {
  const { title, slug, difficulty, topics, url } = req.body;

  if (!title || !slug) {
    return res.status(400).json({ error: "title and slug are required" });
  }

  // Upsert the problem, then create a session linked to it
  const problem = problemQueries.upsert({
    title,
    slug,
    difficulty,
    topics,
    url,
  });
  const session = sessionQueries.create(problem.id);

  res.json({ session, problem });
});

// POST /api/sessions/:id/chat
// The main coaching endpoint; receives user message, streams AI response
router.post("/:id/chat", async (req, res) => {
  const sessionId = parseInt(req.params.id);
  const { message } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  // Load session + problem context
  const session = sessionQueries.findWithProblem(sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  // Save the user's message to the database immediately
  turnQueries.add(sessionId, "user", message);

  // Load the full conversation history (including the message we just saved)
  const turns = turnQueries.getBySession(sessionId);

  // Build the prompt and message array for Ollama
  const problem = {
    title: session.problem_title,
    difficulty: session.problem_difficulty,
    topics: JSON.parse(session.problem_topics ?? "[]"),
    url: session.problem_url,
  };
  const learnerProfile = await generateProfile();
  const hintLevel = computeHintLevel(turns);
  const systemPrompt = buildSystemPrompt(problem, learnerProfile, hintLevel);
  const messages = buildMessages(systemPrompt, turns);

  // Set up Server-Sent Events (SSE); this is how we stream to the browser
  // SSE is simpler than WebSockets for one-way server→client streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    await chatStream(
      messages,
      // onChunk: called for every token; send it to the browser immediately
      (token) => {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      },
      // onDone: called when the full response is complete; save to database
      (fullContent) => {
        turnQueries.add(sessionId, "assistant", fullContent);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      },
    );
  } catch (error) {
    console.error("Ollama error:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// POST /api/sessions/:id/end
router.post("/:id/end", async (req, res) => {
  const sessionId = parseInt(req.params.id);
  const { solved } = req.body;

  const session = sessionQueries.end(sessionId, solved ?? false);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  // Kick off analysis in the background
  // We don't await it
  // Analysis runs on its own and saves to the database when done
  analyzeSession(sessionId)
    .then((insights) => console.log(`Session ${sessionId} analyzed`))
    .catch((err) =>
      console.error(`Analysis failed for session ${sessionId}:`, err.message),
    );

  res.json({ session });
});

// GET /api/sessions/:id/insights
router.get("/:id/insights", async (req, res) => {
  const sessionId = parseInt(req.params.id);
  const insights = insightQueries.getBySession(sessionId);

  if (!insights) {
    return res.status(404).json({ error: "No insights yet for this session" });
  }

  res.json({ insights });
});

// GET /api/sessions/recent
router.get("/recent", (req, res) => {
  const sessions = sessionQueries.getRecent(10);
  res.json({ sessions });
});

// GET /api/sessions/:id/turns
router.get("/:id/turns", (req, res) => {
  const sessionId = parseInt(req.params.id);
  const turns = turnQueries.getBySession(sessionId);
  res.json({ turns });
});

export default router;
