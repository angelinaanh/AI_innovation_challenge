import crypto from "node:crypto";
import { readFile } from "node:fs/promises";

import { env } from "../../utils/env.js";
import {
  assertAiBudgetAllowance,
  generateStructuredLesson,
  moderateText,
} from "../ai/aiGateway.js";
import { emitContentPublished } from "../realtime/realtimeHub.js";
import { supabase } from "../supabase.js";
import { throwDatabaseError } from "../student/studentContext.js";
import {
  buildStructuredDraft,
  contentSafetyText,
  nextLessonStatus,
  validateLessonDraft,
} from "./contentStudioRules.js";

const promptUrl = new URL("../../../ai/prompts/content_studio_draft.md", import.meta.url);
const contentPrompt = await readFile(promptUrl, "utf8");
const DIFFICULTIES = new Set(["basic", "advanced"]);

function appError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function cleanText(value) {
  return String(value || "").trim();
}

function estimateEditRate(previousContent, nextContent) {
  const tokens = (value) => new Set(
    JSON.stringify(value || {})
      .toLocaleLowerCase("vi-VN")
      .split(/[^\p{L}\p{N}]+/u)
      .filter((token) => token.length > 1),
  );
  const previous = tokens(previousContent);
  const next = tokens(nextContent);
  const union = new Set([...previous, ...next]);
  if (union.size === 0) return 0;
  let shared = 0;
  for (const token of previous) if (next.has(token)) shared += 1;
  return Number(((1 - (shared / union.size)) * 100).toFixed(2));
}

function lessonSummary(lesson) {
  if (!lesson) return null;
  return {
    id: lesson.id,
    status: lesson.status,
    difficulty: lesson.difficulty,
    title: lesson.content?.title || "Bài học chưa đặt tên",
    summary: lesson.content?.summary || "",
    generatedBy: lesson.generated_by,
    publishedAt: lesson.published_at,
    createdAt: lesson.created_at,
  };
}

function questionForEditor(question) {
  if (!question) return null;
  return {
    id: question.id,
    body: question.body,
    options: question.options || [],
    correctIndex: Number(question.answer_key?.index ?? 0),
    explanation: question.answer_key?.explanation || "",
    difficulty: question.difficulty,
    status: question.status,
  };
}

async function loadTeacher(teacherId) {
  const result = await supabase.from("profiles")
    .select("id,org_id,role,full_name,email")
    .eq("id", teacherId).eq("role", "teacher").single();
  throwDatabaseError(result.error, "load Content Studio teacher");
  return result.data;
}

async function loadOrgNode(teacher, skillNodeId) {
  const result = await supabase.from("skill_nodes")
    .select("id,org_id,subject,grade_band,name,description,steam_weights,order_index")
    .eq("id", skillNodeId).eq("org_id", teacher.org_id).maybeSingle();
  throwDatabaseError(result.error, "load Content Studio Skill Node");
  if (!result.data) throw appError("CONTENT_NOT_FOUND", "Không tìm thấy Skill Node này.");
  return result.data;
}

async function loadLessonWithContext(teacherId, lessonId, { allowPublishedRevision = false } = {}) {
  const teacher = await loadTeacher(teacherId);
  const lessonResult = await supabase.from("lessons")
    .select("id,skill_node_id,status,difficulty,content,content_format,source_document_id,generated_by,reviewed_by,published_at,created_at")
    .eq("id", lessonId).maybeSingle();
  throwDatabaseError(lessonResult.error, "load Content Studio lesson");
  if (!lessonResult.data) throw appError("CONTENT_NOT_FOUND", "Không tìm thấy bài học này.");
  const lesson = lessonResult.data;
  // Bài giảng AI (steam_lesson) có shape content khác hẳn và không gắn Skill
  // Node — editor này không đọc được. Chặn sớm với thông điệp rõ ràng thay vì
  // để loadOrgNode ném "không tìm thấy Skill Node" khó hiểu.
  if (lesson.content_format === "steam_lesson") {
    throw appError(
      "CONTENT_WRONG_SURFACE",
      "Bài giảng này thuộc luồng Tạo bài giảng bằng AI. Hãy mở ở mục Bài giảng AI.",
    );
  }
  const node = await loadOrgNode(teacher, lesson.skill_node_id);

  const sourceResult = lesson.source_document_id
    ? await supabase.from("source_documents")
      .select("id,uploaded_by,skill_node_id,storage_path,extracted_text,created_at")
      .eq("id", lesson.source_document_id).maybeSingle()
    : { data: null, error: null };
  throwDatabaseError(sourceResult.error, "load Content Studio source");

  const ownsSource = sourceResult.data?.uploaded_by === teacherId;
  const reviewedOwn = lesson.reviewed_by === teacherId;
  const editable = ownsSource && ["DRAFT", "IN_REVIEW"].includes(lesson.status);
  const canRevise = lesson.status === "PUBLISHED" && (ownsSource || reviewedOwn || allowPublishedRevision);
  return { teacher, lesson, node, source: sourceResult.data, editable, canRevise };
}

async function loadLessonQuestion(lessonId) {
  const result = await supabase.from("questions")
    .select("id,lesson_id,skill_node_id,grade_band,type,difficulty,steam_weights,body,options,answer_key,status,created_at")
    .eq("lesson_id", lessonId).order("created_at", { ascending: true }).limit(1).maybeSingle();
  throwDatabaseError(result.error, "load Content Studio question");
  return result.data;
}

async function loadContentJob(sourceDocumentId) {
  if (!sourceDocumentId) return null;
  const result = await supabase.from("content_jobs")
    .select("id,source_document_id,skill_node_id,started_at,published_at,human_minutes,edit_rate,cost_usd,status")
    .eq("source_document_id", sourceDocumentId)
    .order("started_at", { ascending: false }).limit(1).maybeSingle();
  throwDatabaseError(result.error, "load Content Studio job");
  return result.data;
}

async function writeAudit({ teacher, action, entityId, payload = {} }) {
  const result = await supabase.from("audit_log").insert({
    org_id: teacher.org_id,
    actor_id: teacher.id,
    action,
    entity_type: "lesson",
    entity_id: entityId,
    payload,
  });
  throwDatabaseError(result.error, `write ${action} audit`);
}

async function replaceSourceChunks(sourceDocumentId, skillNodeId, content) {
  const deleteResult = await supabase.from("document_chunks")
    .delete().eq("source_document_id", sourceDocumentId);
  throwDatabaseError(deleteResult.error, "replace Content Studio chunks");

  const chunks = (content.checkpoints || []).map((checkpoint, index) => ({
    source_document_id: sourceDocumentId,
    skill_node_id: skillNodeId,
    chunk_index: index,
    content: [content.title, checkpoint.title, checkpoint.body, checkpoint.takeaway]
      .filter(Boolean).join("\n"),
  }));
  if (chunks.length === 0) return;
  const insertResult = await supabase.from("document_chunks").insert(chunks);
  throwDatabaseError(insertResult.error, "save Content Studio chunks");
}

async function generateDraft({ teacher, node, sourceText, title }) {
  if (!env.aiAllowApprovedContentExport) {
    return {
      ...buildStructuredDraft({ sourceText, title, skillNodeName: node.name }),
      generatedBy: "local-structured-draft-v1",
      generationMode: "local",
    };
  }

  try {
    await assertAiBudgetAllowance({ orgId: teacher.org_id });
    const generated = await generateStructuredLesson({
      instructions: contentPrompt,
      input: [
        "Trả về đúng một object JSON theo schema đã quy định.",
        `Skill Node: ${node.name}`,
        `Khối lớp: ${node.grade_band || "không xác định"}`,
        `Tiêu đề mong muốn: ${cleanText(title) || node.name}`,
        `Nguồn do giáo viên cung cấp:\n${sourceText}`,
      ].join("\n\n"),
      orgId: teacher.org_id,
      userId: teacher.id,
    });
    const invalid = generated.draft
      ? validateLessonDraft(generated.draft.content, generated.draft.question)
      : "AI không trả về JSON hợp lệ.";
    if (invalid) throw appError("CONTENT_GENERATION_FAILED", `Bản nháp AI chưa hợp lệ (${invalid})`);
    const safety = await moderateText(
      contentSafetyText(generated.draft.content, generated.draft.question),
      { orgId: teacher.org_id, userId: teacher.id, feature: "content_studio_safety" },
    );
    if (safety.flagged) throw appError("CONTENT_UNSAFE", "Bản nháp AI chưa đạt kiểm duyệt an toàn.");
    return {
      ...generated.draft,
      generatedBy: generated.model,
      generationMode: "ai",
    };
  } catch (error) {
    if (!["AI_PROVIDER_ERROR", "AI_UNAVAILABLE", "AI_BUDGET_EXCEEDED"].includes(error.code)) throw error;
    return {
      ...buildStructuredDraft({ sourceText, title, skillNodeName: node.name }),
      generatedBy: "local-fallback-after-ai-error-v1",
      generationMode: "local-fallback",
    };
  }
}

async function createSource({ teacherId, nodeId, sourceText }) {
  const id = crypto.randomUUID();
  const result = await supabase.from("source_documents").insert({
    id,
    uploaded_by: teacherId,
    skill_node_id: nodeId,
    storage_path: `inline://content-studio/${teacherId}/${id}.txt`,
    extracted_text: sourceText,
  }).select("id,uploaded_by,skill_node_id,storage_path,extracted_text,created_at").single();
  throwDatabaseError(result.error, "create Content Studio source");
  return result.data;
}

async function createJob(sourceDocumentId, skillNodeId) {
  const result = await supabase.from("content_jobs").insert({
    source_document_id: sourceDocumentId,
    skill_node_id: skillNodeId,
    status: "generating",
  }).select("id").single();
  throwDatabaseError(result.error, "create Content Studio job");
  return result.data;
}

async function createLessonRecords({ teacher, node, source, difficulty, draft, jobId }) {
  const lessonResult = await supabase.from("lessons").insert({
    skill_node_id: node.id,
    status: "DRAFT",
    difficulty,
    content: draft.content,
    source_document_id: source.id,
    generated_by: draft.generatedBy,
  }).select("id,skill_node_id,status,difficulty,content,source_document_id,generated_by,reviewed_by,published_at,created_at").single();
  throwDatabaseError(lessonResult.error, "save Content Studio lesson");

  const questionResult = await supabase.from("questions").insert({
    lesson_id: lessonResult.data.id,
    skill_node_id: node.id,
    grade_band: node.grade_band,
    type: "mcq",
    difficulty: draft.question.difficulty || "medium",
    steam_weights: node.steam_weights || {},
    body: draft.question.body,
    options: draft.question.options,
    answer_key: {
      index: draft.question.correctIndex,
      explanation: draft.question.explanation || "",
    },
    status: "DRAFT",
  }).select("id,body,options,answer_key,difficulty,status").single();
  throwDatabaseError(questionResult.error, "save Content Studio question");
  await replaceSourceChunks(source.id, node.id, draft.content);

  const jobResult = await supabase.from("content_jobs")
    .update({ status: "ready_for_review" }).eq("id", jobId);
  throwDatabaseError(jobResult.error, "finish Content Studio job");
  await writeAudit({
    teacher,
    action: "CONTENT_DRAFT_CREATED",
    entityId: lessonResult.data.id,
    payload: { skillNodeId: node.id, difficulty, generationMode: draft.generationMode },
  });
  return { lesson: lessonResult.data, question: questionResult.data };
}

export async function listContentWorkspace(teacherId) {
  const teacher = await loadTeacher(teacherId);
  const nodesResult = await supabase.from("skill_nodes")
    .select("id,subject,grade_band,name,description,steam_weights,order_index")
    .eq("org_id", teacher.org_id).order("subject").order("order_index");
  throwDatabaseError(nodesResult.error, "list Content Studio nodes");
  const nodes = nodesResult.data || [];
  if (nodes.length === 0) return { nodes: [], counts: { draft: 0, review: 0, published: 0 } };

  const sourcesResult = await supabase.from("source_documents")
    .select("id").eq("uploaded_by", teacherId);
  throwDatabaseError(sourcesResult.error, "list teacher Content Studio sources");
  const ownSources = new Set((sourcesResult.data || []).map((source) => source.id));
  const lessonsResult = await supabase.from("lessons")
    .select("id,skill_node_id,status,difficulty,content,source_document_id,generated_by,reviewed_by,published_at,created_at")
    .in("skill_node_id", nodes.map((node) => node.id))
    .order("created_at", { ascending: false });
  throwDatabaseError(lessonsResult.error, "list Content Studio lessons");
  const lessons = lessonsResult.data || [];

  const rows = nodes.map((node) => {
    const nodeLessons = lessons.filter((lesson) => lesson.skill_node_id === node.id);
    const working = nodeLessons.filter((lesson) =>
      ownSources.has(lesson.source_document_id) && ["DRAFT", "IN_REVIEW"].includes(lesson.status));
    const published = nodeLessons.filter((lesson) => lesson.status === "PUBLISHED");
    return {
      ...node,
      working: working.map(lessonSummary),
      published: published.map(lessonSummary),
      archivedCount: nodeLessons.filter((lesson) => lesson.status === "ARCHIVED").length,
    };
  });
  return {
    nodes: rows,
    counts: {
      draft: lessons.filter((lesson) => ownSources.has(lesson.source_document_id) && lesson.status === "DRAFT").length,
      review: lessons.filter((lesson) => ownSources.has(lesson.source_document_id) && lesson.status === "IN_REVIEW").length,
      published: lessons.filter((lesson) => lesson.status === "PUBLISHED").length,
    },
    aiMode: env.aiAllowApprovedContentExport ? "ai" : "local",
  };
}

export async function createContentDraft(teacherId, payload) {
  const teacher = await loadTeacher(teacherId);
  const sourceText = cleanText(payload?.sourceText);
  if (sourceText.length < 120 || sourceText.length > 20000) {
    throw appError("VALIDATION_ERROR", "Nguồn nội dung cần từ 120 đến 20.000 ký tự.");
  }
  const requestedTitle = cleanText(payload?.title);
  if (requestedTitle.length < 3 || requestedTitle.length > 120) {
    throw appError("VALIDATION_ERROR", "Tiêu đề cần từ 3 đến 120 ký tự.");
  }
  const difficulty = cleanText(payload?.difficulty) || "basic";
  if (!DIFFICULTIES.has(difficulty)) throw appError("VALIDATION_ERROR", "Mức độ bài học không hợp lệ.");
  const node = await loadOrgNode(teacher, payload?.skillNodeId);
  const source = await createSource({ teacherId, nodeId: node.id, sourceText });
  const job = await createJob(source.id, node.id);
  try {
    const draft = await generateDraft({ teacher, node, sourceText, title: requestedTitle });
    const saved = await createLessonRecords({ teacher, node, source, difficulty, draft, jobId: job.id });
    return {
      id: saved.lesson.id,
      status: saved.lesson.status,
      generationMode: draft.generationMode,
    };
  } catch (error) {
    await supabase.from("content_jobs").update({ status: "failed" }).eq("id", job.id);
    throw error;
  }
}

export async function getContentLesson(teacherId, lessonId) {
  const context = await loadLessonWithContext(teacherId, lessonId, { allowPublishedRevision: true });
  const [question, job] = await Promise.all([
    loadLessonQuestion(lessonId),
    loadContentJob(context.source?.id),
  ]);
  return {
    lesson: lessonSummary(context.lesson),
    content: context.lesson.content,
    question: questionForEditor(question),
    source: context.source ? {
      id: context.source.id,
      text: context.source.extracted_text || "",
      createdAt: context.source.created_at,
    } : null,
    skillNode: {
      id: context.node.id,
      name: context.node.name,
      description: context.node.description,
      gradeBand: context.node.grade_band,
      subject: context.node.subject,
      steamWeights: context.node.steam_weights,
    },
    job,
    permissions: {
      editable: context.editable,
      canSubmitReview: context.editable && context.lesson.status === "DRAFT",
      canPublish: context.editable && context.lesson.status === "IN_REVIEW",
      canRevise: context.canRevise,
      canArchive: context.editable || context.canRevise,
    },
  };
}

export async function updateContentDraft(teacherId, lessonId, payload) {
  const context = await loadLessonWithContext(teacherId, lessonId);
  if (!context.editable) throw appError("CONTENT_FORBIDDEN", "Bạn không thể chỉnh sửa bản bài học này.");
  const questionRow = await loadLessonQuestion(lessonId);
  if (!questionRow) throw appError("CONTENT_NOT_FOUND", "Bài học chưa có câu hỏi kiểm tra.");
  const content = payload?.content;
  const question = payload?.question;
  const invalid = validateLessonDraft(content, question);
  if (invalid) throw appError("VALIDATION_ERROR", invalid);

  const lessonResult = await supabase.from("lessons").update({
    content,
    status: "DRAFT",
    reviewed_by: null,
    published_at: null,
  }).eq("id", lessonId).select("id,status").single();
  throwDatabaseError(lessonResult.error, "update Content Studio lesson");
  const questionResult = await supabase.from("questions").update({
    body: question.body,
    options: question.options,
    answer_key: { index: question.correctIndex, explanation: question.explanation || "" },
    difficulty: question.difficulty || "medium",
    status: "DRAFT",
  }).eq("id", questionRow.id);
  throwDatabaseError(questionResult.error, "update Content Studio question");
  await replaceSourceChunks(context.source.id, context.node.id, content);

  if (payload?.humanMinutes !== undefined) {
    const minutes = Math.max(0, Math.min(1440, Number(payload.humanMinutes) || 0));
    const editRate = estimateEditRate(context.lesson.content, content);
    const jobResult = await supabase.from("content_jobs")
      .update({ human_minutes: minutes, edit_rate: editRate, status: "ready_for_review" })
      .eq("source_document_id", context.source.id);
    throwDatabaseError(jobResult.error, "update Content Studio human time");
  }
  await writeAudit({
    teacher: context.teacher,
    action: "CONTENT_DRAFT_UPDATED",
    entityId: lessonId,
    payload: { returnedToDraft: context.lesson.status === "IN_REVIEW" },
  });
  return { id: lessonId, status: lessonResult.data.status };
}

export async function submitContentReview(teacherId, lessonId) {
  const context = await loadLessonWithContext(teacherId, lessonId);
  if (!context.editable) throw appError("CONTENT_FORBIDDEN", "Bạn không thể gửi duyệt bài học này.");
  const question = await loadLessonQuestion(lessonId);
  const invalid = validateLessonDraft(context.lesson.content, questionForEditor(question));
  if (invalid) throw appError("VALIDATION_ERROR", invalid);
  const status = nextLessonStatus("submit_review", context.lesson.status);
  const result = await supabase.from("lessons").update({ status }).eq("id", lessonId)
    .select("id,status").single();
  throwDatabaseError(result.error, "submit Content Studio review");
  await writeAudit({ teacher: context.teacher, action: "CONTENT_SUBMITTED_REVIEW", entityId: lessonId });
  return result.data;
}

export async function publishContentLesson(teacherId, lessonId, payload = {}) {
  const context = await loadLessonWithContext(teacherId, lessonId);
  if (!context.editable) throw appError("CONTENT_FORBIDDEN", "Bạn không thể xuất bản bài học này.");
  const question = await loadLessonQuestion(lessonId);
  const invalid = validateLessonDraft(context.lesson.content, questionForEditor(question));
  if (invalid) throw appError("VALIDATION_ERROR", invalid);
  const status = nextLessonStatus("publish", context.lesson.status);
  const now = new Date().toISOString();

  const previousResult = await supabase.from("lessons").select("id")
    .eq("skill_node_id", context.node.id)
    .eq("difficulty", context.lesson.difficulty)
    .eq("status", "PUBLISHED")
    .neq("id", lessonId);
  throwDatabaseError(previousResult.error, "load previous published lesson");
  const previousIds = (previousResult.data || []).map((lesson) => lesson.id);
  if (previousIds.length > 0) {
    const archiveResult = await supabase.from("lessons").update({ status: "ARCHIVED" }).in("id", previousIds);
    throwDatabaseError(archiveResult.error, "archive previous lesson versions");
    const oldQuestions = await supabase.from("questions").update({ status: "DRAFT" }).in("lesson_id", previousIds);
    throwDatabaseError(oldQuestions.error, "archive previous lesson questions");
  }

  const lessonResult = await supabase.from("lessons").update({
    status,
    reviewed_by: teacherId,
    published_at: now,
  }).eq("id", lessonId).select("id,status,published_at").single();
  throwDatabaseError(lessonResult.error, "publish Content Studio lesson");
  const questionResult = await supabase.from("questions").update({ status: "PUBLISHED" }).eq("lesson_id", lessonId);
  throwDatabaseError(questionResult.error, "publish Content Studio questions");
  const minutes = Math.max(0, Math.min(1440, Number(payload?.humanMinutes) || 0));
  const jobResult = await supabase.from("content_jobs").update({
    status: "published",
    published_at: now,
    human_minutes: minutes || null,
  }).eq("source_document_id", context.source.id);
  throwDatabaseError(jobResult.error, "publish Content Studio job");
  await writeAudit({
    teacher: context.teacher,
    action: "CONTENT_PUBLISHED",
    entityId: lessonId,
    payload: {
      skillNodeId: context.node.id,
      difficulty: context.lesson.difficulty,
      archivedLessonIds: previousIds,
    },
  });
  emitContentPublished({
    orgId: context.teacher.org_id,
    teacherId,
    lessonId,
    skillNodeId: context.node.id,
    publishedAt: now,
  });
  return { ...lessonResult.data, archivedLessonIds: previousIds };
}

export async function createContentVersion(teacherId, lessonId) {
  const context = await loadLessonWithContext(teacherId, lessonId, { allowPublishedRevision: true });
  if (!context.canRevise) throw appError("CONTENT_INVALID_STATE", "Chỉ bài học đã xuất bản mới tạo được phiên bản mới.");
  const question = await loadLessonQuestion(lessonId);
  if (!question || !context.source) throw appError("CONTENT_NOT_FOUND", "Phiên bản hiện tại thiếu nguồn hoặc câu hỏi.");
  const source = await createSource({
    teacherId,
    nodeId: context.node.id,
    sourceText: context.source.extracted_text || contentSafetyText(context.lesson.content, questionForEditor(question)),
  });
  const job = await createJob(source.id, context.node.id);
  const draft = {
    content: structuredClone(context.lesson.content),
    question: questionForEditor(question),
    generatedBy: "human-revision",
    generationMode: "revision",
  };
  const saved = await createLessonRecords({
    teacher: context.teacher,
    node: context.node,
    source,
    difficulty: context.lesson.difficulty,
    draft,
    jobId: job.id,
  });
  await writeAudit({
    teacher: context.teacher,
    action: "CONTENT_VERSION_CREATED",
    entityId: saved.lesson.id,
    payload: { basedOnLessonId: lessonId },
  });
  return { id: saved.lesson.id, status: saved.lesson.status, basedOnLessonId: lessonId };
}

export async function archiveContentLesson(teacherId, lessonId) {
  const context = await loadLessonWithContext(teacherId, lessonId);
  if (!context.editable && !context.canRevise) {
    throw appError("CONTENT_FORBIDDEN", "Bạn không thể lưu trữ bài học này.");
  }
  const status = nextLessonStatus("archive", context.lesson.status);
  const result = await supabase.from("lessons").update({ status }).eq("id", lessonId)
    .select("id,status").single();
  throwDatabaseError(result.error, "archive Content Studio lesson");
  const questionResult = await supabase.from("questions").update({ status: "DRAFT" }).eq("lesson_id", lessonId);
  throwDatabaseError(questionResult.error, "archive Content Studio questions");
  await writeAudit({ teacher: context.teacher, action: "CONTENT_ARCHIVED", entityId: lessonId });
  return result.data;
}
