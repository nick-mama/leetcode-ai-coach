chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PROBLEM_DETECTED") {
    // Just save to storage — nothing else
    chrome.storage.local.set({ detectedProblem: message.problem }, () => {
      console.log("Saved problem to storage:", message.problem);
      sendResponse({ success: true });
    });
    return true; // keep channel open for async response
  }

  if (message.type === "GET_CURRENT_PROBLEM") {
    chrome.storage.local.get("detectedProblem", (result) => {
      console.log("GET_CURRENT_PROBLEM result:", result);
      sendResponse({ problem: result.detectedProblem ?? null });
    });
    return true;
  }
});
