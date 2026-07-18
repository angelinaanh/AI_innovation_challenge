// Seed the exact grade 1-12 STEAM catalog for every organization.
// Run after migration 0004: npm run seed:subjects
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

import { SUBJECT_CATALOG } from "../services/academic/academicCatalog.js";

dotenv.config();
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: organizations, error } = await db
    .from("organizations")
    .select("id")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("resolve organizations failed", error.message);
    process.exit(1);
  }
  if (!organizations?.length) {
    console.error("No organization. Run seed:demo first.");
    process.exit(1);
  }

  const rows = organizations.flatMap(({ id: orgId }) =>
    SUBJECT_CATALOG.map((subject) => ({
      org_id: orgId,
      name: subject.name,
      steam_axis: subject.steamAxis,
      grade_level: subject.gradeLevel,
      grade_band: subject.gradeBand,
      min_grade: subject.gradeLevel,
      max_grade: subject.gradeLevel,
    })));

  const { error: upsertError } = await db
    .from("subjects")
    .upsert(rows, { onConflict: "org_id,name,grade_level" });
  if (upsertError) {
    console.error("seed subjects failed", upsertError.message);
    process.exit(1);
  }
  console.log(
    `Seeded ${SUBJECT_CATALOG.length} grade-specific subjects for ${organizations.length} organization(s).`,
  );
}

main().catch((error) => {
  console.error("FATAL", error);
  process.exit(1);
});
