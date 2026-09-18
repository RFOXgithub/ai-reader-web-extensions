(function exposeSelectionMode(global) {
  let activeCleanup = null;
  const normalize = (a, b) => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y) });
  function start() {
    activeCleanup?.();
    const overlay = global.AIReaderSelectionOverlay.create();
    let origin = null, current = null;
    const cleanup = () => { removeEventListener("keydown", keydown, true); overlay.remove(); activeCleanup = null; };
    const keydown = (event) => { if (event.key === "Escape") { event.preventDefault(); cleanup(); global.AIReaderUI?.showReady("Selection cancelled."); } };
    addEventListener("keydown", keydown, true);
    overlay.stage.addEventListener("pointerdown", (event) => { if (event.button !== 0) return; origin = { x: event.clientX, y: event.clientY }; current = origin; overlay.stage.setPointerCapture(event.pointerId); });
    overlay.stage.addEventListener("pointermove", (event) => { if (!origin) return; current = { x: event.clientX, y: event.clientY }; overlay.draw(normalize(origin, current)); });
    overlay.stage.addEventListener("pointerup", () => {
      if (!origin) return;
      const rect = normalize(origin, current); cleanup();
      if (rect.width < 40 || rect.height < 30) { global.AIReaderUI?.showError("Selection is too small. Please select the complete question.", true); return; }
      const extracted = global.AIReaderAreaText.extract(rect);
      const formatted = global.AIReaderQuestion.format(extracted.text);
      const suggested = global.AIReaderAreaText.suggest(rect);
      const suggestion = suggested ? { ...suggested, text: global.AIReaderQuestion.format(suggested.text), readable: global.AIReaderQuestion.readable(suggested.text), viewport: { width: innerWidth, height: innerHeight, devicePixelRatio } } : null;
      global.AIReaderUI?.preview({ rect, text: formatted, readable: global.AIReaderQuestion.readable(formatted), hasVisual: extracted.hasVisual, viewport: { width: innerWidth, height: innerHeight, devicePixelRatio }, suggestion });
    });
    activeCleanup = cleanup;
  }
  global.AIReaderSelectionMode = { start, cancel: () => activeCleanup?.() };
})(window);
