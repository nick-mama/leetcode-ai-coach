// This prompt is used for the SECOND AI call, the analysis chain
// The strict JSON requirement is what makes this "structured output"

export function buildAnalyzerPrompt(problem, turns) {
  // Format the conversation into readable text for the analyzer
  const transcript = turns
    .map((t) => `${t.role === "user" ? "Student" : "Coach"}: ${t.content}`)
    .join("\n\n");

  return `You are an expert technical interview evaluator. Analyze this coaching session and return a JSON object.

## The Problem
Title: ${problem.title}
Difficulty: ${problem.difficulty}
Topics: ${Array.isArray(problem.topics) ? problem.topics.join(", ") : problem.topics}

## Session Transcript
${transcript}

## Your Task
Analyze how the student performed and return ONLY a JSON object with no extra text, no markdown, no backticks.

The JSON must follow this exact shape:
{
  "strengths": ["string", "string"],
  "weaknesses": ["string", "string"],
  "mistakes": ["string", "string"],
  "confidence": "low" | "medium" | "high",
  "comm_score": number between 1 and 10,
  "summary": "2-3 sentence summary of the student's performance"
}

## Scoring Guide
- strengths: things the student did well (reasoning, edge cases, complexity awareness)
- weaknesses: patterns to improve (jumping to code, missing edge cases, poor explanation)
- mistakes: specific errors made during this session
- confidence: how confident the student seemed in their approach
- comm_score: how clearly they explained their thinking (1 = silent coder, 10 = excellent verbal reasoning)

Return ONLY the JSON object. No other text.`;
}
