// Popup script for TabZen
let themeInitialized = false;
import { getSettings, saveSettings } from "./utils/settings.js";

// Error boundary setup
window.onerror = (message, source, lineno, colno, error) => {
  showError(`Script error: ${message}`);
  return true;
};

// Chrome API mock for development
if (typeof chrome === "undefined") {
  globalThis.chrome = {
    tabs: {
      query: () => Promise.resolve([]),
      remove: () => {},
      ungroup: () => {},
      group: () => Promise.resolve(1),
      group: () => Promise.resolve(1),
    },
    tabGroups: {
      query: () => Promise.resolve([]),
      update: () => Promise.resolve(),
      TAB_GROUP_ID_NONE: -1
    },
    runtime: {
      sendMessage: () => {},
      openOptionsPage: () => {},
      lastError: null
    },
    storage: {
      local: {
        get: () => {},
        set: () => {},
      },
      sync: {
        get: () => {},
        set: () => {},
      },
    },
  };
}

// DOM elements
const htmlEl = document.documentElement;
const themeIcon = document.getElementById("theme-icon");
const searchInput = document.getElementById("searchInput");
const tabsList = document.getElementById("tabsList");
const groupsList = document.getElementById("groupsList");
const tabCount = document.getElementById("tabCount");
const totalTabsCount = document.getElementById("totalTabsCount");
const inactiveTabsCount = document.getElementById("inactiveTabsCount");
const groupsCount = document.getElementById("groupsCount");
const organizeBtn = document.getElementById("organizeBtn");
const createGroupBtn = document.getElementById("createGroupBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const settingsBtn = document.getElementById("settingsBtn");
const createSelectionGroupBtn = document.getElementById("createSelectionGroupBtn");
const createCustomGroupBtn = document.getElementById("createCustomGroupBtn");
const createGroupModal = document.getElementById("createGroupModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const groupNameInput = document.getElementById("groupName");
const groupColorInput = document.getElementById("groupColor");
const tabSelectionList = document.getElementById("tabSelectionList");
const cancelGroupBtn = document.getElementById("cancelGroupBtn");
const confirmGroupBtn = document.getElementById("confirmGroupBtn");
const renameGroupModal = document.getElementById("renameGroupModal");
const renameGroupNameInput = document.getElementById("renameGroupName");
const renameGroupColorInput = document.getElementById("renameGroupColor");
const cancelRenameBtn = document.getElementById("cancelRenameBtn");
const confirmRenameBtn = document.getElementById("confirmRenameBtn");

// State management
let currentRenameGroupId = null;
let selectedTabIdsFromSelection = [];
const tabCache = new Map();
let searchTimeout;

// Theme initialization
async function initializeTheme() {
  if (themeInitialized) return;
  
  try {
    const settings = await getSettings();
    htmlEl.classList.toggle("dark", settings.darkMode);
    htmlEl.setAttribute("data-theme", settings.darkMode ? "dark" : "light");
    themeIcon.textContent = settings.darkMode ? "🌙" : "☀️";
    themeInitialized = true;
  } catch (error) {
    console.error("Theme initialization failed:", error);
  }
}


chrome.storage.onChanged.addListener((changes) => {
  if (changes.settings) {
    const newSettings = changes.settings.newValue;
    htmlEl.classList.toggle("dark", newSettings.darkMode);
    htmlEl.setAttribute("data-theme", newSettings.darkMode ? "dark" : "light");
    themeIcon.textContent = newSettings.darkMode ? "🌙" : "☀️";
  }
});

// Error message handling
function showError(message) {
  const errorElement = document.getElementById("error-message") || document.createElement("div");
  if (!document.getElementById("error-message")) {
    errorElement.id = "error-message";
    errorElement.className = "error";
    errorElement.style.cssText = "display:none; position:fixed; bottom:20px; left:50%; transform:translateX(-50%); padding:12px; background:#ef4444; color:white; border-radius:4px; z-index:1000;";
    document.body.appendChild(errorElement);
  }
  
  errorElement.textContent = message;
  errorElement.style.display = "block";
  setTimeout(() => {
    errorElement.style.display = "none";
  }, 3000);
}

// Initialize popup
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await initializeTheme();
    const settings = await getSettings();
    
    if (settings.darkMode) {
      document.body.setAttribute("data-theme", "dark");
    }

    loadTabs();
    loadGroups();
    updateStats();

    // Event listeners
    searchInput.addEventListener("input", handleSearch);
    organizeBtn.addEventListener("click", organizeTabs);
    themeToggleBtn.addEventListener("click", toggleTheme);
    settingsBtn.addEventListener("click", openSettings);
    createSelectionGroupBtn.addEventListener("click", createGroupFromSelection);
    createCustomGroupBtn.addEventListener("click", openCustomGroupModal);
    closeModalBtn.addEventListener("click", closeModal);
    cancelGroupBtn.addEventListener("click", closeModal);
    confirmGroupBtn.addEventListener("click", createCustomGroup);
    cancelRenameBtn.addEventListener("click", closeRenameModal);
    confirmRenameBtn.addEventListener("click", confirmRenameGroup);
  } catch (error) {
    showError("Failed to initialize extension");
  }
});

// Theme toggle handler
async function toggleTheme() {
  try {
    const settings = await getSettings();
    const newDarkMode = !settings.darkMode;
    
    htmlEl.classList.toggle("dark", newDarkMode);
    htmlEl.setAttribute("data-theme", newDarkMode ? "dark" : "light");
    themeIcon.textContent = newDarkMode ? "🌙" : "☀️";
    
    settings.darkMode = newDarkMode;
    await saveSettings(settings);
  } catch (error) {
    console.error("Theme toggle failed:", error);
    showError("Failed to update theme settings");
  }
}

// Load and display tabs with caching
async function loadTabs() {
  tabsList.innerHTML = '<div class="loading">Loading tabs...</div>';
  tabCache.clear();

  try {
    const tabs = await chrome.tabs.query({});
    const tabActivity = await getTabActivity();
    const now = Date.now();

    if (tabs.length === 0) {
      tabsList.innerHTML = '<div class="empty-state">No tabs found</div>';
      return;
    }

    tabsList.innerHTML = "";
    tabCount.textContent = tabs.length;

    tabs.sort((a, b) => {
      const aActivity = tabActivity[a.id] || 0;
      const bActivity = tabActivity[b.id] || 0;
      return bActivity - aActivity;
    });

    for (const tab of tabs) {
      if (tabCache.has(tab.id)) {
        tabsList.appendChild(tabCache.get(tab.id));
        continue;
      }

      const tabElement = document.createElement("div");
      tabElement.className = "tab-item";
      tabElement.dataset.tabId = tab.id;
      tabElement.dataset.windowId = tab.windowId;

      const lastActive = tabActivity[tab.id] || 0;
      const minutesInactive = Math.floor((now - lastActive) / (60 * 1000));

      const category = await new Promise((resolve) => {
        chrome.storage.local.get(`tab_${tab.id}_category`, (result) => {
          resolve(result[`tab_${tab.id}_category`] || "other");
        });
      });

      tabElement.innerHTML = `
        <img class="tab-favicon" src="${tab.favIconUrl || "icons/default-favicon.png"}" alt="">
        <div class="tab-info">
          <div class="tab-title">
            <span class="category-indicator ${category}"></span>
            ${tab.title}
          </div>
          <div class="tab-url">${tab.url}</div>
          ${minutesInactive > 5 ? `<div class="tab-inactive">Inactive for ${minutesInactive}m</div>` : ""}
        </div>
        <div class="tab-actions">
          <button class="small-btn close-tab" title="Close Tab">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      `;

      tabElement.addEventListener("click", (e) => {
        if (!e.target.closest(".close-tab")) {
          activateTab(tab.id, tab.windowId);
        }
      });

      const closeBtn = tabElement.querySelector(".close-tab");
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeTab(tab.id);
      });

      tabCache.set(tab.id, tabElement);
      tabsList.appendChild(tabElement);
    }
  } catch (error) {
    console.error("Error loading tabs:", error);
    tabsList.innerHTML = '<div class="error">Failed to load tabs</div>';
  }
}

// Debounced search implementation
function handleSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(performSearch, 300);
}

function performSearch() {
  const query = searchInput.value.toLowerCase();
  const tabItems = tabsList.querySelectorAll(".tab-item");

  tabItems.forEach((item) => {
    const title = item.querySelector(".tab-title").textContent.toLowerCase();
    const url = item.querySelector(".tab-url").textContent.toLowerCase();
    item.style.display = title.includes(query) || url.includes(query) ? "" : "none";
  });
}

// Load and display tab groups
async function loadGroups() {
  groupsList.innerHTML = '<div class="loading">Loading groups...</div>';

  try {
    const tabs = await chrome.tabs.query({});
    const groups = {};

    // Collect tabs by group
    for (const tab of tabs) {
      if (tab.groupId && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
        if (!groups[tab.groupId]) {
          groups[tab.groupId] = {
            id: tab.groupId,
            tabs: [],
          };
        }
        groups[tab.groupId].tabs.push(tab);
      }
    }

    // Get group details
    const groupIds = Object.keys(groups);
    if (groupIds.length === 0) {
      groupsList.innerHTML = '<div class="empty-state">No tab groups</div>';
      return;
    }

    const tabGroups = await chrome.tabGroups.query({});
    groupsList.innerHTML = "";

    for (const group of tabGroups) {
      if (groups[group.id]) {
        const groupElement = document.createElement("div");
        groupElement.className = "group-item";
        groupElement.dataset.groupId = group.id;

        groupElement.innerHTML = `
          <div class="group-color" style="background-color: ${group.color}"></div>
          <div class="group-info">
            <div class="group-title">${group.title || "Unnamed Group"}</div>
            <div class="group-tabs-count">${groups[group.id].tabs.length} tabs</div>
          </div>
          <div class="group-actions">
            <button class="small-btn rename-group" title="Rename Group">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </button>
            <button class="small-btn expand-group" title="Expand Group">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            <button class="small-btn ungroup-tabs" title="Ungroup Tabs">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
            </button>
          </div>
        `;

        const renameBtn = groupElement.querySelector(".rename-group");
        renameBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          openRenameGroupModal(group.id, group.title, group.color);
        });

        const expandBtn = groupElement.querySelector(".expand-group");
        expandBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleGroupExpansion(groupElement, groups[group.id].tabs);
        });

        const ungroupBtn = groupElement.querySelector(".ungroup-tabs");
        ungroupBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          ungroupTabs(group.id);
        });

        groupsList.appendChild(groupElement);
      }
    }
  } catch (error) {
    console.error("Error loading groups:", error);
    groupsList.innerHTML = '<div class="error">Failed to load groups</div>';
  }
}

// Open rename group modal
function openRenameGroupModal(groupId, currentName, currentColor) {
  currentRenameGroupId = groupId;
  renameGroupNameInput.value = currentName || "";
  renameGroupColorInput.value = currentColor || "blue";
  renameGroupModal.style.display = "block";
}

// Close rename modal
function closeRenameModal() {
  renameGroupModal.style.display = "none";
  currentRenameGroupId = null;
}

// Confirm group rename
async function confirmRenameGroup() {
  if (!currentRenameGroupId) return;

  const newName = renameGroupNameInput.value.trim();
  const newColor = renameGroupColorInput.value;

  if (!newName) {
    showError("Please enter a group name");
    return;
  }

  try {
    await chrome.tabGroups.update(currentRenameGroupId, {
      title: newName,
      color: newColor,
    });

    await updateCustomGroupName(newName, newColor);
    closeRenameModal();
    loadGroups();
  } catch (error) {
    console.error("Error renaming group:", error);
    showError("Failed to rename group");
  }
}

// Update custom group name in settings
async function updateCustomGroupName(newName, newColor) {
  try {
    const settings = await getSettings();
    const customGroups = settings.customGroups || [];
    const existingIndex = customGroups.findIndex((g) => g.name === newName);

    if (existingIndex >= 0) {
      customGroups[existingIndex].color = newColor;
    } else {
      customGroups.push({ name: newName, color: newColor });
    }

    settings.customGroups = customGroups;
    await saveSettings(settings);
  } catch (error) {
    console.error("Error updating custom group:", error);
  }
}

// Toggle group expansion to show tabs
function toggleGroupExpansion(groupElement, tabs) {
  const expanded = groupElement.classList.toggle("expanded");
  const existingTabsList = groupElement.querySelector(".group-tabs-list");

  if (expanded) {
    if (!existingTabsList) {
      const tabsList = document.createElement("div");
      tabsList.className = "group-tabs-list";

      for (const tab of tabs) {
        const tabElement = document.createElement("div");
        tabElement.className = "group-tab-item";
        tabElement.dataset.tabId = tab.id;
        tabElement.dataset.windowId = tab.windowId;

        tabElement.innerHTML = `
          <img class="tab-favicon" src="${tab.favIconUrl || "icons/default-favicon.png"}" alt="">
          <div class="tab-title">${tab.title}</div>
        `;

        tabElement.addEventListener("click", () => {
          activateTab(tab.id, tab.windowId);
        });

        tabsList.appendChild(tabElement);
      }

      groupElement.appendChild(tabsList);
    }
  } else if (existingTabsList) {
    groupElement.removeChild(existingTabsList);
  }
}

// Update statistics
async function updateStats() {
  try {
    const tabs = await chrome.tabs.query({});
    const tabGroups = await chrome.tabGroups.query({});
    const tabActivity = await getTabActivity();
    const settings = await getSettings();
    const now = Date.now();
    const inactiveTimeThreshold = settings.inactiveTimeout * 60 * 1000;

    const inactiveTabs = tabs.filter((tab) => {
      const lastActive = tabActivity[tab.id] || 0;
      return now - lastActive > inactiveTimeThreshold;
    });

    totalTabsCount.textContent = tabs.length;
    inactiveTabsCount.textContent = inactiveTabs.length;
    groupsCount.textContent = tabGroups.length;
  } catch (error) {
    console.error("Error updating stats:", error);
  }
}

// Get tab activity data from background script
function getTabActivity() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "getTabActivity" }, (response) => {
      resolve(response?.tabActivity || {});
    });
  });
}

// Activate a tab
function activateTab(tabId, windowId) {
  chrome.runtime.sendMessage({
    action: "activateTab",
    tabId,
    windowId,
  });
  window.close();
}

// Close a tab
function closeTab(tabId) {
  chrome.tabs.remove(tabId, () => {
    const tabElement = document.querySelector(`.tab-item[data-tab-id="${tabId}"]`);
    if (tabElement) {
      tabElement.remove();
    }
    updateStats();
  });
}

//ungroupTabs function
async function ungroupTabs(groupId) {
  try {
    // Get all tabs in the target group
    const tabs = await chrome.tabs.query({ groupId: Number(groupId) });
    if (tabs.length === 0) return;

    // Ungroup all tabs by moving them to default group
    await chrome.tabs.ungroup(tabs.map(tab => tab.id));

    // Remove group from UI
    const groupElement = document.querySelector(`.group-item[data-group-id="${groupId}"]`);
    if (groupElement) groupElement.remove();

    // Refresh groups list and stats
    await loadGroups();
    await updateStats();
  } catch (error) {
    console.error("Error ungrouping tabs:", error);
    showError("Failed to ungroup tabs");
  }
}

// Organize tabs
async function organizeTabs() {
  organizeBtn.textContent = "Organizing...";
  organizeBtn.disabled = true;

  try {
    const tabs = await chrome.tabs.query({ groupId: chrome.tabGroups.TAB_GROUP_ID_NONE });
    if (tabs.length === 0) {
      showError("No ungrouped tabs to organize");
      return;
    }

    const settings = await getSettings();
    const categorizedTabs = await Promise.all(
      tabs.map(async (tab) => {
        const storedCategory = await new Promise((resolve) => {
          chrome.storage.local.get(`tab_${tab.id}_category`, (result) => {
            resolve(result[`tab_${tab.id}_category`]);
          });
        });

        if (storedCategory) return { tab, category: storedCategory };

        const newCategory = await categorizeTab(tab);
        await new Promise((resolve) => {
          chrome.storage.local.set({ [`tab_${tab.id}_category`]: newCategory }, resolve);
        });
        return { tab, category: newCategory };
      })
    );

    const windowCategoryTabs = {};
    categorizedTabs.forEach(({ tab, category }) => {
      const windowId = tab.windowId;
      if (!windowCategoryTabs[windowId]) windowCategoryTabs[windowId] = {};
      if (!windowCategoryTabs[windowId][category]) windowCategoryTabs[windowId][category] = [];
      windowCategoryTabs[windowId][category].push(tab.id);
    });

    const groupPromises = [];
    Object.entries(windowCategoryTabs).forEach(([windowId, categories]) => {
      Object.entries(categories).forEach(([category, tabIds]) => {
        if (tabIds.length > 0) {
          groupPromises.push(
            chrome.tabs.group({ tabIds }).then((groupId) =>
              chrome.tabGroups.update(groupId, {
                title: category.charAt(0).toUpperCase() + category.slice(1),
                color: settings.groupColors[category] || "grey",
              })
            )
          );
        }
      });
    });

    await Promise.all(groupPromises);
    loadTabs();
    loadGroups();
    updateStats();
  } catch (error) {
    console.error("Error organizing tabs:", error);
    showError("Error organizing tabs. Please try again.");
  }

  organizeBtn.textContent = "Organize Tabs";
  organizeBtn.disabled = false;
}

// Create group from selection
async function createGroupFromSelection() {
  try {
    const tabs = await chrome.tabs.query({ highlighted: true, currentWindow: true });
    if (tabs.length < 1) {
      showError("Please select at least one tab to create a group");
      return;
    }

    selectedTabIdsFromSelection = tabs.map((tab) => tab.id);
    groupNameInput.value = "";
    groupColorInput.value = "blue";
    tabSelectionList.style.display = "none";
    createGroupModal.style.display = "block";
  } catch (error) {
    console.error("Error creating group from selection:", error);
    showError("Error creating group. Please try again.");
  }
}

// Open custom group modal
async function openCustomGroupModal() {
  groupNameInput.value = "";
  groupColorInput.value = "blue";
  await loadTabsForSelection();
  tabSelectionList.style.display = "block";
  createGroupModal.style.display = "block";
}

// Close modal
function closeModal() {
  createGroupModal.style.display = "none";
  tabSelectionList.style.display = "block";
  selectedTabIdsFromSelection = [];
}

// Load tabs for selection in modal
async function loadTabsForSelection() {
  tabSelectionList.innerHTML = "";

  try {
    const tabs = await chrome.tabs.query({});

    for (const tab of tabs) {
      const tabElement = document.createElement("div");
      tabElement.className = "tab-checkbox";

      tabElement.innerHTML = `
        <input type="checkbox" id="tab-${tab.id}" data-tab-id="${tab.id}">
        <img src="${tab.favIconUrl || "icons/default-favicon.png"}" alt="">
        <label for="tab-${tab.id}">${tab.title}</label>
      `;

      tabSelectionList.appendChild(tabElement);
    }
  } catch (error) {
    console.error("Error loading tabs for selection:", error);
    tabSelectionList.innerHTML = '<div class="error">Failed to load tabs</div>';
  }
}

// Create custom group
async function createCustomGroup() {
  const groupName = groupNameInput.value.trim();
  const groupColor = groupColorInput.value;

  if (!groupName) {
    showError("Please enter a group name");
    return;
  }

  let selectedTabIds = [];
  if (tabSelectionList.style.display === "none") {
    selectedTabIds = selectedTabIdsFromSelection;
  } else {
    const checkboxes = tabSelectionList.querySelectorAll("input[type='checkbox']:checked");
    if (checkboxes.length === 0) {
      showError("Please select at least one tab");
      return;
    }
    checkboxes.forEach((checkbox) => {
      selectedTabIds.push(parseInt(checkbox.dataset.tabId));
    });
  }

  try {
    const groupId = await chrome.tabs.group({ tabIds: selectedTabIds });
    await chrome.tabGroups.update(groupId, {
      title: groupName,
      color: groupColor,
    });

    await saveCustomGroup(groupName, groupColor);
    closeModal();
    loadGroups();
    updateStats();
  } catch (error) {
    console.error("Error creating custom group:", error);
    showError("Error creating group. Please try again.");
  }
}

// Save custom group to settings
async function saveCustomGroup(name, color) {
  try {
    const settings = await getSettings();
    const customGroups = settings.customGroups || [];
    const existingIndex = customGroups.findIndex((g) => g.name === name);

    if (existingIndex >= 0) {
      customGroups[existingIndex].color = color;
    } else {
      customGroups.push({ name, color });
    }

    settings.customGroups = customGroups;
    await saveSettings(settings);
    return true;
  } catch (error) {
    console.error("Error saving custom group:", error);
    return false;
  }
}

// Open settings page
function openSettings() {
  chrome.runtime.openOptionsPage();
}

// Categorize tab
async function categorizeTab(tab) {
  return new Promise((resolve) => {
    const url = tab.url || "";
    const title = tab.title || "";

    const lowerUrl = url.toLowerCase();
    const lowerTitle = title.toLowerCase();

    // Category keywords
    const categories = {
      work: ["docs", "sheets", "github", "jira", "slack", "gmail", "drive", "outlook", "teams", "zoom", "asana"],
      social: ["facebook", "twitter", "instagram", "linkedin", "whatsapp", "snapchat"],
      shopping: ["amazon", "ebay", "etsy", "walmart", "shop", "cart", "checkout", "sale", "discount"],
      entertainment: ["youtube", "netflix", "spotify", "twitch", "game","movie", "music", "show", "stream"],
      news: ["news", "cnn", "bbc", "article", "blog", "report", "headline", "update"],
      sports: ["sports", "football", "basketball", "soccer", "tennis", "hockey", "baseball"],
      dev: ["stackoverflow", "github", "gitlab", "code", "developer", "vercel", "netlify"],
      finance: ["bank", "finance", "investment", "stock", "crypto"],
      travel: ["booking", "airline", "trip", "travel"],
      health: ["health", "fitness", "wellness", "nutrition", "exercise"],
      education: ["learn", "course", "university", "school", "college", "study"],
      reference: ["wikipedia", "docs", "manual", "tutorial", "guide"],
    };

    // Check each category
    for (const [category, keywords] of Object.entries(categories)) {
      for (const keyword of keywords) {
        if (lowerUrl.includes(keyword) || lowerTitle.includes(keyword)) {
          return resolve(category);
        }
      }
    }

    // Check for domain patterns
    const domainMatch = lowerUrl.match(/^https?:\/\/([^/]+)/);
    if (domainMatch) {
      const domain = domainMatch[1];

      if (domain.includes("mail.") || domain.includes("outlook.")) {
        return resolve("work");
      }

      if (domain.includes("docs.") || domain.includes("sheets.")) {
        return resolve("work");
      }

      if (domain.includes("news.") || domain.endsWith(".news")) {
        return resolve("news");
      }
      
      if (domain.includes("shop.") || domain.endsWith(".shop") || domain.includes("store.")) {
        return resolve("shopping");
      }

      if (domain.includes("play.") || domain.includes("game.") || domain.includes("stream.")) {
        return resolve("entertainment");
      }

      if (domain.includes("dev.") || domain.includes("code.") || domain.endsWith(".dev")) {
        return resolve("dev");
      }
    }

    // Default category
    resolve("other");
  });
}

// Final error boundary
window.addEventListener("error", (event) => {
  showError(`Unhandled error: ${event.message}`);
});