(function exposeAreaTextExtractor(global) {
  const IGNORED = "script,style,noscript,nav,footer,aside,iframe,[hidden],[aria-hidden='true'],[role='navigation'],[role='banner'],[role='contentinfo'],button,input,select,textarea,.ad,.ads,[class*='advert'],[id*='advert'],[class*='cookie'],[id*='cookie']";
  const TEXT_NODES = "h1,h2,h3,h4,h5,h6,p,li,dt,dd,pre,code,blockquote,label,legend,td,th,[role='article'],[role='listitem']";
  const clean = (value) => String(value || "").replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  const visible = (el) => {
    const style = getComputedStyle(el), rect = el.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
  };

  function extract(rect, maxChars = 8000) {
    const area = { left: rect.x, top: rect.y, right: rect.x + rect.width, bottom: rect.y + rect.height };
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const leaves = [];
    while (walker.nextNode()) {
      const node = walker.currentNode, parent = node.parentElement;
      if (!parent || parent.closest(IGNORED) || !visible(parent) || !clean(node.nodeValue)) continue;
      const range = document.createRange(); range.selectNodeContents(node);
      const boxes = [...range.getClientRects()].filter((box) => intersects(box, area));
      if (boxes.length) leaves.push({ node, rect: boxes[0] });
    }
    leaves.sort((a, b) => Math.abs(a.rect.top - b.rect.top) < 5 ? a.rect.left - b.rect.left : a.rect.top - b.rect.top);
    const seen = new Set(), parts = [];
    for (const item of leaves) {
      const text = clean(item.node.nodeValue);
      if (text && !seen.has(text)) { seen.add(text); parts.push(text); }
    }
    if (!parts.length) {
      const pointSamples = [[area.left + 2, area.top + 2], [(area.left + area.right) / 2, (area.top + area.bottom) / 2], [area.right - 2, area.bottom - 2]];
      for (const [x, y] of pointSamples) {
        const el = document.elementFromPoint(x, y);
        const text = el && !el.closest(IGNORED) ? clean(el.innerText) : "";
        if (text && text.length < maxChars && !seen.has(text)) { seen.add(text); parts.push(text); }
      }
    }
    const text = clean(parts.join("\n")).slice(0, maxChars);
    const hasVisual = [...document.querySelectorAll("img,canvas,svg,video")].some((el) => visible(el) && intersects(el.getBoundingClientRect(), area));
    return { text, hasVisual, elementCount: leaves.length };
  }

  function suggest(rect) {
    let element = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    const selectedArea = rect.width * rect.height;
    while (element && element !== document.body) {
      const box = element.getBoundingClientRect();
      const contains = box.left <= rect.x && box.top <= rect.y && box.right >= rect.x + rect.width && box.bottom >= rect.y + rect.height;
      const reasonable = box.width * box.height > selectedArea * 1.2 && box.width * box.height < selectedArea * 6 && box.width < innerWidth * .96 && box.height < innerHeight * .9;
      if (contains && reasonable && !element.matches(IGNORED)) {
        const expanded = { x: Math.max(0, box.left), y: Math.max(0, box.top), width: Math.min(innerWidth, box.right) - Math.max(0, box.left), height: Math.min(innerHeight, box.bottom) - Math.max(0, box.top) };
        const result = extract(expanded);
        if (result.text.length > extract(rect).text.length + 10) return { rect: expanded, ...result };
      }
      element = element.parentElement;
    }
    return null;
  }

  global.AIReaderAreaText = { extract, suggest, clean };
})(window);
