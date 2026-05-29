// This prompt generates a learner profile from aggregated session insights

export function buildProfilePrompt(aggregatedInsights) {
  // If no history yet, return null, no profile to generate
  if (!aggregatedInsights || aggregatedInsights.length === 0) return null;

  // Format the history into readable text for the AI
  const history = aggregatedInsights
    .map((insight) =>
      `
Problem: ${insight.problem_title} (${insight.difficulty})
Topics: ${insight.topics.join(", ")}
Strengths: ${insight.strengths.join(", ")}
Weaknesses: ${insight.weaknesses.join(", ")}
Mistakes: ${insight.mistakes.join(", ")}
Communication Score: ${insight.comm_score}/10
Confidence: ${insight.confidence}
  `.trim(),
    )
    .join("\n\n---\n\n");

  return `You are analyzing a student's coding interview practice history.

## Their Session History
${history}

## Your Task
Summarize this student's learning profile in 3-5 sentences. Focus on:
- Recurring weaknesses that show up across multiple sessions
- Consistent strengths to reinforce
- Communication and confidence trends
- What the coach should watch for in the next session

Return ONLY the summary text. No JSON, no headers, no bullet points. Just a plain paragraph the coach can read before the session starts.`;
}
