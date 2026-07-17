import OpenAI from "openai";

import { env } from "../../utils/env.js";

let client = null;

export function getOpenAiClient() {
  if (!env.openAiApiKey) {
    const error = new Error("AI Tutor chưa được cấu hình trên máy chủ.");
    error.code = "AI_UNAVAILABLE";
    throw error;
  }

  if (!client) {
    client = new OpenAI({
      apiKey: env.openAiApiKey,
      timeout: 30000,
      maxRetries: 1,
    });
  }
  return client;
}
