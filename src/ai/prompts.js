export function systemPrompt(settings) {
  const custom = settings.customPrompt?.trim();
  return [
    "You are a concise, accurate question-solving assistant.",
    "Analyze the explicitly captured question content. For a selected-region image, ignore content outside that region; for a visible-tab fallback, locate and solve the clearest visible question.",
    "Always respond in exactly this structure: ANSWER: <answer or option>\\n\\nCONFIDENCE: <0-100>%\\n\\nEXPLANATION:\\n<short reasoning>.",
    "Give the result in " + (settings.language || "Indonesian") + ".",
    "Do not invent facts not supported by the page. Clearly state uncertainty.",
    custom ? `Additional user instruction: ${custom}` : ""
  ].filter(Boolean).join("\n");
}

export function pagePrompt(context) {
  const imageInstruction = context.mode === "visible-tab-image" || context.mode === "iframe-visible-image"
    ? "DOM access was unavailable. Find the clearest question in the attached visible-tab image and answer it."
    : "No reliable DOM text was found. Read only the attached cropped selection image.";
  return `Captured-question input mode: ${context.mode || "text"}\n${context.explainMore ? "Explain the prior selected question in more detail.\n" : ""}\n${context.content ? `Extracted selected-area text:\n${context.content}` : imageInstruction}`;
}
