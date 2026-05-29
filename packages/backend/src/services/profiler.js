import { chat } from "./ollama.js";
import { buildProfilePrompt } from "../prompts/profile.js";
import { insightQueries } from "../db/queries.js";

// Generates a natural language learning profile from past session insights
// Returns null if there's not enough history yet (less than 2 sessions)
export async function generateProfile() {
  const aggregated = insightQueries.getAggregated();

  // Need at least 2 sessions to find patterns
  if (aggregated.length < 2) return null;

  const prompt = buildProfilePrompt(aggregated);
  if (!prompt) return null;

  const profile = await chat([{ role: "user", content: prompt }]);

  return profile.trim();
}
