// Seed the STEAM subject catalog (GDPT 2018 classification) for the org.
// Idempotent via the (org_id, name, grade_band, steam_axis) unique constraint;
// upsert also backfills min_grade/max_grade on rows that already exist.
// Usage: npm run seed:subjects
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Bảng phân loại môn học theo tag STEAM — Chương trình GDPT 2018.
// minGrade/maxGrade là phạm vi lớp thật của môn, không phải cả grade_band.
const CATALOG = {
  primary: {
    S: [
      { name: "Tự nhiên & Xã hội", minGrade: 1, maxGrade: 3 },
      { name: "Khoa học", minGrade: 4, maxGrade: 5 },
    ],
    T: [{ name: "Tin học", minGrade: 3, maxGrade: 5 }],
    E: [{ name: "Công nghệ", minGrade: 3, maxGrade: 5 }],
    A: [
      { name: "Tiếng Việt", minGrade: 1, maxGrade: 5 },
      { name: "Mỹ thuật", minGrade: 1, maxGrade: 5 },
      { name: "Âm nhạc", minGrade: 1, maxGrade: 5 },
      { name: "Đạo đức", minGrade: 1, maxGrade: 5 },
    ],
    M: [{ name: "Toán", minGrade: 1, maxGrade: 5 }],
  },
  secondary: {
    S: [{ name: "Khoa học tự nhiên", minGrade: 6, maxGrade: 9 }],
    T: [{ name: "Tin học", minGrade: 6, maxGrade: 9 }],
    E: [{ name: "Công nghệ", minGrade: 6, maxGrade: 9 }],
    A: [
      { name: "Ngữ văn", minGrade: 6, maxGrade: 9 },
      { name: "Mỹ thuật", minGrade: 6, maxGrade: 9 },
      { name: "Âm nhạc", minGrade: 6, maxGrade: 9 },
      { name: "Lịch sử & Địa lý", minGrade: 6, maxGrade: 9 },
    ],
    M: [{ name: "Toán", minGrade: 6, maxGrade: 9 }],
  },
  high_school: {
    S: [
      { name: "Vật lý", minGrade: 10, maxGrade: 12 },
      { name: "Hóa học", minGrade: 10, maxGrade: 12 },
      { name: "Sinh học", minGrade: 10, maxGrade: 12 },
    ],
    T: [{ name: "Tin học", minGrade: 10, maxGrade: 12 }],
    E: [{ name: "Công nghệ", minGrade: 10, maxGrade: 12 }],
    A: [
      { name: "Ngữ văn", minGrade: 10, maxGrade: 12 },
      { name: "Mỹ thuật", minGrade: 10, maxGrade: 12 },
      { name: "Âm nhạc", minGrade: 10, maxGrade: 12 },
      { name: "Lịch sử", minGrade: 10, maxGrade: 12 },
      { name: "Địa lý", minGrade: 10, maxGrade: 12 },
    ],
    M: [{ name: "Toán", minGrade: 10, maxGrade: 12 }],
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
    for (const [axis, subjects] of Object.entries(byAxis)) {
      for (const { name, minGrade, maxGrade } of subjects) {
        rows.push({
          org_id: orgId,
          name,
          steam_axis: axis,
          grade_band: gradeBand,
          min_grade: minGrade,
          max_grade: maxGrade,
        });
      }
    }
  }

  // ignoreDuplicates:false -> hàng đã tồn tại (seed lần trước, thiếu
  // min_grade/max_grade) sẽ được cập nhật thay vì bị bỏ qua.
  const { error: upErr } = await db
    .from("subjects")
    .upsert(rows, { onConflict: "org_id,name,grade_band,steam_axis", ignoreDuplicates: false });
  if (upErr) { console.error("seed subjects failed", upErr.message); process.exit(1); }
  console.log(`Seeded ${rows.length} subject rows for org ${orgId}.`);
}
main().catch((e) => { console.error("FATAL", e); process.exit(1); });
