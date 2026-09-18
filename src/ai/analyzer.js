import { createProvider } from "./index.js";

export async function analyzeSelectedQuestion(settings, context, croppedImage = null) {
  return createProvider(settings).analyze(context, croppedImage);
}
