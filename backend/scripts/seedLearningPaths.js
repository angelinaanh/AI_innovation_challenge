// Seed nội dung Lộ trình học vào public.learning_paths.
// Chạy sau migration 0013: npm run seed:learning
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

import { syllabusSeedRows } from "../services/learning/syllabusData.js";

dotenv.config();
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const rows = syllabusSeedRows().map((row) => ({ ...row, updated_at: new Date().toISOString() }));
  const { error } = await db
    .from("learning_paths")
    .upsert(rows, { onConflict: "grade,subject_key" });
  if (error) {
    console.error("seed learning paths failed:", error.message);
    if (error.code === "42P01") {
      console.error("Bảng learning_paths chưa tồn tại. Hãy chạy migration database/migrations/0013_learning_paths.sql trước.");
    }
    process.exit(1);
  }
  console.log(`Seeded ${rows.length} learning-path syllabi:`,
    rows.map((r) => `${r.subject_key}(lớp ${r.grade})`).join(", "));
}

main().catch((error) => {
  console.error("FATAL", error);
  process.exit(1);
});
