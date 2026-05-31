import { useEffect, useState } from "react";
import {
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

interface Props {
  onResumeSession: (
    sessionId: number,
    problemTitle: string,
    problemDifficulty: string,
  ) => void;
}

export function Dashboard({ onResumeSession }: Props) {
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
    if (selectedSessionId === sessionId) {
      setSelectedSessionId(null);
      setSelectedInsights(null);
      return;
    }
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
      <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
        Loading sessions...
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-slate-400 gap-2 text-sm">
        <p>No sessions yet</p>
        <p className="text-xs">Solve some problems to build your profile</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2 overflow-y-auto">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
        Recent Sessions
      </h2>

      {sessions.map((session) => (
        <div key={session.id}>
          {/* Session row */}
          <button
            onClick={() => handleSelectSession(session.id)}
            className={`w-full text-left rounded-xl px-3 py-2.5 border transition-colors ${
              selectedSessionId === session.id
                ? "bg-slate-700 border-blue-500"
                : "bg-slate-800 border-slate-700 hover:bg-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate">
                {session.problem_title}
              </span>
              <div className="flex items-center gap-2">
                {session.status === "active" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onResumeSession(
                        session.id,
                        session.problem_title,
                        session.problem_difficulty,
                      );
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Resume →
                  </button>
                )}
                {session.solved ? (
                  <CheckCircle
                    size={14}
                    className="text-green-400 flex-shrink-0"
                  />
                ) : (
                  <XCircle size={14} className="text-red-400 flex-shrink-0" />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span
                className={`text-xs ${DIFFICULTY_COLORS[session.problem_difficulty as keyof typeof DIFFICULTY_COLORS] ?? "text-slate-400"}`}
              >
                {session.problem_difficulty}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock size={10} />
                {new Date(session.started_at + "Z").toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}{" "}
              </span>
            </div>
          </button>

          {/* Insights panel — expands inline below the session */}
          {selectedSessionId === session.id && (
            <div className="mt-1 ml-2 space-y-2">
              {insightsLoading && (
                <div className="text-xs text-slate-400 py-2 px-3">
                  Analyzing...
                </div>
              )}

              {!insightsLoading && !selectedInsights && (
                <div className="text-xs text-slate-400 py-2 px-3 flex items-center gap-1">
                  <AlertCircle size={12} />
                  No insights yet — end the session to trigger analysis
                </div>
              )}

              {!insightsLoading && selectedInsights && (
                <div className="space-y-2">
                  {/* Summary */}
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {selectedInsights.summary}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-slate-400">
                        Communication Rating:{" "}
                        <span
                          className={`font-medium ${
                            selectedInsights.comm_score <= 5
                              ? "text-red-400"
                              : selectedInsights.comm_score <= 7
                                ? "text-yellow-400"
                                : "text-green-400"
                          }`}
                        >
                          {selectedInsights.comm_score}/10
                        </span>
                      </span>
                      <span className="text-xs text-slate-400 capitalize">
                        Confidence:{" "}
                        <span className="text-purple-400 font-medium">
                          {selectedInsights.confidence}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Strengths */}
                  {selectedInsights.strengths.length > 0 && (
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
                      <h3 className="text-xs font-semibold text-green-400 flex items-center gap-1 mb-2">
                        <TrendingUp size={12} /> Strengths
                      </h3>
                      <ul className="space-y-1">
                        {selectedInsights.strengths.map((s, i) => (
                          <li
                            key={i}
                            className="text-xs text-slate-300 flex items-start gap-1.5"
                          >
                            <span className="text-green-400 mt-0.5">✓</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {selectedInsights.weaknesses.length > 0 && (
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
                      <h3 className="text-xs font-semibold text-yellow-400 flex items-center gap-1 mb-2">
                        <TrendingDown size={12} /> Areas to Improve
                      </h3>
                      <ul className="space-y-1">
                        {selectedInsights.weaknesses.map((w, i) => (
                          <li
                            key={i}
                            className="text-xs text-slate-300 flex items-start gap-1.5"
                          >
                            <span className="text-yellow-400 mt-0.5">→</span>{" "}
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Mistakes */}
                  {selectedInsights.mistakes.length > 0 && (
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
                      <h3 className="text-xs font-semibold text-red-400 flex items-center gap-1 mb-2">
                        <AlertCircle size={12} /> Mistakes
                      </h3>
                      <ul className="space-y-1">
                        {selectedInsights.mistakes.map((m, i) => (
                          <li
                            key={i}
                            className="text-xs text-slate-300 flex items-start gap-1.5"
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
          )}
        </div>
      ))}
    </div>
  );
}
