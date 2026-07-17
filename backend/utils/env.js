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
  demoStudentId: process.env.DEMO_STUDENT_ID || null,
  nodeEnv: process.env.NODE_ENV || "development",
});
