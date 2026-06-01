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
import db from "../db/database.js";

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

  const session = sessionQueries.findWithProblem(sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  turnQueries.add(sessionId, "user", message);
  const turns = turnQueries.getBySession(sessionId);

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

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    await chatStream(
      messages,
      (token) => {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      },
      (fullContent) => {
        turnQueries.add(sessionId, "assistant", fullContent);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      },
      (toolCall) => {
        if (toolCall.tool === "detectSolved") {
          console.log(
            `✅ detectSolved — confidence: ${toolCall.input.confidence}, reason: ${toolCall.input.reason}`,
          );
          sessionQueries.end(sessionId, true);
          analyzeSession(sessionId)
            .then(() =>
              console.log(`✅ Auto-analysis complete for session ${sessionId}`),
            )
            .catch((err) =>
              console.error(`❌ Auto-analysis failed:`, err.message),
            );
          res.write(
            `data: ${JSON.stringify({ autoSolved: true, reason: toolCall.input.reason })}\n\n`,
          );
        }
      },
    );
  } catch (error) {
    console.error("AI error:", error);
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

// DELETE /api/sessions/:id
router.delete("/:id", (req, res) => {
  const sessionId = parseInt(req.params.id);

  // Delete turns first (foreign key constraint)
  db.prepare("DELETE FROM turns WHERE session_id = ?").run(sessionId);
  db.prepare("DELETE FROM session_insights WHERE session_id = ?").run(
    sessionId,
  );
  db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);

  res.json({ success: true });
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
