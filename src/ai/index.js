import { OpenAIProvider } from "./openai.js";

export function createProvider(settings) {
  if (settings.provider === "openai") return new OpenAIProvider(settings);
  throw new Error(`Provider '${settings.provider}' belum tersedia pada MVP ini.`);
}
