import { useState } from "react";
import { Brain, Plus, X } from "lucide-react";
import { ChatWindow } from "./components/ChatWindow";
import { startSession, type Problem } from "./lib/api";

// Sample problems to choose from — in a real app, you'd fetch this from the backend
const SAMPLE_PROBLEMS: Problem[] = [
  {
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "Easy",
    topics: ["array", "hashmap"],
    url: "https://leetcode.com/problems/two-sum/",
  },
  {
    title: "Best Time to Buy and Sell Stock",
    slug: "best-time-to-buy-and-sell-stock",
    difficulty: "Easy",
    topics: ["array", "sliding-window"],
  },
  {
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    difficulty: "Easy",
    topics: ["stack", "string"],
  },
  {
    title: "Number of Islands",
    slug: "number-of-islands",
    difficulty: "Medium",
    topics: ["graph", "bfs", "dfs"],
  },
  {
    title: "Coin Change",
    slug: "coin-change",
    difficulty: "Medium",
    topics: ["dynamic-programming"],
  },
];

const DIFFICULTY_COLORS = {
  Easy: "text-green-400",
  Medium: "text-yellow-400",
  Hard: "text-red-400",
};

export default function App() {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  async function handleSelectProblem(problem: Problem) {
    setIsStarting(true);
    try {
      const { session } = await startSession(problem);
      setSessionId(session.id);
      setActiveProblem(problem);
    } finally {
      setIsStarting(false);
    }
  }

  function handleEndSession() {
    setSessionId(null);
    setActiveProblem(null);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="text-blue-400" size={24} />
          <span className="font-semibold text-lg">LeetCode AI Coach</span>
        </div>
        {activeProblem && (
          <div className="flex items-center gap-4">
            <div>
              <span className="text-sm font-medium">{activeProblem.title}</span>
              <span
                className={`text-xs ml-2 ${DIFFICULTY_COLORS[activeProblem.difficulty]}`}
              >
                {activeProblem.difficulty}
              </span>
            </div>
            <button
              onClick={handleEndSession}
              className="text-slate-400 hover:text-slate-200 transition-colors"
              title="End session"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </header>

      {/* Main content */}
      {!sessionId ? (
        // Problem selection screen
        <div className="max-w-2xl mx-auto px-6 py-12">
          <h1 className="text-2xl font-bold mb-2">What are you working on?</h1>
          <p className="text-slate-400 mb-8">
            Select a problem to start a coaching session
          </p>

          <div className="space-y-3">
            {SAMPLE_PROBLEMS.map((problem) => (
              <button
                key={problem.slug}
                onClick={() => handleSelectProblem(problem)}
                disabled={isStarting}
                className="w-full text-left bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-5 py-4 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{problem.title}</span>
                  <span
                    className={`text-sm ${DIFFICULTY_COLORS[problem.difficulty]}`}
                  >
                    {problem.difficulty}
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  {problem.topics.map((topic) => (
                    <span
                      key={topic}
                      className="text-xs bg-slate-700 text-slate-300 rounded-full px-2 py-0.5"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 bg-slate-800 border border-slate-700 rounded-xl">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Plus size={16} />
              <span>Custom problem support coming in Week 2</span>
            </div>
          </div>
        </div>
      ) : (
        // Active coaching session — full height chat
        <div style={{ height: "calc(100vh - 65px)" }}>
          <ChatWindow sessionId={sessionId} />
        </div>
      )}
    </div>
  );
}
