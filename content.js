// Content script for TabZen
// This script runs in the context of web pages

// Listen for the keyboard shortcut to search tabs
document.addEventListener("keydown", (e) => {
  // Check if the user pressed Ctrl+Shift+Space (or Cmd+Shift+Space on Mac)
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === "Space") {
    // Send message to background script to open search
    chrome.runtime.sendMessage({ action: "openSearch" })
  }
})

// Update tab activity when the page is interacted with
function updateTabActivity() {
  chrome.runtime.sendMessage({ action: "updateTabActivity" })
}

// Track user interaction with the page
document.addEventListener("click", updateTabActivity)
document.addEventListener("keydown", updateTabActivity)
document.addEventListener("scroll", updateTabActivity)
