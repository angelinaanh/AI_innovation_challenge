import dotenv from "dotenv";

dotenv.config();

const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

export const env = Object.freeze({
  port: Number(process.env.PORT || 4000),
  corsOrigins: [
    ...new Set(
      [
        process.env.CORS_ORIGINS || process.env.CORS_ORIGIN,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ]
        .filter(Boolean)
        .flatMap((value) => value.split(","))
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  ],
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  openAiApiKey: process.env.OPENAI_API_KEY || null,
  openAiModels: Object.freeze({
    contentHigh: process.env.OPENAI_CONTENT_HIGH_MODEL || "gpt-5.6-sol",
    contentFast: process.env.OPENAI_CONTENT_FAST_MODEL || "gpt-5.6-luna",
    tutor: process.env.OPENAI_TUTOR_MODEL || "gpt-5.6-luna",
    summary: process.env.OPENAI_SUMMARY_MODEL || "gpt-5.6-luna",
    embedding: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
    moderation: process.env.OPENAI_MODERATION_MODEL || "omni-moderation-latest",
  }),
  aiDailyBudgetUsd: Number(process.env.AI_DAILY_BUDGET_USD || 5),
  aiTutorDailyLimitPerStudent: Number(
    process.env.AI_TUTOR_DAILY_LIMIT_PER_STUDENT || 20,
  ),
  aiAllowApprovedContentExport:
    process.env.AI_ALLOW_APPROVED_CONTENT_EXPORT === "true",
  nodeEnv: process.env.NODE_ENV || "development",
});
