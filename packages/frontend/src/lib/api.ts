// All backend communication lives here

const BASE =
  typeof chrome !== "undefined" && chrome.runtime?.id
    ? "http://localhost:3001/api" // Chrome extension
    : "/api"; // Local dev

export interface Problem {
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topics: string[];
  url?: string;
}

export interface Turn {
  id: number;
  session_id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Session {
  id: number;
  problem_id: number;
  status: string;
  started_at: string;
  solved: number;
}

// Start a new coaching session for a problem
export async function startSession(
  problem: Problem,
): Promise<{ session: Session; turns: Turn[] }> {
  const res = await fetch(`${BASE}/sessions/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(problem),
  });
  return res.json();
}

// Stream a chat message, calls onToken for each token, onDone when complete
export async function sendMessage(
  sessionId: number,
  message: string,
  onToken: (token: string) => void,
  onDone: () => void,
) {
  const res = await fetch(`${BASE}/sessions/${sessionId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line.slice(6)); // strip "data: "
        if (parsed.token) onToken(parsed.token);
        if (parsed.done) onDone();
        if (parsed.error) throw new Error(parsed.error);
      } catch {
        /* partial line */
      }
    }
  }
}

export async function endSession(sessionId: number, solved: boolean) {
  const res = await fetch(`${BASE}/sessions/${sessionId}/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ solved }),
  });
  return res.json();
}

export interface Insights {
  id: number;
  session_id: number;
  strengths: string[];
  weaknesses: string[];
  mistakes: string[];
  confidence: string;
  comm_score: number;
  summary: string;
  created_at: string;
}

export interface SessionWithProblem {
  id: number;
  problem_title: string;
  problem_difficulty: string;
  status: string;
  started_at: string;
  solved: number;
}

export async function getInsights(
  sessionId: number,
): Promise<{ insights: Insights }> {
  const res = await fetch(`${BASE}/sessions/${sessionId}/insights`);
  if (!res.ok) throw new Error("No insights yet");
  return res.json();
}

export async function getRecentSessions(): Promise<{
  sessions: SessionWithProblem[];
}> {
  const res = await fetch(`${BASE}/sessions/recent`);
  return res.json();
}

export async function getTurns(sessionId: number): Promise<{ turns: Turn[] }> {
  const res = await fetch(`${BASE}/sessions/${sessionId}/turns`);
  return res.json();
}
