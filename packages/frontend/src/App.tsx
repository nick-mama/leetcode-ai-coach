import { useState } from "react";
import { Brain, Plus, LayoutDashboard, MessageSquare } from "lucide-react";
import { ChatWindow } from "./components/ChatWindow";
import { Dashboard } from "./components/Dashboard";
import { startSession, type Problem } from "./lib/api";

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

type View = "home" | "chat" | "dashboard";

export default function App() {
  const [view, setView] = useState<View>("home");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  async function handleSelectProblem(problem: Problem) {
    setIsStarting(true);
    try {
      const { session } = await startSession(problem);
      setSessionId(session.id);
      setActiveProblem(problem);
      setView("chat");
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="text-blue-400" size={24} />
          <span className="font-semibold text-lg">LeetCode AI Coach</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Nav tabs */}
          {view !== "chat" && (
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setView("home")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  view === "home"
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Plus size={14} /> Problems
              </button>
              <button
                onClick={() => setView("dashboard")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  view === "dashboard"
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LayoutDashboard size={14} /> Dashboard
              </button>
            </div>
          )}

          {/* Active session info */}
          {view === "chat" && activeProblem && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-blue-400" />
                <span className="text-sm font-medium">
                  {activeProblem.title}
                </span>
                <span
                  className={`text-xs ${DIFFICULTY_COLORS[activeProblem.difficulty]}`}
                >
                  {activeProblem.difficulty}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      {view === "home" && (
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
      )}

      {view === "chat" && sessionId && (
        <div style={{ height: "calc(100vh - 65px)" }}>
          <ChatWindow
            sessionId={sessionId}
            onSessionEnd={() => {
              setSessionId(null);
              setActiveProblem(null);
              setView("dashboard");
            }}
          />
        </div>
      )}

      {view === "dashboard" && (
        <div style={{ height: "calc(100vh - 65px)" }}>
          <Dashboard />
        </div>
      )}
    </div>
  );
}
