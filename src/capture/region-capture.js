import { cropDataUrl } from "./image-cropper.js";

export async function captureRegion(tab, rect, viewport, tell) {
  await tell(tab.id, { type: "PREPARE_REGION_CAPTURE" });
  try {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const visible = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "jpeg", quality: 90 });
    return await cropDataUrl(visible, rect, viewport);
  } finally {
    await tell(tab.id, { type: "REGION_CAPTURED" });
  }
}

export async function captureVisible(tab, tell = async () => {}) {
  await tell(tab.id, { type: "PREPARE_REGION_CAPTURE" });
  try {
    await new Promise((resolve) => setTimeout(resolve, 40));
    return await chrome.tabs.captureVisibleTab(tab.windowId, { format: "jpeg", quality: 90 });
  } catch (cause) {
    const error = new Error("Browser tidak mengizinkan screenshot pada halaman ini.");
    error.code = "SCREENSHOT_CAPTURE_FAILED";
    error.cause = cause;
    throw error;
  } finally {
    await tell(tab.id, { type: "REGION_CAPTURED" });
  }
}
