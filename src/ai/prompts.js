export function systemPrompt(settings) {
  const custom = settings.customPrompt?.trim();
  return [
    "You are a concise, accurate question-solving assistant.",
    "Analyze only the user-selected question content. Never infer context from the surrounding webpage.",
    "Always respond in exactly this structure: ANSWER: <answer or option>\\n\\nCONFIDENCE: <0-100>%\\n\\nEXPLANATION:\\n<short reasoning>.",
    "Give the result in " + (settings.language || "Indonesian") + ".",
    "Do not invent facts not supported by the page. Clearly state uncertainty.",
    custom ? `Additional user instruction: ${custom}` : ""
  ].filter(Boolean).join("\n");
}

export function pagePrompt(context) {
  return `Selected-question input mode: ${context.mode || "text"}\n${context.explainMore ? "Explain the prior selected question in more detail.\n" : ""}\n${context.content ? `Extracted selected-area text:\n${context.content}` : "No reliable DOM text was found. Read only the attached cropped selection image."}`;
}
