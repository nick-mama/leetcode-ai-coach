import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  AlertTriangle,
  CheckCircle,
  Circle,
  TrendingUp,
  Brain,
  Target,
} from "lucide-react";
import { getProfile, type ProfileData } from "../lib/api";

interface ScoreDotProps {
  cx?: number;
  cy?: number;
  payload?: { score: number };
  [key: string]: unknown;
}

interface TooltipProps {
  active?: boolean;
  payload?: { payload: { date: string; score: number; problem: string } }[];
}

function ScoreDot({ cx, cy, payload }: ScoreDotProps) {
  if (!cx || !cy || !payload) return null;
  const color =
    payload.score >= 8 ? "#4ade80" : payload.score >= 6 ? "#facc15" : "#f87171";
  return <circle cx={cx} cy={cy} r={5} fill={color} stroke="none" />;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-slate-300 font-medium">{d.problem}</p>
      <p className="text-slate-400">
        {new Date(d.date + "Z").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </p>
      <p className="text-slate-400">
        {new Date(d.date + "Z").toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })}
      </p>
      <p
        className={`font-bold ${d.score >= 8 ? "text-green-400" : d.score >= 6 ? "text-yellow-400" : "text-red-400"}`}
      >
        Score: {d.score}/10
      </p>
    </div>
  );
}

export function Profile() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
        Loading profile...
      </div>
    );
  }

  if (!data || data.overview.totalSessions === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-slate-400 gap-2 text-sm">
        <Brain size={32} className="text-slate-600" />
        <p>No completed sessions yet</p>
        <p className="text-xs">Complete some sessions to build your profile</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4 overflow-y-auto">
      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-white">
            {data.overview.totalSessions}
          </p>
          <p className="text-xs text-slate-400">Sessions</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-green-400">
            {data.overview.solved}
          </p>
          <p className="text-xs text-slate-400">Solved</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 text-center">
          <p
            className={`text-lg font-bold ${
              data.overview.avgCommScore >= 8
                ? "text-green-400"
                : data.overview.avgCommScore >= 6
                  ? "text-yellow-400"
                  : "text-red-400"
            }`}
          >
            {data.overview.avgCommScore}
          </p>
          <p className="text-xs text-slate-400">Avg Comm</p>
        </div>
      </div>

      {/* Vital to Work On */}
      {data.vital.length > 0 && (
        <div className="bg-slate-800 border border-red-900 rounded-xl p-3">
          <h3 className="text-xs font-semibold text-red-400 flex items-center gap-1 mb-2">
            <AlertTriangle size={12} /> Vital to Work On
          </h3>
          <div className="space-y-1.5">
            {data.vital.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs text-slate-300 capitalize">
                  {item.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 capitalize">
                    {item.type}
                  </span>
                  <span className="text-xs bg-red-900 text-red-300 rounded-full px-2 py-0.5">
                    {item.count}x
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Communication Score Chart */}
      {data.commScoreHistory.length > 1 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
          <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-3">
            <TrendingUp size={12} /> Communication Score Over Time
          </h3>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart
              data={data.commScoreHistory}
              margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) =>
                  new Date(d + "Z").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
                tick={{ fontSize: 9, fill: "#94a3b8" }}
                interval="preserveStartEnd"
              />
              <YAxis domain={[0, 10]} tick={{ fontSize: 9, fill: "#94a3b8" }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={8}
                stroke="#4ade80"
                strokeDasharray="3 3"
                strokeOpacity={0.4}
              />
              <ReferenceLine
                y={6}
                stroke="#facc15"
                strokeDasharray="3 3"
                strokeOpacity={0.4}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={<ScoreDot />}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-3 mt-1 justify-end">
            <span className="text-xs text-green-400">● 8+ great</span>
            <span className="text-xs text-yellow-400">● 6+ good</span>
            <span className="text-xs text-red-400">● below 6</span>
          </div>
        </div>
      )}

      {/* Weak Topics */}
      {data.weakTopics.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
          <h3 className="text-xs font-semibold text-yellow-400 flex items-center gap-1 mb-2">
            <Target size={12} /> Weak Topics
          </h3>
          <div className="space-y-1.5">
            {data.weakTopics.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs text-slate-300 capitalize">
                  {item.topic}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{
                        width: `${Math.min((item.count / 10) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{item.count}x</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weak Skills */}
      {data.weakSkills.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
          <h3 className="text-xs font-semibold text-orange-400 flex items-center gap-1 mb-2">
            <Brain size={12} /> Weak Skills
          </h3>
          <div className="space-y-1.5">
            {data.weakSkills.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs text-slate-300 capitalize">
                  {item.skill}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-400 rounded-full"
                      style={{
                        width: `${Math.min((item.count / 10) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{item.count}x</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NeetCode Roadmap Progress */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
        <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-3">
          <Target size={12} /> NeetCode Roadmap
        </h3>
        <div className="space-y-1.5">
          {data.roadmapProgress.map((item, i) => (
            <div
              key={item.id}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${
                i === data.currentPosition
                  ? "bg-blue-900 border border-blue-500"
                  : ""
              }`}
            >
              {item.solved ? (
                <CheckCircle
                  size={12}
                  className="text-green-400 flex-shrink-0"
                />
              ) : item.practiced ? (
                <CheckCircle
                  size={12}
                  className="text-yellow-400 flex-shrink-0"
                />
              ) : (
                <Circle size={12} className="text-slate-600 flex-shrink-0" />
              )}
              <span
                className={`text-xs ${
                  item.solved
                    ? "text-green-400"
                    : item.practiced
                      ? "text-yellow-400"
                      : i === data.currentPosition
                        ? "text-blue-300 font-medium"
                        : "text-slate-500"
                }`}
              >
                {item.label}
              </span>
              {i === data.currentPosition && (
                <span className="text-xs text-blue-400 ml-auto">← current</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
