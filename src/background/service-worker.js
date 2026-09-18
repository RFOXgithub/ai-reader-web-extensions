import { createProvider } from "../ai/index.js";
import { analyzeSelectedQuestion } from "../ai/analyzer.js";
import { captureRegion, captureVisible } from "../capture/region-capture.js";
import { addHistory, getSettings } from "../utils/storage.js";

const CONTENT_FILES = ["src/content/text-extractor.js", "src/content/question-detector.js", "src/content/selection-overlay.js", "src/content/selection-mode.js", "src/content/content.js"];
const RESTRICTED = /^(chrome|edge|about|devtools|chrome-extension):|chromewebstore\.google\.com|microsoftedge\.microsoft\.com\/addons/i;
const codedError = (code, message, cause) => Object.assign(new Error(message), { code, cause });
const errorResponse = (error) => ({ ok: false, code: error?.code || "AI_REQUEST_FAILED", error: error?.message || "Unable to continue." });

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw codedError("CONTENT_SCRIPT_UNAVAILABLE", "Tidak ada tab aktif.");
  return tab;
}
async function tell(tabId, message, frameId = 0) {
  if (!tabId) return undefined;
  return chrome.tabs.sendMessage(tabId, message, { frameId }).catch(() => undefined);
}
async function fileAccessAllowed() {
  return new Promise((resolve) => chrome.extension.isAllowedFileSchemeAccess(resolve));
}
async function ensureContentScript(tab, frameId = 0) {
  if (String(tab.url || "").startsWith("file:") && !(await fileAccessAllowed())) {
    throw codedError("FILE_ACCESS_DISABLED", "Aktifkan Allow access to file URLs pada pengaturan extension.");
  }
  try {
    const pong = await chrome.tabs.sendMessage(tab.id, { type: "PING" }, { frameId });
    if (pong?.ready) return;
  } catch {}
  try {
    await chrome.scripting.insertCSS({ target: { tabId: tab.id, frameIds: [frameId] }, files: ["src/content/content.css"] });
    await chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [frameId] }, files: CONTENT_FILES });
  } catch (cause) {
    const restricted = RESTRICTED.test(tab.url || "");
    throw codedError(restricted ? "RESTRICTED_BROWSER_PAGE" : "CONTENT_SCRIPT_UNAVAILABLE", restricted ? "Halaman ini membatasi content script oleh kebijakan browser." : "Content script tidak tersedia pada halaman ini.", cause);
  }
}
async function saveAnalysis(tab, settings, context, screenshot) {
  const answer = await analyzeSelectedQuestion(settings, context, screenshot);
  const item = { id: crypto.randomUUID(), answer, title: tab.title || "Selected question", url: tab.url || "", createdAt: Date.now(), mode: context.mode };
  await addHistory(item);
  return item;
}
async function analyzeVisibleFallback(tab, originalError) {
  const settings = await getSettings();
  if (!settings.screenshotFallback) throw originalError;
  let screenshot;
  try { screenshot = await captureVisible(tab, tell); }
  catch (cause) {
    if (originalError?.code === "RESTRICTED_BROWSER_PAGE") throw codedError("RESTRICTED_BROWSER_PAGE", "Halaman ini dibatasi browser; content script dan screenshot tidak diizinkan.", cause);
    throw codedError("SCREENSHOT_CAPTURE_FAILED", "Screenshot capture gagal pada halaman ini.", cause);
  }
  return saveAnalysis(tab, settings, { title: tab.title || "Visible page", url: tab.url || "", content: "", mode: "visible-tab-image", explainMore: false }, screenshot);
}
async function startSelection(frameId = 0) {
  const tab = await activeTab();
  try {
    await ensureContentScript(tab, frameId);
    await chrome.tabs.sendMessage(tab.id, { type: "START_SELECTION" }, { frameId });
    return { mode: "content" };
  } catch (error) {
    if (error?.code === "FILE_ACCESS_DISABLED") throw error;
    return { mode: "screenshot", item: await analyzeVisibleFallback(tab, error) };
  }
}
async function analyzeSelection(payload, sender) {
  if (!payload?.rect || ((!payload.readable || !payload.text) && (payload.rect.width < 40 || payload.rect.height < 20))) throw codedError("NO_CONTENT_DETECTED", "Selection is too small. Please select the complete question.");
  const tab = sender?.tab?.id ? sender.tab : await activeTab();
  const settings = await getSettings();
  const useImage = !payload.readable || payload.hasVisual;
  let screenshot = null;
  if (useImage) {
    if (!settings.screenshotFallback) throw codedError("NO_CONTENT_DETECTED", "No readable text found and screenshot fallback is disabled.");
    try { screenshot = sender?.frameId > 0 ? await captureVisible(tab, (tabId, message) => tell(tabId, message, sender.frameId)) : await captureRegion(tab, payload.rect, payload.viewport, tell); }
    catch (cause) { throw codedError("SCREENSHOT_CAPTURE_FAILED", "Screenshot capture gagal pada halaman ini.", cause); }
  }
  await tell(tab.id, { type: "AI_ANALYZING" }, sender?.frameId || 0);
  const context = { title: tab.title || "Selected question", url: tab.url || "", content: payload.text || "", mode: screenshot ? (sender?.frameId > 0 ? "iframe-visible-image" : "selected-region-image") : "selected-region-text", explainMore: Boolean(payload.explainMore) };
  const item = await saveAnalysis(tab, settings, context, screenshot);
  await tell(tab.id, { type: "AI_RESULT", item }, sender?.frameId || 0);
  return item;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => chrome.contextMenus.create({ id: "select-question-area", title: "Select Question Area", contexts: ["page", "selection"] }));
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_SELECTION") { startSelection().then((result) => sendResponse({ ok: true, ...result })).catch((e) => sendResponse(errorResponse(e))); return true; }
  if (message.type === "ANALYZE_SELECTION") { analyzeSelection(message.payload, sender).then((item) => sendResponse({ ok: true, item })).catch(async (e) => { await tell(sender?.tab?.id, { type: "AI_ERROR", error: e.message }, sender?.frameId || 0); sendResponse(errorResponse(e)); }); return true; }
  if (message.type === "TEST_CONNECTION") { getSettings().then((s) => createProvider(s).test()).then(() => sendResponse({ ok: true })).catch((e) => sendResponse(errorResponse(e))); return true; }
});
chrome.commands.onCommand.addListener((command) => { if (command === "select-question") startSelection().catch(() => {}); });
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== "select-question-area") return;
  startSelection(info.frameId || 0).catch(async (error) => { if (tab?.id) await tell(tab.id, { type: "AI_ERROR", error: error.message }, info.frameId || 0); });
});
