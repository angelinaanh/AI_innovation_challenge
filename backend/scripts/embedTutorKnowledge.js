import { createEmbeddings } from "../services/ai/aiGateway.js";
import { supabase } from "../services/supabase.js";
import { throwDatabaseError } from "../services/student/studentContext.js";
import { env } from "../utils/env.js";

function hasEmbedding(value) {
  return Array.isArray(value)
    ? value.length > 0
    : typeof value === "string" && value.length > 2;
}

async function embedTutorKnowledge() {
  if (!env.aiAllowApprovedContentExport) {
    throw new Error(
      "Approved-content export is disabled. Set AI_ALLOW_APPROVED_CONTENT_EXPORT=true only after explicit organization approval.",
    );
  }
  const profileResult = await supabase
    .from("profiles")
    .select("id,org_id")
    .eq("role", "teacher")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();
  throwDatabaseError(profileResult.error, "load teacher for Tutor embedding seed");

  const nodesResult = await supabase
    .from("skill_nodes")
    .select("id")
    .eq("org_id", profileResult.data.org_id);
  throwDatabaseError(nodesResult.error, "load organization Skill Nodes for embedding");
  const skillNodeIds = (nodesResult.data || []).map((node) => node.id);
  if (skillNodeIds.length === 0) {
    console.log("No organization Skill Nodes need Tutor embeddings.");
    return;
  }

  const lessonsResult = await supabase
    .from("lessons")
    .select("source_document_id")
    .in("skill_node_id", skillNodeIds)
    .eq("status", "PUBLISHED")
    .not("source_document_id", "is", null);
  throwDatabaseError(lessonsResult.error, "load approved sources for embedding");
  const sourceIds = [...new Set(
    (lessonsResult.data || []).map((lesson) => lesson.source_document_id),
  )];
  if (sourceIds.length === 0) {
    console.log("No approved Tutor source documents need embeddings.");
    return;
  }

  const chunksResult = await supabase
    .from("document_chunks")
    .select("id,content,embedding")
    .in("source_document_id", sourceIds)
    .order("chunk_index", { ascending: true });
  throwDatabaseError(chunksResult.error, "load Tutor chunks for embedding");
  const pending = (chunksResult.data || []).filter((chunk) => !hasEmbedding(chunk.embedding));
  if (pending.length === 0) {
    console.log("Tutor knowledge embeddings are already up to date.");
    return;
  }

  const vectors = await createEmbeddings({
    texts: pending.map((chunk) => chunk.content),
    orgId: profileResult.data.org_id,
    userId: profileResult.data.id,
  });
  for (const [index, chunk] of pending.entries()) {
    const updateResult = await supabase
      .from("document_chunks")
      .update({ embedding: vectors[index] })
      .eq("id", chunk.id);
    throwDatabaseError(updateResult.error, `store Tutor embedding ${chunk.id}`);
  }

  console.log(`Embedded ${pending.length} approved Tutor knowledge chunks.`);
}

embedTutorKnowledge().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
