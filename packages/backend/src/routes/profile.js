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

// Maps common topic strings from sessions to roadmap category IDs
const TOPIC_MAP = {
  // Arrays & Hashing
  array: "arrays-hashing",
  arrays: "arrays-hashing",
  hashing: "arrays-hashing",
  hashmap: "arrays-hashing",
  "hash map": "arrays-hashing",
  "hash table": "arrays-hashing",
  string: "arrays-hashing",
  sorting: "arrays-hashing",

  // Two Pointers
  "two pointer": "two-pointers",
  "two pointers": "two-pointers",

  // Stack
  stack: "stack",
  "monotonic stack": "stack",

  // Binary Search
  "binary search": "binary-search",

  // Sliding Window
  "sliding window": "sliding-window",

  // Linked List
  "linked list": "linked-list",
  recursion: "linked-list",

  // Trees
  tree: "trees",
  trees: "trees",
  bst: "trees",
  "binary tree": "trees",
  "binary search tree": "trees",

  // Tries
  trie: "tries",
  tries: "tries",

  // Heap
  heap: "heap-priority-queue",
  "priority queue": "heap-priority-queue",
  "heap (priority queue)": "heap-priority-queue",

  // Backtracking
  backtracking: "backtracking",

  // Graphs
  graph: "graphs",
  graphs: "graphs",
  bfs: "graphs",
  dfs: "graphs",
  "breadth-first search": "graphs",
  "depth-first search": "graphs",
  "union find": "graphs",
  "topological sort": "graphs",

  // Dynamic Programming
  "dynamic programming": "1d-dynamic-programming",
  dp: "1d-dynamic-programming",
  "1d dp": "1d-dynamic-programming",
  memoization: "1d-dynamic-programming",
  "2d dp": "2d-dynamic-programming",

  // Advanced Graphs
  "advanced graphs": "advanced-graphs",

  // Intervals
  intervals: "intervals",

  // Greedy
  greedy: "greedy",

  // Bit Manipulation
  "bit manipulation": "bit-manipulation",

  // Math & Geometry
  math: "math-geometry",
  geometry: "math-geometry",
  matrix: "math-geometry",
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
  // Build per-category stats
  const categoryStats = {};

  validSessions.forEach((s) => {
    const topics = JSON.parse(s.problem_topics ?? "[]");
    const mappedCategories = new Set();

    topics.forEach((t) => {
      const normalized = t.toLowerCase().trim();
      const mapped = TOPIC_MAP[normalized];
      if (!mapped) return;
      mappedCategories.add(mapped);
    });

    // Push session once per category, not once per topic
    mappedCategories.forEach((category) => {
      if (!categoryStats[category]) {
        categoryStats[category] = { sessions: [], solvedSessions: [] };
      }
      categoryStats[category].sessions.push(s);
      if (s.solved) {
        categoryStats[category].solvedSessions.push(s);
      }
    });
  });

  validSessions.forEach((s) => {
    const topics = JSON.parse(s.problem_topics ?? "[]");
    console.log("Session topics raw:", topics);
    topics.forEach((t) => {
      const normalized = t.toLowerCase().trim();
      const mapped = TOPIC_MAP[normalized];
      console.log(`  "${normalized}" → ${mapped ?? "NO MATCH"}`);
    });
  });

  // Determine mastery for each category
  function isMastered(stats) {
    if (!stats) return false;
    const solved = stats.solvedSessions;

    const mediumSolved = solved.filter(
      (s) => s.difficulty === "Medium" && (s.comm_score ?? 0) >= 8,
    );
    const hardSolved = solved.filter(
      (s) => s.difficulty === "Hard" && (s.comm_score ?? 0) >= 8,
    );

    // Mastered if: 2+ medium solved with 8+ comm, OR 1+ hard solved with 8+ comm
    return mediumSolved.length >= 2 || hardSolved.length >= 1;
  }

  const roadmapProgress = ROADMAP.map((category) => {
    const stats = categoryStats[category];
    const practiced = stats?.sessions.length > 0;
    const mastered = isMastered(stats);
    const mediumSolved =
      stats?.solvedSessions.filter(
        (s) => s.difficulty === "Medium" && (s.comm_score ?? 0) >= 8,
      ).length ?? 0;
    const hardSolved =
      stats?.solvedSessions.filter(
        (s) => s.difficulty === "Hard" && (s.comm_score ?? 0) >= 8,
      ).length ?? 0;
    const solvedCount = mediumSolved;
    const hardCount = hardSolved;

    const medHardSolved =
      stats?.solvedSessions.filter(
        (s) => s.difficulty === "Medium" || s.difficulty === "Hard",
      ) ?? [];

    const avgScore =
      medHardSolved.length > 0
        ? Math.round(
            (medHardSolved.reduce((sum, s) => sum + (s.comm_score ?? 0), 0) /
              medHardSolved.length) *
              10,
          ) / 10
        : null;

    return {
      id: category,
      label: ROADMAP_LABELS[category],
      practiced,
      mastered,
      solvedCount,
      hardCount,
      avgScore,
    };
  });

  // Current position = first category not yet mastered
  const currentPosition = roadmapProgress.findIndex((r) => !r.mastered);

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
