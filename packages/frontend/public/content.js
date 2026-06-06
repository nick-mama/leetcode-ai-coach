console.log("LeetCode AI Coach content script loaded");

// Helpers

function slugToTitle(slug) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Reads topic tags from LeetCode's __NEXT_DATA__ JSON blob.
// More reliable than DOM scraping, never affected by CSS class changes.
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

// Polls the DOM until the selector resolves or we hit the timeout.
// Needed because NeetCode is Angular, it renders topics asynchronously.
// Poll for an element every 200ms until it appears or we timeout
function waitForElement(selector, timeout = 8000) {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const els = document.querySelectorAll(selector);
      if (els.length > 0) {
        clearInterval(interval);
        clearTimeout(timer);
        resolve(els);
      }
    }, 200);

    const timer = setTimeout(() => {
      clearInterval(interval);
      resolve(null);
    }, timeout);
  });
}
// Main extraction

async function extractProblem() {
  const url = window.location.href;
  const isLeetCode = url.includes("leetcode.com");
  const isNeetCode = url.includes("neetcode.io");

  console.log("extractProblem called:", { url, isLeetCode, isNeetCode });

  if (!isLeetCode && !isNeetCode) return null;

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
      title = titleEl.textContent?.trim().replace(/^\d+\.\s*/, "") || title;
    }

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

    // Read topics from JSON blob, not DOM scraping
    topics = getLeetCodeTopics();
  }

  if (isNeetCode) {
    const titleEl =
      document.querySelector("h1") || document.querySelector(".problem-title");
    if (titleEl) {
      title = titleEl.textContent?.trim().replace(/^\d+\.\s*/, "") || title;
    }

    const difficultyEl = document.querySelector(
      "span[class*='difficulty-pill']",
    );
    if (difficultyEl) {
      const text = difficultyEl.textContent?.trim().toLowerCase();
      if (text?.includes("easy")) difficulty = "Easy";
      else if (text?.includes("hard")) difficulty = "Hard";
    }

    // Poll every 200ms until topic elements appear or 8s timeout
    const topicEls = await waitForElement("a.company-tag-reveal-btn");
    console.log("topicEls result:", topicEls);
    if (topicEls) {
      topics = Array.from(topicEls)
        .map((el) => el.textContent?.trim())
        .filter(Boolean);
    }
    console.log("Scraped topics:", topics);
  }

  return { slug, title, difficulty, topics, url };
}

// Messaging

function sendProblemToBackground(problem) {
  chrome.runtime.sendMessage({ type: "PROBLEM_DETECTED", problem });
}

// Navigation tracking
// LeetCode and NeetCode are SPAs, the page doesn't reload on navigation.
// We watch for URL changes via MutationObserver on the document title.

let lastUrl = window.location.href;
let lastSlug = "";

const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;

    const match = window.location.pathname.match(/\/problems\/([^/]+)/);
    const newSlug = match ? match[1] : "";

    // Only fire if the slug actually changed, not just query params changing
    if (newSlug && newSlug !== lastSlug) {
      lastSlug = newSlug;
      // Delay to let Angular finish rendering the new problem page
      setTimeout(async () => {
        const problem = await extractProblem();
        if (problem) sendProblemToBackground(problem);
      }, 1500);
    }
  }
});

observer.observe(document, { subtree: true, childList: true });

// Init
// We wait for the page to be fully loaded before extracting.
// NeetCode renders topics asynchronously so we can't scrape immediately.

async function init() {
  const match = window.location.pathname.match(/\/problems\/([^/]+)/);
  lastSlug = match ? match[1] : "";

  // NeetCode renders asynchronously via Angular, give it time before extracting
  const isNeetCode = window.location.href.includes("neetcode.io");
  if (isNeetCode) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  const problem = await extractProblem();
  console.log("Detected problem:", problem);
  if (problem) sendProblemToBackground(problem);
}

init();
