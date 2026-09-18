(function exposeSelectionOverlay(global) {
  function create() {
    const host = document.createElement("div");
    host.id = "ai-reader-selection-root";
    Object.assign(host.style, { position: "fixed", inset: "0", zIndex: "2147483647", pointerEvents: "auto" });
    const root = host.attachShadow({ mode: "closed" });
    root.innerHTML = `<style>
      :host{all:initial}.stage{position:fixed;inset:0;cursor:crosshair;user-select:none;background:rgba(8,13,28,.44)}
      .hint{position:fixed;top:18px;left:50%;transform:translateX(-50%);padding:9px 14px;border-radius:999px;background:#111827;color:#fff;font:600 13px system-ui;box-shadow:0 8px 30px #0004;pointer-events:none}
      .box{display:none;position:fixed;border:2px solid #7567ff;background:transparent;box-shadow:0 0 0 9999px rgba(8,13,28,.44);pointer-events:none}.stage.dragging{background:transparent}.size{position:absolute;right:0;bottom:-27px;padding:3px 7px;border-radius:5px;background:#6758f6;color:#fff;font:11px system-ui;white-space:nowrap}
    </style><div class="stage"><div class="hint">Drag around the complete question · ESC to cancel</div><div class="box"><span class="size"></span></div></div>`;
    document.documentElement.appendChild(host);
    const stage = root.querySelector(".stage"), box = root.querySelector(".box"), size = root.querySelector(".size");
    return {
      host, stage,
      draw(rect) { stage.classList.add("dragging"); box.style.display = "block"; box.style.left = `${rect.x}px`; box.style.top = `${rect.y}px`; box.style.width = `${rect.width}px`; box.style.height = `${rect.height}px`; size.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)}`; },
      remove() { host.remove(); }
    };
  }
  global.AIReaderSelectionOverlay = { create };
})(window);
