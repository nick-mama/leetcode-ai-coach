console.log("LeetCode AI Coach content script loaded");

// NeetCode 150 topic map
// Topics are hidden behind a click on NeetCode, so hardcode them
// Key = URL slug, Value = array of topic strings matching LeetCode's naming
const NEETCODE_TOPICS = {
  // Arrays & Hashing
  "contains-duplicate": ["Array", "Hash Table"],
  "valid-anagram": ["Hash Table", "String", "Sorting"],
  "two-integer-sum": ["Array", "Hash Table"],
  "anagram-groups": ["Array", "Hash Table", "String", "Sorting"],
  "top-k-frequent-elements": ["Array", "Hash Table", "Sorting"],
  "string-encode-and-decode": ["Array", "String"],
  "products-of-array-discluding-self": ["Array", "Prefix Sum"],
  "is-anagram": ["Hash Table", "String"],
  "longest-consecutive-sequence": ["Array", "Hash Table"],
  "two-sum": ["Array", "Hash Table"],

  // Two Pointers
  "valid-palindrome": ["Two Pointers", "String"],
  "two-sum-ii": ["Array", "Two Pointers", "Binary Search"],
  "3sum": ["Array", "Two Pointers", "Sorting"],
  "container-with-most-water": ["Array", "Two Pointers", "Greedy"],
  "trapping-rain-water": [
    "Array",
    "Two Pointers",
    "Stack",
    "Dynamic Programming",
  ],

  // Sliding Window
  "best-time-to-buy-and-sell-stock": ["Array", "Dynamic Programming"],
  "longest-substring-without-duplicates": [
    "Hash Table",
    "String",
    "Sliding Window",
  ],
  "longest-repeating-character-replacement": [
    "Hash Table",
    "String",
    "Sliding Window",
  ],
  "minimum-window-substring": ["Hash Table", "String", "Sliding Window"],
  "permutation-string": ["Hash Table", "String", "Sliding Window"],

  // Stack
  "valid-parentheses": ["String", "Stack"],
  "min-stack": ["Stack", "Design"],
  "evaluate-reverse-polish-notation": ["Array", "Math", "Stack"],
  "generate-parentheses": ["String", "Stack", "Backtracking"],
  "daily-temperatures": ["Array", "Stack", "Monotonic Stack"],
  "car-fleet": ["Array", "Stack", "Sorting", "Monotonic Stack"],
  "largest-rectangle-in-histogram": ["Array", "Stack", "Monotonic Stack"],

  // Binary Search
  "binary-search": ["Array", "Binary Search"],
  "search-2d-matrix": ["Array", "Binary Search", "Matrix"],
  "eating-bananas": ["Array", "Binary Search"],
  "find-minimum-in-rotated-sorted-array": ["Array", "Binary Search"],
  "search-in-rotated-sorted-array": ["Array", "Binary Search"],
  "median-of-two-sorted-arrays": [
    "Array",
    "Binary Search",
    "Divide and Conquer",
  ],

  // Linked List
  "linked-list-cycle-detection": ["Hash Table", "Linked List", "Two Pointers"],
  "merge-two-sorted-linked-lists": ["Linked List", "Recursion"],
  "reorder-linked-list": ["Linked List", "Two Pointers"],
  "remove-node-from-end-of-linked-list": ["Linked List", "Two Pointers"],
  "linked-list-cycle": ["Hash Table", "Linked List", "Two Pointers"],
  "lru-cache": ["Hash Table", "Linked List", "Design"],
  "merge-k-sorted-linked-lists": [
    "Linked List",
    "Divide and Conquer",
    "Heap (Priority Queue)",
  ],
  "reverse-a-linked-list": ["Linked List"],
  "reverse-linked-list-ii": ["Linked List"],

  // Trees
  "invert-a-binary-tree": [
    "Tree",
    "Depth-First Search",
    "Breadth-First Search",
  ],
  "maximum-depth-of-binary-tree": [
    "Tree",
    "Depth-First Search",
    "Breadth-First Search",
  ],
  "diameter-of-binary-tree": ["Tree", "Depth-First Search"],
  "balanced-binary-tree": ["Tree", "Depth-First Search"],
  "same-binary-tree": ["Tree", "Depth-First Search", "Breadth-First Search"],
  "subtree-of-a-binary-tree": ["Tree", "Depth-First Search"],
  "lowest-common-ancestor-in-binary-search-tree": [
    "Tree",
    "Depth-First Search",
  ],
  "binary-tree-level-order-traversal": ["Tree", "Breadth-First Search"],
  "binary-tree-right-side-view": [
    "Tree",
    "Depth-First Search",
    "Breadth-First Search",
  ],
  "count-good-nodes-in-binary-tree": [
    "Tree",
    "Depth-First Search",
    "Breadth-First Search",
  ],
  "validate-binary-search-tree": ["Tree", "Depth-First Search"],
  "kth-smallest-integer-in-bst": ["Tree", "Depth-First Search"],
  "construct-binary-tree-from-preorder-and-inorder-traversal": [
    "Array",
    "Hash Table",
    "Divide and Conquer",
    "Tree",
  ],
  "binary-tree-maximum-path-sum": ["Tree", "Depth-First Search"],
  "serialize-and-deserialize-binary-tree": [
    "String",
    "Tree",
    "Depth-First Search",
    "Breadth-First Search",
  ],

  // Tries
  "implement-trie-prefix-tree": ["Hash Table", "String", "Design", "Trie"],
  "design-add-and-search-words-data-structure": [
    "String",
    "Depth-First Search",
    "Design",
    "Trie",
  ],
  "search-for-word": [
    "Array",
    "String",
    "Backtracking",
    "Depth-First Search",
    "Matrix",
  ],

  // Heap / Priority Queue
  "kth-largest-element-in-a-stream": [
    "Tree",
    "Design",
    "Binary Search Tree",
    "Heap (Priority Queue)",
  ],
  "last-stone-weight": ["Array", "Heap (Priority Queue)"],
  "k-closest-points-to-origin": [
    "Array",
    "Math",
    "Divide and Conquer",
    "Sorting",
    "Heap (Priority Queue)",
  ],
  "kth-largest-element-in-an-array": [
    "Array",
    "Divide and Conquer",
    "Sorting",
    "Heap (Priority Queue)",
  ],
  "task-scheduler": [
    "Array",
    "Hash Table",
    "Greedy",
    "Sorting",
    "Heap (Priority Queue)",
  ],
  "twitter-design": [
    "Hash Table",
    "Linked List",
    "Design",
    "Heap (Priority Queue)",
  ],
  "find-median-from-data-stream": [
    "Two Pointers",
    "Design",
    "Sorting",
    "Heap (Priority Queue)",
  ],

  // Backtracking
  subsets: ["Array", "Backtracking"],
  "combination-sum": ["Array", "Backtracking"],
  permutations: ["Array", "Backtracking"],
  "subsets-ii": ["Array", "Backtracking", "Sorting"],
  "combination-sum-ii": ["Array", "Backtracking", "Sorting"],
  "word-search": ["Array", "Backtracking", "Matrix"],
  "palindrome-partitioning": ["String", "Dynamic Programming", "Backtracking"],
  "letter-combinations-phone-number": ["Hash Table", "String", "Backtracking"],
  "n-queens": ["Array", "Backtracking"],

  // Graphs
  "number-of-islands": [
    "Array",
    "Depth-First Search",
    "Breadth-First Search",
    "Union Find",
    "Matrix",
  ],
  "clone-graph": [
    "Hash Table",
    "Depth-First Search",
    "Breadth-First Search",
    "Graph",
  ],
  "max-area-of-island": [
    "Array",
    "Depth-First Search",
    "Breadth-First Search",
    "Union Find",
    "Matrix",
  ],
  "pacific-atlantic-water-flow": [
    "Array",
    "Depth-First Search",
    "Breadth-First Search",
    "Matrix",
  ],
  "surrounded-regions": [
    "Array",
    "Depth-First Search",
    "Breadth-First Search",
    "Union Find",
    "Matrix",
  ],
  "rotting-fruit": ["Array", "Breadth-First Search", "Matrix"],
  "walls-and-gates": ["Array", "Breadth-First Search", "Matrix"],
  "course-schedule": [
    "Depth-First Search",
    "Breadth-First Search",
    "Graph",
    "Topological Sort",
  ],
  "course-schedule-ii": [
    "Depth-First Search",
    "Breadth-First Search",
    "Graph",
    "Topological Sort",
  ],
  "redundant-connection": [
    "Depth-First Search",
    "Breadth-First Search",
    "Union Find",
    "Graph",
  ],
  "number-of-connected-components-in-graph": [
    "Depth-First Search",
    "Breadth-First Search",
    "Union Find",
    "Graph",
  ],
  "graph-valid-tree": [
    "Depth-First Search",
    "Breadth-First Search",
    "Union Find",
    "Graph",
  ],
  "word-ladder": ["Hash Table", "String", "Breadth-First Search"],

  // 1D Dynamic Programming
  "climbing-stairs": ["Math", "Dynamic Programming", "Memoization"],
  "min-cost-climbing-stairs": ["Array", "Dynamic Programming"],
  "house-robber": ["Array", "Dynamic Programming"],
  "house-robber-ii": ["Array", "Dynamic Programming"],
  "longest-palindromic-substring": ["String", "Dynamic Programming"],
  "palindromic-substrings": ["String", "Dynamic Programming"],
  "decode-ways": ["String", "Dynamic Programming"],
  "coin-change": ["Array", "Dynamic Programming", "Breadth-First Search"],
  "maximum-product-subarray": ["Array", "Dynamic Programming"],
  "word-break": [
    "Array",
    "Hash Table",
    "String",
    "Dynamic Programming",
    "Trie",
  ],
  "longest-increasing-subsequence": [
    "Array",
    "Binary Search",
    "Dynamic Programming",
  ],
  "partition-equal-subset-sum": ["Array", "Dynamic Programming"],

  // 2D Dynamic Programming
  "unique-paths": ["Math", "Dynamic Programming", "Combinatorics"],
  "longest-common-subsequence": ["String", "Dynamic Programming"],
  "best-time-to-buy-and-sell-with-cooldown": ["Array", "Dynamic Programming"],
  "coin-change-ii": ["Array", "Dynamic Programming"],
  "target-sum": ["Array", "Dynamic Programming", "Backtracking"],
  "interleaving-strings": ["String", "Dynamic Programming"],
  "edit-distance": ["String", "Dynamic Programming"],
  "burst-balloons": ["Array", "Dynamic Programming"],
  "regular-expression-matching": ["String", "Dynamic Programming", "Recursion"],

  // Greedy
  "maximum-subarray": ["Array", "Divide and Conquer", "Dynamic Programming"],
  "jump-game": ["Array", "Dynamic Programming", "Greedy"],
  "jump-game-ii": ["Array", "Dynamic Programming", "Greedy"],
  "gas-station": ["Array", "Greedy"],
  "hand-of-straights": ["Array", "Hash Table", "Greedy", "Sorting"],
  "merge-triplets-to-form-target": ["Array", "Greedy"],
  "partition-labels": ["Hash Table", "Two Pointers", "String", "Greedy"],
  "valid-parenthesis-string": [
    "String",
    "Dynamic Programming",
    "Stack",
    "Greedy",
  ],

  // Intervals
  "insert-interval": ["Array"],
  "merge-intervals": ["Array", "Sorting"],
  "non-overlapping-intervals": [
    "Array",
    "Dynamic Programming",
    "Greedy",
    "Sorting",
  ],
  "meeting-rooms": ["Array", "Sorting"],
  "meeting-rooms-ii": [
    "Array",
    "Two Pointers",
    "Greedy",
    "Sorting",
    "Heap (Priority Queue)",
  ],
  "minimum-interval-to-include-each-query": [
    "Array",
    "Binary Search",
    "Sorting",
    "Heap (Priority Queue)",
  ],

  // Math & Geometry
  "rotate-image": ["Array", "Math", "Matrix"],
  "spiral-matrix": ["Array", "Matrix", "Simulation"],
  "set-matrix-zeroes": ["Array", "Hash Table", "Matrix"],
  "happy-number": ["Hash Table", "Math", "Two Pointers"],
  "plus-one": ["Array", "Math"],
  "pow-x-n": ["Math", "Recursion"],
  "multiply-strings": ["Math", "String", "Simulation"],
  "detect-squares": ["Array", "Hash Table", "Design", "Counting"],

  // Bit Manipulation
  "single-number": ["Array", "Bit Manipulation"],
  "number-of-1-bits": ["Divide and Conquer", "Bit Manipulation"],
  "count-bits": ["Dynamic Programming", "Bit Manipulation"],
  "reverse-bits": ["Divide and Conquer", "Bit Manipulation"],
  "missing-number": [
    "Array",
    "Hash Table",
    "Math",
    "Binary Search",
    "Bit Manipulation",
  ],
  "sum-of-two-integers": ["Math", "Bit Manipulation"],
  "reverse-integer": ["Math"],
};

// Helpers

function slugToTitle(slug) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Reads topic tags from LeetCode's __NEXT_DATA__ JSON blob
// More reliable than DOM scraping, never affected by CSS class changes
function getLeetCodeTopics() {
  try {
    const nextData = document.getElementById("__NEXT_DATA__");
    if (!nextData) return [];
    const json = JSON.parse(nextData.textContent);
    const queries = json?.props?.pageProps?.dehydratedState?.queries;
    if (!Array.isArray(queries)) return [];

    // Search all queries for one that has topicTags
    for (const query of queries) {
      const tags = query?.state?.data?.question?.topicTags;
      if (Array.isArray(tags) && tags.length > 0) {
        return tags.map((t) => t.name).filter(Boolean);
      }
    }
    return [];
  } catch {
    return [];
  }
}

// Main extraction

function extractProblem() {
  const url = window.location.href;
  const isLeetCode = url.includes("leetcode.com");
  const isNeetCode = url.includes("neetcode.io");

  if (!isLeetCode && !isNeetCode) return null;

  const match = window.location.pathname.match(/\/problems\/([^/]+)/);
  if (!match) return null;

  const slug = match[1];
  let title = slugToTitle(slug);
  let difficulty = "Medium";
  let topics = [];

  if (isLeetCode) {
    // Title
    const titleEl =
      document.querySelector('[data-cy="question-title"]') ||
      document.querySelector(".text-title-large") ||
      document.querySelector("h1");
    if (titleEl) {
      title = titleEl.textContent?.trim().replace(/^\d+\.\s*/, "") || title;
    }

    // Difficulty
    const difficultyEl =
      document.querySelector(".text-difficulty-easy") ||
      document.querySelector(".text-difficulty-medium") ||
      document.querySelector(".text-difficulty-hard") ||
      document.querySelector("[diff]");
    if (difficultyEl) {
      const text = difficultyEl.textContent?.trim().toLowerCase();
      if (text?.includes("easy")) difficulty = "Easy";
      else if (text?.includes("hard")) difficulty = "Hard";
    }

    // Topics, read from JSON, not DOM
    topics = getLeetCodeTopics();
  }

  if (isNeetCode) {
    // Title
    const titleEl =
      document.querySelector("h1") || document.querySelector(".problem-title");
    if (titleEl) {
      title = titleEl.textContent?.trim().replace(/^\d+\.\s*/, "") || title;
    }

    // Difficulty, confirmed selector from DevTools
    const difficultyEl = document.querySelector(
      "span[class*='difficulty-pill']",
    );
    if (difficultyEl) {
      const text = difficultyEl.textContent?.trim().toLowerCase();
      if (text?.includes("easy")) difficulty = "Easy";
      else if (text?.includes("hard")) difficulty = "Hard";
    }

    // Topics, use hardcoded map since they're hidden behind a click
    topics = NEETCODE_TOPICS[slug] || [];
  }

  return { slug, title, difficulty, topics, url };
}

// Messaging

function sendProblemToBackground(problem) {
  chrome.runtime.sendMessage({ type: "PROBLEM_DETECTED", problem });
}

// Navigation tracking
// LeetCode and NeetCode are SPAs, the page doesn't reload on navigation
// We watch for URL changes via MutationObserver on the document title

let lastUrl = window.location.href;
let lastSlug = "";

const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;

    const match = window.location.pathname.match(/\/problems\/([^/]+)/);
    const newSlug = match ? match[1] : "";

    // Only fire if the slug actually changed (not just query params)
    if (newSlug && newSlug !== lastSlug) {
      lastSlug = newSlug;
      // Small delay to let React/Angular finish rendering the new problem
      setTimeout(() => {
        const problem = extractProblem();
        if (problem) sendProblemToBackground(problem);
      }, 1500);
    }
  }
});

observer.observe(document, { subtree: true, childList: true });

// Init

function init() {
  const match = window.location.pathname.match(/\/problems\/([^/]+)/);
  lastSlug = match ? match[1] : "";

  const problem = extractProblem();
  console.log("🔍 Detected problem:", problem);
  if (problem) sendProblemToBackground(problem);
}

init();
