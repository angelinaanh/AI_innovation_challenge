// Backfill approved Tutor grounding sources from each PUBLISHED lesson's own
// checkpoint content, so the grounded Tutor chat and interactive exercises work
// on every Skill Node — not only the seeded Loops lesson.
//
// Idempotent: a lesson that already has a source_document is skipped, so the
// hand-authored Loops source/chunks are preserved. The lesson is already
// teacher-reviewed (PUBLISHED), so using its content as the grounding source
// keeps the "grounded on approved material" invariant.
//
// Usage: npm run seed:sources
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function assert(result, label) {
  if (result.error) {
    console.error(`FAILED: ${label}`, result.error.message);
    process.exit(1);
  }
  return result.data;
}

function chunkText(checkpoint) {
  return [checkpoint.title, checkpoint.body, checkpoint.takeaway]
    .filter(Boolean)
    .join(". ")
    .replace(/\.\./g, ".");
}

async function main() {
  const teacher = assert(
    await db.from("profiles").select("id,org_id").eq("role", "teacher")
      .order("created_at", { ascending: true }).limit(1).maybeSingle(),
    "resolve teacher",
  );
  if (!teacher) { console.error("No teacher profile. Run seed:demo first."); process.exit(1); }

  const lessons = assert(
    await db.from("lessons").select("id,skill_node_id,content,source_document_id").eq("status", "PUBLISHED"),
    "load published lessons",
  );

  let created = 0;
  let skipped = 0;
  for (const lesson of lessons) {
    if (lesson.source_document_id) { skipped += 1; continue; }
    const checkpoints = lesson.content?.checkpoints || [];
    if (!checkpoints.length) { skipped += 1; continue; }

    const extractedText = [lesson.content?.summary, ...checkpoints.map(chunkText)]
      .filter(Boolean).join("\n\n");
    const doc = assert(
      await db.from("source_documents").insert({
        uploaded_by: teacher.id,
        skill_node_id: lesson.skill_node_id,
        storage_path: `seed://lesson-content/${lesson.skill_node_id}`,
        extracted_text: extractedText,
      }).select("id").single(),
      `create source_document for ${lesson.skill_node_id}`,
    );

    const rows = checkpoints.map((checkpoint, index) => ({
      source_document_id: doc.id,
      skill_node_id: lesson.skill_node_id,
      chunk_index: index,
      content: chunkText(checkpoint),
      embedding: null,
    }));
    assert(await db.from("document_chunks").insert(rows), `insert chunks for ${lesson.skill_node_id}`);
    assert(
      await db.from("lessons").update({ source_document_id: doc.id }).eq("id", lesson.id),
      `link source_document to lesson ${lesson.id}`,
    );
    console.log(`  + ${lesson.skill_node_id}: ${rows.length} approved chunks`);
    created += 1;
  }
  console.log(`\nDone. ${created} lessons backfilled, ${skipped} already had sources.`);
  console.log("Tutor grounding + exercises now work on every published Skill Node.");
}

main().catch((error) => { console.error("FATAL", error); process.exit(1); });
