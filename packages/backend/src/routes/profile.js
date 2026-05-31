import express from "express";
import db from "../db/database.js";

const router = express.Router();

const ROADMAP = [
  "arrays-hashing",
  "two-pointers",
  "stack",
  "binary-search",
  "sliding-window",
  "linked-list",
  "trees",
  "tries",
  "heap-priority-queue",
  "backtracking",
  "graphs",
  "1d-dynamic-programming",
  "advanced-graphs",
  "2d-dynamic-programming",
  "intervals",
  "greedy",
  "bit-manipulation",
  "math-geometry",
];

const ROADMAP_LABELS = {
  "arrays-hashing": "Arrays & Hashing",
  "two-pointers": "Two Pointers",
  stack: "Stack",
  "binary-search": "Binary Search",
  "sliding-window": "Sliding Window",
  "linked-list": "Linked List",
  trees: "Trees",
  tries: "Tries",
  "heap-priority-queue": "Heap / Priority Queue",
  backtracking: "Backtracking",
  graphs: "Graphs",
  "1d-dynamic-programming": "1-D DP",
  "advanced-graphs": "Advanced Graphs",
  "2d-dynamic-programming": "2-D DP",
  intervals: "Intervals",
  greedy: "Greedy",
  "bit-manipulation": "Bit Manipulation",
  "math-geometry": "Math & Geometry",
};

router.get("/", (req, res) => {
  // Get all completed sessions with insights and problem data
  const sessions = db
    .prepare(
      `
    SELECT 
      s.id,
      s.solved,
      s.started_at,
      s.status,
      p.title as problem_title,
      p.topics as problem_topics,
      p.difficulty,
      si.strengths,
      si.weaknesses,
      si.mistakes,
      si.comm_score,
      si.confidence,
      (SELECT COUNT(*) FROM turns WHERE session_id = s.id) as turn_count
    FROM sessions s
    JOIN problems p ON p.id = s.problem_id
    LEFT JOIN session_insights si ON si.session_id = s.id
    WHERE s.status = 'completed'
    AND si.id IS NOT NULL
    ORDER BY s.started_at ASC
  `,
    )
    .all();

  // Filter out sessions with no real chat history
  const validSessions = sessions.filter((s) => s.turn_count >= 2);

  // Overview stats
  const totalSessions = validSessions.length;
  const solved = validSessions.filter((s) => s.solved).length;
  const avgCommScore =
    validSessions.length > 0
      ? Math.round(
          (validSessions.reduce((sum, s) => sum + (s.comm_score ?? 0), 0) /
            validSessions.length) *
            10,
        ) / 10
      : 0;

  // Communication score over time for line chart
  const commScoreHistory = validSessions.map((s) => ({
    date: s.started_at,
    score: s.comm_score,
    problem: s.problem_title,
  }));

  // Aggregate weak topics from all sessions
  const topicWeaknessCount = {};
  const skillWeaknessCount = {};

  // Topic keywords to match against
  const topicKeywords = [
    "array",
    "hash",
    "two pointer",
    "stack",
    "queue",
    "binary search",
    "sliding window",
    "linked list",
    "tree",
    "trie",
    "heap",
    "graph",
    "dynamic programming",
    "dp",
    "backtracking",
    "greedy",
    "interval",
    "bit manipulation",
    "math",
    "recursion",
    "sorting",
  ];

  // Skill keywords to match against
  const skillKeywords = [
    "edge case",
    "time complexity",
    "space complexity",
    "complexity",
    "explain",
    "communication",
    "tradeoff",
    "alternative",
    "optimize",
    "base case",
    "overflow",
    "null",
    "empty",
    "duplicate",
    "assumption",
  ];

  validSessions.forEach((s) => {
    const weaknesses = JSON.parse(s.weaknesses ?? "[]");
    weaknesses.forEach((w) => {
      const lower = w.toLowerCase();

      // Check if weakness is topic-related
      topicKeywords.forEach((keyword) => {
        if (lower.includes(keyword)) {
          topicWeaknessCount[keyword] = (topicWeaknessCount[keyword] ?? 0) + 1;
        }
      });

      // Check if weakness is skill-related
      skillKeywords.forEach((keyword) => {
        if (lower.includes(keyword)) {
          skillWeaknessCount[keyword] = (skillWeaknessCount[keyword] ?? 0) + 1;
        }
      });
    });
  });

  // Sort by frequency
  const weakTopics = Object.entries(topicWeaknessCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([topic, count]) => ({ topic, count }));

  const weakSkills = Object.entries(skillWeaknessCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([skill, count]) => ({ skill, count }));

  // Vital to work on
  const vital = [
    ...weakTopics
      .slice(0, 3)
      .map((t) => ({ label: t.topic, count: t.count, type: "topic" })),
    ...weakSkills
      .slice(0, 3)
      .map((s) => ({ label: s.skill, count: s.count, type: "skill" })),
  ]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // NeetCode roadmap progress
  // A category is "practiced" if you have at least one session with that topic
  const practicedTopics = new Set();
  validSessions.forEach((s) => {
    const topics = JSON.parse(s.problem_topics ?? "[]");
    topics.forEach((t) =>
      practicedTopics.add(t.toLowerCase().replace(/\s+/g, "-")),
    );
  });

  const roadmapProgress = ROADMAP.map((category) => ({
    id: category,
    label: ROADMAP_LABELS[category],
    practiced: practicedTopics.has(category),
    solved: validSessions.some((s) => {
      const topics = JSON.parse(s.problem_topics ?? "[]");
      return (
        s.solved &&
        topics.some((t) => t.toLowerCase().replace(/\s+/g, "-") === category)
      );
    }),
  }));

  // Current position = first category not yet practiced
  const currentPosition = roadmapProgress.findIndex((r) => !r.practiced);

  res.json({
    overview: { totalSessions, solved, avgCommScore },
    commScoreHistory,
    weakTopics,
    weakSkills,
    vital,
    roadmapProgress,
    currentPosition,
  });
});

export default router;
