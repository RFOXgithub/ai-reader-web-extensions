import { createProvider } from "../ai/index.js";
import { analyzeSelectedQuestion } from "../ai/analyzer.js";
import { captureRegion } from "../capture/region-capture.js";
import { addHistory, getSettings } from "../utils/storage.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => chrome.contextMenus.create({ id: "select-question-area", title: "Select Question Area", contexts: ["page", "selection"] }));
});

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("Tidak ada tab aktif.");
  if (!/^https?:/.test(tab.url || "")) throw new Error("Selection hanya tersedia pada halaman HTTP/HTTPS biasa.");
  return tab;
}
async function tell(tabId, message) { return chrome.tabs.sendMessage(tabId, message).catch(() => undefined); }
async function ensureContentScript(tabId) {
  try { return await chrome.tabs.sendMessage(tabId, { type: "PING" }); }
  catch {
    await chrome.scripting.insertCSS({ target: { tabId }, files: ["src/content/content.css"] });
    await chrome.scripting.executeScript({ target: { tabId }, files: ["src/content/text-extractor.js", "src/content/question-detector.js", "src/content/selection-overlay.js", "src/content/selection-mode.js", "src/content/content.js"] });
  }
}
async function startSelection() { const tab = await activeTab(); await ensureContentScript(tab.id); await chrome.tabs.sendMessage(tab.id, { type: "START_SELECTION" }); }

async function analyzeSelection(payload) {
  if (!payload?.rect || payload.rect.width < 40 || payload.rect.height < 30) throw new Error("Selection is too small. Please select the complete question.");
  const tab = await activeTab(), settings = await getSettings(); await ensureContentScript(tab.id);
  const useImage = !payload.readable || payload.hasVisual;
  let screenshot = null;
  if (useImage) {
    if (!settings.screenshotFallback) throw new Error("No readable text found and screenshot fallback is disabled.");
    screenshot = await captureRegion(tab, payload.rect, payload.viewport, tell);
  }
  await tell(tab.id, { type: "AI_ANALYZING" });
  const context = { title: tab.title || "Selected question", url: tab.url, content: payload.text || "", mode: screenshot ? "selected-region-image" : "selected-region-text", explainMore: Boolean(payload.explainMore) };
  const answer = await analyzeSelectedQuestion(settings, context, screenshot);
  const item = { id: crypto.randomUUID(), answer, title: tab.title || "Selected question", url: tab.url, createdAt: Date.now(), mode: context.mode };
  await addHistory(item); await tell(tab.id, { type: "AI_RESULT", item }); return item;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "START_SELECTION") { startSelection().then(() => sendResponse({ ok: true })).catch((e) => sendResponse({ ok: false, error: e.message })); return true; }
  if (message.type === "ANALYZE_SELECTION") { analyzeSelection(message.payload).then((item) => sendResponse({ ok: true, item })).catch(async (e) => { const error=e?.message||"Unable to analyze the selected question."; try{await tell((await activeTab()).id,{type:"AI_ERROR",error});}catch{} sendResponse({ok:false,error}); }); return true; }
  if (message.type === "TEST_CONNECTION") { getSettings().then((s)=>createProvider(s).test()).then(()=>sendResponse({ok:true})).catch((e)=>sendResponse({ok:false,error:e.message})); return true; }
});
chrome.commands.onCommand.addListener((command) => { if (command === "select-question") startSelection().catch(() => {}); });
chrome.contextMenus.onClicked.addListener((info) => { if (info.menuItemId === "select-question-area") startSelection().catch(() => {}); });
