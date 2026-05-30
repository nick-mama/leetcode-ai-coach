// Content script runs directly on leetcode.com and neetcode.io
// It reads the URL and DOM to extract the problem details
// Then sends that data to the background service worker
console.log("🧠 LeetCode AI Coach content script loaded");
// Debug: log what we detect
const debugProblem = extractProblem();
console.log("🔍 Detected problem:", debugProblem);

// Debug: log when we send the message
chrome.runtime.sendMessage(
  { type: "PROBLEM_DETECTED", problem: debugProblem },
  (response) => {
    console.log("📨 Message sent, response:", response);
  },
);

function extractProblem() {
  const url = window.location.href;
  const isLeetCode = url.includes("leetcode.com");
  const isNeetCode = url.includes("neetcode.io");

  if (!isLeetCode && !isNeetCode) return null;

  // Extract slug from URL
  // leetcode.com/problems/two-sum/ → "two-sum"
  // neetcode.io/problems/two-integer-sum/question → "two-integer-sum"
  const match = window.location.pathname.match(/\/problems\/([^/]+)/);
  if (!match) return null;

  const slug = match[1];

  let title = slugToTitle(slug);
  let difficulty = "Medium";
  let topics = [];

  if (isLeetCode) {
    const titleEl =
      document.querySelector('[data-cy="question-title"]') ||
      document.querySelector(".text-title-large") ||
      document.querySelector("h1");
    if (titleEl) {
      const rawTitle = titleEl.textContent?.trim() || title;
      title = rawTitle.replace(/^\d+\.\s*/, "");
    }
    const difficultyEl =
      document.querySelector("[diff]") ||
      document.querySelector(".text-difficulty-easy") ||
      document.querySelector(".text-difficulty-medium") ||
      document.querySelector(".text-difficulty-hard");

    if (difficultyEl) {
      const text = difficultyEl.textContent?.trim().toLowerCase();
      if (text?.includes("easy")) difficulty = "Easy";
      else if (text?.includes("hard")) difficulty = "Hard";
    }

    const tagEls = document.querySelectorAll('[class*="topic-tag"]');
    topics = Array.from(tagEls)
      .map((el) => el.textContent?.trim())
      .filter(Boolean);
  }

  if (isNeetCode) {
    // NeetCode puts the title in the h1 inside the problem panel
    const titleEl =
      document.querySelector("h1") || document.querySelector(".problem-title");
    if (titleEl) {
      const rawTitle = titleEl.textContent?.trim() || title;
      title = rawTitle.replace(/^\d+\.\s*/, "");
    }
    // NeetCode shows difficulty as a badge
    const difficultyEl =
      document.querySelector(".difficulty") ||
      document.querySelector('[class*="difficulty"]');

    if (difficultyEl) {
      const text = difficultyEl.textContent?.trim().toLowerCase();
      if (text?.includes("easy")) difficulty = "Easy";
      else if (text?.includes("hard")) difficulty = "Hard";
    }
  }

  return { slug, title, difficulty, topics, url: window.location.href };
}

// Convert "two-sum" → "Two Sum" as a fallback if DOM scraping fails
function slugToTitle(slug) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function sendProblemToBackground(problem) {
  chrome.runtime.sendMessage({
    type: "PROBLEM_DETECTED",
    problem,
  });
}

// Run immediately when the page loads
function init() {
  const problem = extractProblem();
  if (problem) {
    sendProblemToBackground(problem);
  }
}

// Watch for URL changes using a MutationObserver on the document title
// When the title changes, the problem has changed
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    // Wait for the DOM to update before scraping
    setTimeout(() => {
      const problem = extractProblem();
      if (problem) sendProblemToBackground(problem);
    }, 1500);
  }
});

observer.observe(document, { subtree: true, childList: true });

init();
