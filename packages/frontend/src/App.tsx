import { useState, useEffect } from "react";
import { Brain, LayoutDashboard, MessageSquare, User } from "lucide-react";
import { ChatWindow } from "./components/ChatWindow";
import { Dashboard } from "./components/Dashboard";
import { startSession, getTurns, type Problem, type Turn } from "./lib/api";
import { Profile } from "./components/Profile";

const DIFFICULTY_COLORS = {
  Easy: "text-green-400",
  Medium: "text-yellow-400",
  Hard: "text-red-400",
};

type View = "home" | "chat" | "dashboard" | "profile";

export default function App() {
  const [view, setView] = useState<View>("home");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [initialTurns, setInitialTurns] = useState<Turn[]>([]);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);

  async function handleSelectProblem(problem: Problem) {
    setIsStarting(true);
    try {
      const { session, turns } = await startSession(problem);
      setSessionId(session.id);
      setActiveProblem(problem);
      setInitialTurns(turns);
      setView("chat");
    } finally {
      setIsStarting(false);
    }
  }

  async function handleResumeSession(
    sessionId: number,
    problemTitle: string,
    problemDifficulty: string,
  ) {
    const { turns } = await getTurns(sessionId);
    setSessionId(sessionId);
    setActiveProblem({
      title: problemTitle,
      slug: "",
      difficulty: problemDifficulty as Problem["difficulty"],
      topics: [],
    });
    setInitialTurns(turns);
    setView("chat");
  }

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage) return;

    let attempts = 0;
    const maxAttempts = 10;

    const poll = setInterval(() => {
      attempts++;
      chrome.storage.local.get(
        "detectedProblem",
        (result: { detectedProblem?: Problem }) => {
          if (result.detectedProblem) {
            clearInterval(poll);
            handleSelectProblem(result.detectedProblem);
            chrome.storage.local.remove("detectedProblem");
          } else if (attempts >= maxAttempts) {
            clearInterval(poll);
          }
        },
      );
    }, 500);

    const storageListener = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (changes.detectedProblem?.newValue) {
        const newProblem = changes.detectedProblem.newValue as Problem;
        setSessionId(null);
        setActiveProblem(null);
        setView("home");
        setTimeout(() => {
          handleSelectProblem(newProblem);
          chrome.storage.local.remove("detectedProblem");
        }, 100);
      }
    };

    chrome.storage.onChanged.addListener(storageListener);
    return () => {
      clearInterval(poll);
      chrome.storage.onChanged.removeListener(storageListener);
    };
  }, []);

  return (
    <div
      className="min-h-screen bg-slate-900 text-slate-100"
      style={{ background: "#0f172a" }}
    >
      {" "}
      {/* Header */}
      <header className="border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="text-blue-400" size={24} />
          <span className="font-semibold text-lg">LeetCode AI Coach</span>
        </div>

        <div className="flex items-center gap-4">
          {view !== "chat" && (
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setView(view === "dashboard" ? "home" : "dashboard")
                }
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  view === "dashboard"
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LayoutDashboard size={14} /> Sessions
              </button>
              <button
                onClick={() => {
                  setProfileRefreshKey((k) => k + 1);
                  setView(view === "profile" ? "home" : "profile");
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  view === "profile"
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <User size={14} /> Profile
              </button>
            </div>
          )}

          {view === "chat" && activeProblem && (
            <div className="flex items-center gap-3">
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
              <button
                onClick={() => setView("dashboard")}
                className="text-slate-400 hover:text-slate-200 transition-colors"
                title="View sessions"
              >
                <LayoutDashboard size={16} />
              </button>
              <button
                onClick={() => {
                  setProfileRefreshKey((k) => k + 1);
                  setView("profile");
                }}
                className="text-slate-400 hover:text-slate-200 transition-colors"
                title="View profile"
              >
                <User size={16} />
              </button>
            </div>
          )}
        </div>
      </header>
      {/* Waiting screen */}
      {view === "home" && (
        <div className="flex flex-col items-center justify-center h-96 text-center px-6">
          <Brain size={48} className="text-slate-600 mb-4" />
          <h1 className="text-xl font-semibold mb-2">Ready to coach</h1>
          <p className="text-slate-400 text-sm">
            Navigate to a LeetCode or NeetCode problem and the coach will start
            automatically. Reload site if the coach doesn't start after a few
            seconds.
          </p>
          {isStarting && (
            <p className="text-blue-400 text-sm mt-4 animate-pulse">
              Detecting problem...
            </p>
          )}
        </div>
      )}
      {view === "chat" && sessionId && (
        <div style={{ height: "calc(100vh - 65px)" }}>
          <ChatWindow
            sessionId={sessionId}
            initialTurns={initialTurns}
            onSessionEnd={() => {
              setSessionId(null);
              setActiveProblem(null);
              setInitialTurns([]);
              setView("dashboard");
            }}
          />
        </div>
      )}
      {view === "dashboard" && (
        <div style={{ height: "calc(100vh - 65px)" }}>
          <Dashboard onResumeSession={handleResumeSession} />
        </div>
      )}
      {view === "profile" && (
        <div style={{ height: "calc(100vh - 65px)" }}>
          <Profile key={profileRefreshKey} />
        </div>
      )}
    </div>
  );
}
