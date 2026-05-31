import { buildAnalyzerPrompt } from "../prompts/analyzer.js";
import { turnQueries, sessionQueries, insightQueries } from "../db/queries.js";
import { chat } from "../services/ai.js";

// analysis chain, the fourth agent primitive
// It runs after a session ends and produces structured insights
export async function analyzeSession(sessionId) {
  // Load the session with problem context
  const session = sessionQueries.findWithProblem(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);

  // Load the full conversation
  const turns = turnQueries.getBySession(sessionId);
  if (turns.length < 2) {
    throw new Error("Not enough conversation to analyze");
  }

  const problem = {
    title: session.problem_title,
    difficulty: session.problem_difficulty,
    topics: JSON.parse(session.problem_topics ?? "[]"),
  };

  // Build the analyzer prompt with the full transcript
  const prompt = buildAnalyzerPrompt(problem, turns);

  // Use the non-streaming chat call
  const raw = await chat([{ role: "user", content: prompt }]);

  // Parse the JSON response from the AI
  // The model sometimes wraps it in backticks despite instructions
  const cleaned = raw
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  let insights;
  try {
    insights = JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse analyzer response:", raw);
    throw new Error("AI returned invalid JSON — try again");
  }

  // Save the insights to the database
  const saved = insightQueries.save(sessionId, insights);
  return saved;
}
