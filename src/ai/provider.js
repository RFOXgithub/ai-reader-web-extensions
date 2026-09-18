export class AIProvider {
  constructor(settings) { this.settings = settings; }
  async analyze() { throw new Error("Provider must implement analyze()."); }
  async test() { throw new Error("Provider must implement test()."); }
}

export function validateProviderResponse(value) {
  if (typeof value !== "string" || !value.trim()) throw new Error("AI returned an empty response.");
  return value.trim();
}
