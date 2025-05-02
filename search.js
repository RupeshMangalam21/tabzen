// Search page script for TabZen
import { getSettings } from "./utils/settings.js"

// Declare chrome globally if it's not already defined
if (typeof chrome === "undefined") {
  globalThis.chrome = {
    tabs: {
      query: () => Promise.resolve([]),
    },
    storage: {
      local: {
        get: () => {},
      },
      sync: {
        set: () => {},
      },
    },
    runtime: {
      sendMessage: () => {},
    },
  }
}

// DOM elements
const searchInput = document.getElementById("searchInput")
const searchResults = document.getElementById("searchResults")
const themeToggleBtn = document.getElementById("themeToggleBtn")

// Track selected result
let selectedIndex = -1
let results = []

// Initialize search page
document.addEventListener("DOMContentLoaded", async () => {
  // Load settings and apply theme
  const settings = await getSettings()
  if (settings.darkMode) {
    document.body.setAttribute("data-theme", "dark")
  }

  // Set up event listeners
  searchInput.addEventListener("input", handleSearch)
  searchInput.addEventListener("keydown", handleKeyNavigation)
  themeToggleBtn.addEventListener("click", toggleTheme)

  // Focus search input
  searchInput.focus()
})

// Handle search input
async function handleSearch() {
  const query = searchInput.value.toLowerCase().trim()

  if (!query) {
    searchResults.innerHTML = '<div class="empty-state">Start typing to search tabs</div>'
    results = []
    selectedIndex = -1
    return
  }

  try {
    // Get all tabs
    const tabs = await chrome.tabs.query({})

    // Filter tabs based on query
    results = tabs.filter((tab) => {
      const title = tab.title.toLowerCase()
      const url = tab.url.toLowerCase()
      return title.includes(query) || url.includes(query)
    })

    if (results.length === 0) {
      searchResults.innerHTML = '<div class="empty-state">No matching tabs found</div>'
      selectedIndex = -1
      return
    }

    // Display results
    searchResults.innerHTML = ""

    for (let i = 0; i < results.length; i++) {
      const tab = results[i]

      // Get tab category
      const category = await new Promise((resolve) => {
        chrome.storage.local.get(`tab_${tab.id}_category`, (result) => {
          resolve(result[`tab_${tab.id}_category`] || "other")
        })
      })

      const resultElement = document.createElement("div")
      resultElement.className = "result-item"
      resultElement.dataset.index = i

      resultElement.innerHTML = `
        <img class="result-favicon" src="${tab.favIconUrl || "icons/default-favicon.png"}" alt="">
        <div class="result-info">
          <div class="result-title">
            <span class="category-indicator ${category}"></span>
            ${tab.title}
          </div>
          <div class="result-url">${tab.url}</div>
        </div>
      `

      resultElement.addEventListener("click", () => {
        activateTab(tab.id, tab.windowId)
      })

      searchResults.appendChild(resultElement)
    }

    // Reset selection
    selectedIndex = -1
  } catch (error) {
    console.error("Error searching tabs:", error)
    searchResults.innerHTML = '<div class="empty-state">Error searching tabs</div>'
  }
}

// Handle keyboard navigation
function handleKeyNavigation(e) {
  if (results.length === 0) return

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault()
      selectNextResult()
      break
    case "ArrowUp":
      e.preventDefault()
      selectPreviousResult()
      break
    case "Enter":
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        const tab = results[selectedIndex]
        activateTab(tab.id, tab.windowId)
      }
      break
    case "Escape":
      e.preventDefault()
      window.close()
      break
  }
}

// Select next result
function selectNextResult() {
  // Clear current selection
  const currentSelected = document.querySelector(".result-item.selected")
  if (currentSelected) {
    currentSelected.classList.remove("selected")
  }

  // Select next
  selectedIndex = (selectedIndex + 1) % results.length
  const nextElement = document.querySelector(`.result-item[data-index="${selectedIndex}"]`)
  if (nextElement) {
    nextElement.classList.add("selected")
    nextElement.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }
}

// Select previous result
function selectPreviousResult() {
  // Clear current selection
  const currentSelected = document.querySelector(".result-item.selected")
  if (currentSelected) {
    currentSelected.classList.remove("selected")
  }

  // Select previous
  selectedIndex = selectedIndex <= 0 ? results.length - 1 : selectedIndex - 1
  const prevElement = document.querySelector(`.result-item[data-index="${selectedIndex}"]`)
  if (prevElement) {
    prevElement.classList.add("selected")
    prevElement.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }
}

// Activate a tab
function activateTab(tabId, windowId) {
  chrome.runtime.sendMessage({
    action: "activateTab",
    tabId,
    windowId,
  })
  window.close()
}

// Toggle dark/light theme
async function toggleTheme() {
  const settings = await getSettings()
  settings.darkMode = !settings.darkMode

  if (settings.darkMode) {
    document.body.setAttribute("data-theme", "dark")
  } else {
    document.body.removeAttribute("data-theme")
  }

  chrome.storage.sync.set({ settings })
}
