(function exposeQuestionDetector(global) {
  const OPTION = /^(?:[A-H][.):]|\([A-H]\)|\d+[.)])\s+/i;
  function format(text) {
    const lines = String(text || "").split(/\n+/).map((x) => x.trim()).filter(Boolean);
    if (!lines.length) return "";
    const firstOption = lines.findIndex((line) => OPTION.test(line));
    if (firstOption > 0) return `Question:\n${lines.slice(0, firstOption).join("\n")}\n\nOptions:\n${lines.slice(firstOption).join("\n")}`;
    return lines.join("\n");
  }
  function readable(text) {
    const value = String(text || "").trim();
    const letters = (value.match(/[\p{L}\p{N}]/gu) || []).length;
    return value.length >= 12 && letters / Math.max(value.length, 1) >= 0.35;
  }
  global.AIReaderQuestion = { format, readable };
})(window);
