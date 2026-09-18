import { AIProvider, validateProviderResponse } from "./provider.js";
import { pagePrompt, systemPrompt } from "./prompts.js";

export class OpenAIProvider extends AIProvider {
  async request(body) {
    if (!this.settings.apiKey) throw new Error("API key belum diatur. Buka Settings untuk menambahkan OpenAI API key.");
    const endpoint = this.settings.customEndpoint?.trim() || "https://api.openai.com/v1/responses";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.settings.apiKey}` },
      body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || `AI request failed (${response.status}).`);
    return data;
  }

  async analyze(context, screenshot) {
    const userContent = [{ type: "input_text", text: pagePrompt(context) }];
    if (screenshot) userContent.push({ type: "input_image", image_url: screenshot, detail: "high" });
    const data = await this.request({
      model: this.settings.model || "gpt-4.1-mini",
      instructions: systemPrompt(this.settings),
      input: [{ role: "user", content: userContent }]
    });
    const text = data.output_text || data.output?.flatMap((x) => x.content || []).find((x) => x.type === "output_text")?.text;
    return validateProviderResponse(text);
  }

  async test() {
    const data = await this.request({ model: this.settings.model || "gpt-4.1-mini", input: "Reply only: OK", max_output_tokens: 16 });
    return Boolean(data.output_text || data.output);
  }
}
