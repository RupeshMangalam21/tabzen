// Options page script for TabZen
import { getSettings, saveSettings } from "./utils/settings.js"

// DOM elements
const inactiveTimeoutInput = document.getElementById("inactiveTimeout")
const inactiveTimeoutValue = document.getElementById("inactiveTimeoutValue")
const autoGroupInput = document.getElementById("autoGroup")
const semanticGroupingInput = document.getElementById("semanticGrouping")
const workColorInput = document.getElementById("workColor")
const socialColorInput = document.getElementById("socialColor")
const shoppingColorInput = document.getElementById("shoppingColor")
const entertainmentColorInput = document.getElementById("entertainmentColor")
const newsColorInput = document.getElementById("newsColor")
const otherColorInput = document.getElementById("otherColor")
const customGroupsContainer = document.getElementById("customGroups")
const newGroupNameInput = document.getElementById("newGroupName")
const newGroupColorInput = document.getElementById("newGroupColor")
const addGroupBtn = document.getElementById("addGroupBtn")
const saveBtn = document.getElementById("saveBtn")
const resetBtn = document.getElementById("resetBtn")
const themeToggleBtn = document.getElementById("themeToggleBtn")

// Default settings
const defaultSettings = {
  inactiveTimeout: 30,
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
}

// Initialize options page
document.addEventListener("DOMContentLoaded", async () => {
  // Load current settings
  const settings = await getSettings()

  // Apply settings to form
  inactiveTimeoutInput.value = settings.inactiveTimeout || defaultSettings.inactiveTimeout
  inactiveTimeoutValue.textContent = `${inactiveTimeoutInput.value} minutes`
  autoGroupInput.checked = settings.autoGroup !== undefined ? settings.autoGroup : defaultSettings.autoGroup
  semanticGroupingInput.checked =
    settings.semanticGrouping !== undefined ? settings.semanticGrouping : defaultSettings.semanticGrouping

  // Apply color settings
  const colors = settings.groupColors || defaultSettings.groupColors
  workColorInput.value = colors.work || defaultSettings.groupColors.work
  socialColorInput.value = colors.social || defaultSettings.groupColors.social
  shoppingColorInput.value = colors.shopping || defaultSettings.groupColors.shopping
  entertainmentColorInput.value = colors.entertainment || defaultSettings.groupColors.entertainment
  newsColorInput.value = colors.news || defaultSettings.groupColors.news
  otherColorInput.value = colors.other || defaultSettings.groupColors.other

  // Load custom groups
  loadCustomGroups(settings.customGroups || [])

  // Apply theme
  if (settings.darkMode) {
    document.body.setAttribute("data-theme", "dark")
  }

  // Set up event listeners
  inactiveTimeoutInput.addEventListener("input", updateInactiveTimeoutValue)
  addGroupBtn.addEventListener("click", addCustomGroup)
  saveBtn.addEventListener("click", saveUserSettings)
  resetBtn.addEventListener("click", resetSettings)
  themeToggleBtn.addEventListener("click", toggleTheme)
})

// Update the displayed value for inactive timeout
function updateInactiveTimeoutValue() {
  inactiveTimeoutValue.textContent = `${inactiveTimeoutInput.value} minutes`
}

// Load custom groups
function loadCustomGroups(groups) {
  customGroupsContainer.innerHTML = ""

  if (groups.length === 0) {
    customGroupsContainer.innerHTML = '<div class="empty-state">No custom groups defined</div>'
    return
  }

  groups.forEach((group, index) => {
    const groupElement = document.createElement("div")
    groupElement.className = "custom-group-item"
    groupElement.dataset.index = index.toString()

    groupElement.innerHTML = `
      <div class="group-name-color">
        <div class="group-color-indicator" style="background-color: var(--${group.color}-color, #808080)"></div>
        <span>${group.name}</span>
      </div>
      <button class="delete-group" title="Delete Group">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `

    const deleteBtn = groupElement.querySelector(".delete-group")
    deleteBtn.addEventListener("click", () => {
      deleteCustomGroup(index)
    })

    customGroupsContainer.appendChild(groupElement)
  })
}

// Add a new custom group
async function addCustomGroup() {
  const name = newGroupNameInput.value.trim()
  const color = newGroupColorInput.value

  if (!name) {
    alert("Please enter a group name")
    return
  }

  try {
    const settings = await getSettings()
    const customGroups = settings.customGroups || []

    // Check if group name already exists
    if (customGroups.some((group) => group.name.toLowerCase() === name.toLowerCase())) {
      alert("A group with this name already exists")
      return
    }

    customGroups.push({
      name,
      color,
    })

    // Update settings
    settings.customGroups = customGroups
    await saveSettings(settings)

    // Refresh the list
    loadCustomGroups(customGroups)

    // Clear the input
    newGroupNameInput.value = ""

    // Show success message
    showSuccessMessage("Group added successfully!")
  } catch (error) {
    console.error("Error adding custom group:", error)
    alert("Failed to add group. Please try again.")
  }
}

// Delete a custom group
async function deleteCustomGroup(index) {
  if (!confirm("Are you sure you want to delete this group?")) {
    return
  }

  try {
    const settings = await getSettings()
    const customGroups = settings.customGroups || []

    customGroups.splice(index, 1)

    // Update settings
    settings.customGroups = customGroups
    await saveSettings(settings)

    // Refresh the list
    loadCustomGroups(customGroups)

    // Show success message
    showSuccessMessage("Group deleted successfully!")
  } catch (error) {
    console.error("Error deleting custom group:", error)
    alert("Failed to delete group. Please try again.")
  }
}

// Show success message
function showSuccessMessage(message) {
  const existingMessage = document.querySelector(".save-message")
  if (existingMessage) {
    document.body.removeChild(existingMessage)
  }

  const messageElement = document.createElement("div")
  messageElement.className = "save-message"
  messageElement.textContent = message
  document.body.appendChild(messageElement)

  // Remove message after 3 seconds
  setTimeout(() => {
    if (document.body.contains(messageElement)) {
      document.body.removeChild(messageElement)
    }
  }, 3000)
}

// Save user settings
async function saveUserSettings() {
  try {
    const currentSettings = await getSettings()
    const customGroups = currentSettings.customGroups || []

    const newSettings = {
      ...currentSettings,
      inactiveTimeout: Number.parseInt(inactiveTimeoutInput.value),
      autoGroup: autoGroupInput.checked,
      semanticGrouping: semanticGroupingInput.checked,
      groupColors: {
        work: workColorInput.value,
        social: socialColorInput.value,
        shopping: shoppingColorInput.value,
        entertainment: entertainmentColorInput.value,
        news: newsColorInput.value,
        other: otherColorInput.value,
        dev: currentSettings.groupColors?.dev || "purple",
        reference: currentSettings.groupColors?.reference || "cyan",
      },
      customGroups: customGroups,
    }

    await saveSettings(newSettings)
    showSuccessMessage("Settings saved successfully!")
  } catch (error) {
    console.error("Error saving settings:", error)
    alert("Failed to save settings. Please try again.")
  }
}

// Reset settings to defaults
function resetSettings() {
  if (confirm("Are you sure you want to reset all settings to defaults?")) {
    inactiveTimeoutInput.value = defaultSettings.inactiveTimeout.toString()
    inactiveTimeoutValue.textContent = `${defaultSettings.inactiveTimeout} minutes`
    autoGroupInput.checked = defaultSettings.autoGroup
    semanticGroupingInput.checked = defaultSettings.semanticGrouping

    workColorInput.value = defaultSettings.groupColors.work
    socialColorInput.value = defaultSettings.groupColors.social
    shoppingColorInput.value = defaultSettings.groupColors.shopping
    entertainmentColorInput.value = defaultSettings.groupColors.entertainment
    newsColorInput.value = defaultSettings.groupColors.news
    otherColorInput.value = defaultSettings.groupColors.other

    // Reset custom groups
    loadCustomGroups([])

    // Save the default settings
    saveUserSettings()
  }
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

  saveSettings(settings)
}
