export const DEFAULT_SETTINGS = Object.freeze({
  provider: "openai",
  apiKey: "",
  model: "gpt-4.1-mini",
  customEndpoint: "",
  customPrompt: "",
  language: "Indonesian",
  contextLength: 12000,
  floatingButton: true,
  screenshotFallback: true,
  theme: "system"
});

export async function getSettings() {
  const { settings = {} } = await chrome.storage.local.get("settings");
  return { ...DEFAULT_SETTINGS, ...settings };
}

export async function saveSettings(patch) {
  const settings = { ...(await getSettings()), ...patch };
  await chrome.storage.local.set({ settings });
  return settings;
}

export async function addHistory(item) {
  const { history = [] } = await chrome.storage.local.get("history");
  const next = [item, ...history].slice(0, 25);
  await chrome.storage.local.set({ history: next, lastResult: item });
}

export async function clearHistory() {
  await chrome.storage.local.remove(["history", "lastResult"]);
}
