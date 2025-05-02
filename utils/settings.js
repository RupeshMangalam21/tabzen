const DEFAULT_SETTINGS = {
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
};

function getBrowserAPI() {
  try {
    if (typeof browser !== 'undefined' && browser?.runtime?.id) return browser;
    if (typeof chrome !== 'undefined' && chrome?.runtime?.id) return chrome;
    return null;
  } catch (e) {
    return null;
  }
}

export async function getSettings() {
  const browserAPI = getBrowserAPI();
  return new Promise((resolve) => {
    if (browserAPI?.storage?.sync) {
      browserAPI.storage.sync.get('settings', (result) => {
        resolve({ ...DEFAULT_SETTINGS, ...(result.settings || {}) });
      });
    } else {
      resolve(DEFAULT_SETTINGS);
    }
  });
}

export async function saveSettings(settings) {
  const browserAPI = getBrowserAPI();
  return new Promise((resolve) => {
    if (browserAPI?.storage?.sync) {
      browserAPI.storage.sync.set({ settings }, () => {
        if (browserAPI.runtime.lastError) {
          console.error('Save error:', browserAPI.runtime.lastError);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    } else {
      resolve(false);
    }
  });
}

export async function getSettingsImmediate() {
  const browserAPI = getBrowserAPI();
  return new Promise((resolve) => {
    if (browserAPI?.storage?.sync) {
      browserAPI.storage.sync.get('settings', (result) => {
        resolve({ ...DEFAULT_SETTINGS, ...(result.settings || {}) });
      });
    } else {
      resolve(DEFAULT_SETTINGS);
    }
  });
}