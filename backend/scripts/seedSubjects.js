// Seed the STEAM subject catalog (GDPT 2018 classification) for the org.
// Idempotent via the (org_id, name, grade_band, steam_axis) unique constraint.
// Usage: npm run seed:subjects
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Bảng phân loại môn học theo tag STEAM — Chương trình GDPT 2018.
const CATALOG = {
  primary: {
    S: ["Tự nhiên & Xã hội", "Khoa học"],
    T: ["Tin học"],
    E: ["Công nghệ"],
    A: ["Tiếng Việt", "Mỹ thuật", "Âm nhạc", "Đạo đức"],
    M: ["Toán"],
  },
  secondary: {
    S: ["Khoa học tự nhiên"],
    T: ["Tin học"],
    E: ["Công nghệ"],
    A: ["Ngữ văn", "Mỹ thuật", "Âm nhạc", "Lịch sử & Địa lý"],
    M: ["Toán"],
  },
  high_school: {
    S: ["Vật lý", "Hóa học", "Sinh học"],
    T: ["Tin học"],
    E: ["Công nghệ"],
    A: ["Ngữ văn", "Mỹ thuật", "Âm nhạc", "Lịch sử", "Địa lý"],
    M: ["Toán"],
  },
};

async function main() {
  const { data: profile, error } = await db
    .from("profiles").select("org_id").not("org_id", "is", null)
    .order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (error) { console.error("resolve org failed", error.message); process.exit(1); }
  if (!profile) { console.error("No profile/org. Run seed:demo first."); process.exit(1); }
  const orgId = profile.org_id;

  const rows = [];
  for (const [gradeBand, byAxis] of Object.entries(CATALOG)) {
    for (const [axis, names] of Object.entries(byAxis)) {
      for (const name of names) {
        rows.push({ org_id: orgId, name, steam_axis: axis, grade_band: gradeBand });
      }
    }
  }

  const { error: upErr } = await db
    .from("subjects")
    .upsert(rows, { onConflict: "org_id,name,grade_band,steam_axis", ignoreDuplicates: true });
  if (upErr) { console.error("seed subjects failed", upErr.message); process.exit(1); }
  console.log(`Seeded ${rows.length} subject rows for org ${orgId}.`);
}
main().catch((e) => { console.error("FATAL", e); process.exit(1); });
