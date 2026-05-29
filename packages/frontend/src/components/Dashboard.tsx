import { useEffect, useState } from "react";
import {
  Brain,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import {
  getRecentSessions,
  getInsights,
  type SessionWithProblem,
  type Insights,
} from "../lib/api";

const DIFFICULTY_COLORS = {
  Easy: "text-green-400",
  Medium: "text-yellow-400",
  Hard: "text-red-400",
};

export function Dashboard() {
  const [sessions, setSessions] = useState<SessionWithProblem[]>([]);
  const [selectedInsights, setSelectedInsights] = useState<Insights | null>(
    null,
  );
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    getRecentSessions()
      .then((data) => setSessions(data.sessions))
      .finally(() => setLoading(false));
  }, []);

  async function handleSelectSession(sessionId: number) {
    setSelectedSessionId(sessionId);
    setInsightsLoading(true);
    setSelectedInsights(null);
    try {
      const data = await getInsights(sessionId);
      setSelectedInsights(data.insights);
    } catch {
      setSelectedInsights(null);
    } finally {
      setInsightsLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Loading sessions...
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
        <Brain size={40} className="text-slate-600" />
        <p>No sessions yet — start solving problems to build your profile</p>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Session list */}
      <div className="w-72 flex-shrink-0 space-y-2 overflow-y-auto">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Recent Sessions
        </h2>
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => handleSelectSession(session.id)}
            className={`w-full text-left rounded-xl px-4 py-3 border transition-colors ${
              selectedSessionId === session.id
                ? "bg-slate-700 border-blue-500"
                : "bg-slate-800 border-slate-700 hover:bg-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium truncate">
                {session.problem_title}
              </span>
              {session.solved ? (
                <CheckCircle
                  size={14}
                  className="text-green-400 flex-shrink-0"
                />
              ) : (
                <XCircle size={14} className="text-red-400 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span
                className={`text-xs ${DIFFICULTY_COLORS[session.problem_difficulty as keyof typeof DIFFICULTY_COLORS] ?? "text-slate-400"}`}
              >
                {session.problem_difficulty}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock size={10} />
                {new Date(session.started_at).toLocaleDateString()}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Insights panel */}
      <div className="flex-1 overflow-y-auto">
        {insightsLoading && (
          <div className="flex items-center justify-center h-64 text-slate-400">
            Analyzing session...
          </div>
        )}

        {!insightsLoading && !selectedInsights && !selectedSessionId && (
          <div className="flex items-center justify-center h-64 text-slate-400">
            Select a session to see your insights
          </div>
        )}

        {!insightsLoading && !selectedInsights && selectedSessionId && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
            <AlertCircle size={32} className="text-slate-600" />
            <p>No insights for this session yet</p>
            <p className="text-xs">End the session to trigger analysis</p>
          </div>
        )}

        {!insightsLoading && selectedInsights && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <p className="text-sm text-slate-300 leading-relaxed">
                {selectedInsights.summary}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Communication</span>
                  <span className="text-sm font-semibold text-blue-400">
                    {selectedInsights.comm_score}/10
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Confidence</span>
                  <span className="text-sm font-semibold text-purple-400 capitalize">
                    {selectedInsights.confidence}
                  </span>
                </div>
              </div>
            </div>

            {/* Strengths */}
            {selectedInsights.strengths.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-green-400 flex items-center gap-2 mb-3">
                  <TrendingUp size={16} /> Strengths
                </h3>
                <ul className="space-y-2">
                  {selectedInsights.strengths.map((s, i) => (
                    <li
                      key={i}
                      className="text-sm text-slate-300 flex items-start gap-2"
                    >
                      <span className="text-green-400 mt-0.5">✓</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {selectedInsights.weaknesses.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-yellow-400 flex items-center gap-2 mb-3">
                  <TrendingDown size={16} /> Areas to Improve
                </h3>
                <ul className="space-y-2">
                  {selectedInsights.weaknesses.map((w, i) => (
                    <li
                      key={i}
                      className="text-sm text-slate-300 flex items-start gap-2"
                    >
                      <span className="text-yellow-400 mt-0.5">→</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mistakes */}
            {selectedInsights.mistakes.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-3">
                  <AlertCircle size={16} /> Mistakes This Session
                </h3>
                <ul className="space-y-2">
                  {selectedInsights.mistakes.map((m, i) => (
                    <li
                      key={i}
                      className="text-sm text-slate-300 flex items-start gap-2"
                    >
                      <span className="text-red-400 mt-0.5">✗</span> {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
