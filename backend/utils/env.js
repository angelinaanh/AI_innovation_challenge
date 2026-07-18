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

// Vite tự nhảy sang 5174, 5175... khi 5173 đã bị chiếm (thường do một dev server
// cũ chưa tắt). Origin mới không nằm trong allowlist -> CORS chặn -> trình duyệt
// báo "Failed to fetch" ở MỌI endpoint, rất khó đoán vì port thay đổi ngẫu
// nhiên. Ở dev ta tin mọi origin loopback; production vẫn giữ allowlist chặt.
const LOOPBACK_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

export function isOriginAllowed(origin) {
  // Không có Origin: curl, health check, server-to-server — không phải request
  // trình duyệt nên không có gì để bảo vệ bằng CORS.
  if (!origin) return true;
  if (env.corsOrigins.includes(origin)) return true;
  return env.nodeEnv !== "production" && LOOPBACK_ORIGIN.test(origin);
}
