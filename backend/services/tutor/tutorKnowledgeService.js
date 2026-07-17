import { env } from "../../utils/env.js";
import { createEmbeddings } from "../ai/aiGateway.js";
import { supabase } from "../supabase.js";
import { throwDatabaseError } from "../student/studentContext.js";
import {
  isKnowledgeGrounded,
  rankKnowledgeChunks,
} from "./tutorRules.js";

function parseVector(value) {
  if (Array.isArray(value)) return value.map(Number);
  if (typeof value !== "string" || value.length < 3) return null;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(Number) : null;
  } catch {
    return null;
  }
}

function cosineSimilarity(left, right) {
  if (!left || !right || left.length !== right.length || left.length === 0) return 0;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }
  if (!leftMagnitude || !rightMagnitude) return 0;
  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

async function loadApprovedChunkRows(skillNodeId) {
  const lessonsResult = await supabase
    .from("lessons")
    .select("id,source_document_id,content")
    .eq("skill_node_id", skillNodeId)
    .eq("status", "PUBLISHED")
    .not("source_document_id", "is", null);
  throwDatabaseError(lessonsResult.error, "load published Tutor lesson sources");

  const lessons = lessonsResult.data || [];
  const sourceIds = [...new Set(lessons.map((lesson) => lesson.source_document_id))];
  if (sourceIds.length === 0) return [];

  const chunksResult = await supabase
    .from("document_chunks")
    .select("id,source_document_id,chunk_index,content,embedding")
    .eq("skill_node_id", skillNodeId)
    .in("source_document_id", sourceIds)
    .order("chunk_index", { ascending: true });
  throwDatabaseError(chunksResult.error, "load approved Tutor knowledge chunks");

  const lessonBySource = new Map(
    lessons.map((lesson) => [lesson.source_document_id, lesson]),
  );
  return (chunksResult.data || []).map((chunk) => {
    const lesson = lessonBySource.get(chunk.source_document_id);
    const checkpoint = lesson?.content?.checkpoints?.[chunk.chunk_index] || {};
    return {
      id: chunk.id,
      sourceDocumentId: chunk.source_document_id,
      lessonId: lesson?.id,
      checkpointId: checkpoint.id || `checkpoint-${chunk.chunk_index + 1}`,
      title: checkpoint.title || `Checkpoint ${chunk.chunk_index + 1}`,
      content: chunk.content,
      embedding: parseVector(chunk.embedding),
    };
  });
}

export async function retrieveApprovedKnowledge({
  question,
  skillNodeId,
  orgId,
  userId,
}) {
  const chunks = await loadApprovedChunkRows(skillNodeId);
  const lexicalRanking = rankKnowledgeChunks(question, chunks);
  if (!isKnowledgeGrounded(lexicalRanking)) {
    return { grounded: false, confidence: 0, sources: [] };
  }

  let queryEmbedding = null;
  if (env.aiAllowApprovedContentExport && chunks.some((chunk) => chunk.embedding)) {
    [queryEmbedding] = await createEmbeddings({ texts: [question], orgId, userId });
  }

  const ranked = lexicalRanking
    .map((chunk) => {
      const semanticScore = Math.max(0, cosineSimilarity(queryEmbedding, chunk.embedding));
      return {
        ...chunk,
        semanticScore,
        combinedScore: (chunk.lexicalScore * 0.75) + (semanticScore * 0.25),
      };
    })
    .sort((left, right) => right.combinedScore - left.combinedScore);
  const selected = ranked.filter((chunk) => chunk.lexicalScore > 0).slice(0, 2);

  return {
    grounded: selected.length > 0,
    confidence: Math.min(0.99, Number(selected[0]?.combinedScore || 0)),
    sources: selected.map((chunk) => ({
      sourceChunkId: chunk.id,
      lessonId: chunk.lessonId,
      checkpointId: chunk.checkpointId,
      title: chunk.title,
      content: chunk.content,
    })),
  };
}

export async function getApprovedCitationMap(skillNodeId) {
  const chunks = await loadApprovedChunkRows(skillNodeId);
  return new Map(chunks.map((chunk) => [chunk.id, {
    sourceChunkId: chunk.id,
    lessonId: chunk.lessonId,
    checkpointId: chunk.checkpointId,
    title: chunk.title,
  }]));
}
