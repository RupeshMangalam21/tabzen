// Background script for TabZen
import { categorizeTab } from "./utils/categorization.js"
import { getSettings } from "./utils/settings.js"

// Declare chrome variable if it's not already available globally
// This might be necessary in some testing environments
if (typeof chrome === "undefined") {
  global.chrome = {}
}

// Track tab activity
const tabActivity = {}
let inactiveGroupId = null

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log("TabZen installed")

  // Set default settings if not already set
  const settings = await getSettings()
  if (!settings) {
    chrome.storage.sync.set({
      settings: {
        inactiveTimeout: 30, // minutes
        autoGroup: true,
        semanticGrouping: true,
        darkMode: false,
        groupColors: {
          work: "blue",
          social: "pink",
          shopping: "green",
          entertainment: "yellow",
          news: "red",
          other: "grey",
          dev: "purple",
          reference: "cyan",
        },
        customGroups: [],
      },
    })
  }

  // Create alarms for periodic checks
  chrome.alarms.create("checkInactiveTabs", { periodInMinutes: 5 })
})

// Track when tabs are activated
chrome.tabs.onActivated.addListener((activeInfo) => {
  const tabId = activeInfo.tabId
  tabActivity[tabId] = Date.now()
})

// Track when tabs are updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    tabActivity[tabId] = Date.now()

    // Categorize the tab if semantic grouping is enabled
    getSettings().then((settings) => {
      if (settings.semanticGrouping) {
        categorizeTab(tab).then((category) => {
          // Store the category with the tab
          chrome.storage.local.set({ [`tab_${tabId}_category`]: category })
        })
      }
    })
  }
})

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabActivity[tabId]
  chrome.storage.local.remove(`tab_${tabId}_category`)
})

// Check for inactive tabs periodically
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "checkInactiveTabs") {
    await checkInactiveTabs()
  }
})

// Handle keyboard shortcut for tab search
chrome.commands.onCommand.addListener((command) => {
  if (command === "search_tabs") {
    chrome.tabs.create({ url: "search.html" })
  }
})

// Add a new message handler for organizing tabs
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getTabActivity") {
    sendResponse({ tabActivity })
  } else if (request.action === "activateTab") {
    chrome.tabs.update(request.tabId, { active: true })
    chrome.windows.update(request.windowId, { focused: true })
    sendResponse({ success: true })
  } else if (request.action === "groupTabs") {
    chrome.tabs.group({ tabIds: request.tabIds }).then((groupId) => {
      chrome.tabGroups.update(groupId, {
        title: request.title,
        color: request.color,
      })
      sendResponse({ success: true, groupId })
    })
    return true // Keep the message channel open for async response
  } else if (request.action === "organizeTabs") {
    // Trigger the tab organization manually
    checkInactiveTabs().then(() => {
      sendResponse({ success: true })
    })
    return true // Keep the message channel open for async response
  } else if (request.action === "openSearch") {
    chrome.tabs.create({ url: "search.html" })
    sendResponse({ success: true })
  } else if (request.action === "updateTabActivity") {
    const tabId = sender.tab?.id
    if (tabId) {
      tabActivity[tabId] = Date.now()
    }
    sendResponse({ success: true })
  }
})

// Add a function to check inactive tabs manually
async function checkInactiveTabs() {
  try {
    const settings = await getSettings()
    if (!settings.autoGroup) return false

    const inactiveTimeThreshold = settings.inactiveTimeout * 60 * 1000 // Convert minutes to ms
    const now = Date.now()

    // Get all tabs
    const tabs = await chrome.tabs.query({})

    // Process inactive tabs
    const inactiveTabs = tabs.filter((tab) => {
      const lastActive = tabActivity[tab.id] || 0
      return now - lastActive > inactiveTimeThreshold && !tab.groupId
    })

    if (inactiveTabs.length > 0) {
      // Create or get the inactive group
      try {
        const groupId = await chrome.tabs.group({ tabIds: [inactiveTabs[0].id] })
        await chrome.tabGroups.update(groupId, {
          title: "Inactive Tabs",
          color: "grey",
        })
        inactiveGroupId = groupId

        // Add other inactive tabs to the group
        if (inactiveTabs.length > 1) {
          const remainingTabIds = inactiveTabs.slice(1).map((tab) => tab.id)
          await chrome.tabs.group({ tabIds: remainingTabIds, groupId })
        }
      } catch (error) {
        console.error("Error creating inactive group:", error)
      }
    }

    // Process semantic grouping if enabled
    if (settings.semanticGrouping) {
      // Get all ungrouped tabs
      const ungroupedTabs = tabs.filter((tab) => !tab.groupId)

      if (ungroupedTabs.length === 0) return true

      // Categorize tabs
      const categoryTabs = {}

      for (const tab of ungroupedTabs) {
        // Get or determine category
        const category = await new Promise((resolve) => {
          chrome.storage.local.get(`tab_${tab.id}_category`, (result) => {
            if (result[`tab_${tab.id}_category`]) {
              resolve(result[`tab_${tab.id}_category`])
            } else {
              // If no category is stored, categorize it now
              categorizeTab(tab).then((newCategory) => {
                // Store the category
                chrome.storage.local.set({ [`tab_${tab.id}_category`]: newCategory })
                resolve(newCategory)
              })
            }
          })
        })

        // Add tab to its category group
        if (!categoryTabs[category]) {
          categoryTabs[category] = []
        }
        categoryTabs[category].push(tab.id)
      }

      // Create groups for each category with at least 2 tabs
      for (const [category, tabIds] of Object.entries(categoryTabs)) {
        if (tabIds.length >= 2) {
          try {
            const groupId = await chrome.tabs.group({ tabIds })
            await chrome.tabGroups.update(groupId, {
              title: category.charAt(0).toUpperCase() + category.slice(1),
              color: settings.groupColors[category] || "grey",
            })
          } catch (error) {
            console.error(`Error creating group for ${category}:`, error)
          }
        }
      }
    }

    return true
  } catch (error) {
    console.error("Error in checkInactiveTabs:", error)
    return false
  }
}
