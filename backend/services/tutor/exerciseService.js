import { readFile } from "node:fs/promises";

import { env } from "../../utils/env.js";
import {
  assertTutorAllowance,
  generateStructuredExercise,
  moderateText,
} from "../ai/aiGateway.js";
import { supabase } from "../supabase.js";
import { resolveStudentId, throwDatabaseError } from "../student/studentContext.js";
import { loadApprovedChunkRows } from "./tutorKnowledgeService.js";
import {
  gradeExercise,
  isExerciseType,
  nextLevel,
  PRACTICE_EFFORT_EXP,
  splitExercise,
  validateExercise,
} from "./exerciseRules.js";

const promptUrl = new URL("../../../ai/prompts/exercise_generator.md", import.meta.url);
const exercisePrompt = await readFile(promptUrl, "utf8");

const TYPE_LABEL = {
  mcq: "trắc nghiệm (mcq)",
  matching: "nối cột (matching)",
  ordering: "sắp thứ tự (ordering)",
  cloze: "điền khuyết (cloze)",
};

function appError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function exerciseText(item) {
  const parts = [item.prompt];
  if (item.type === "mcq") parts.push(...(item.options || []));
  if (item.type === "matching") {
    parts.push(...(item.left || []).map((entry) => entry.label));
    parts.push(...(item.right || []).map((entry) => entry.label));
  }
  if (item.type === "ordering") parts.push(...(item.items || []).map((entry) => entry.label));
  if (item.type === "cloze") {
    parts.push(item.text || "");
    parts.push(...(item.blanks || []).flatMap((blank) => blank.options || [blank.answer]));
  }
  parts.push(item.explanation || "");
  return parts.filter(Boolean).join(" \n");
}

async function loadStudentProfile(studentId) {
  const result = await supabase
    .from("profiles")
    .select("id,org_id,full_name")
    .eq("id", studentId)
    .eq("role", "student")
    .single();
  throwDatabaseError(result.error, "load exercise student profile");
  return result.data;
}

async function loadOwnedSession(studentId, sessionId) {
  const result = await supabase
    .from("tutor_sessions")
    .select("id,user_id,skill_node_id")
    .eq("id", sessionId)
    .eq("user_id", studentId)
    .maybeSingle();
  throwDatabaseError(result.error, "load exercise session");
  if (!result.data) throw appError("TUTOR_SESSION_NOT_FOUND", "Không tìm thấy phiên Tutor này.");
  return result.data;
}

export async function generateExercise({ requestedStudentId, sessionId, type }) {
  if (!isExerciseType(type)) {
    throw appError("VALIDATION_ERROR", "Loại bài luyện không được hỗ trợ.");
  }
  const studentId = await resolveStudentId(requestedStudentId);
  const [session, profile] = await Promise.all([
    loadOwnedSession(studentId, sessionId),
    loadStudentProfile(studentId),
  ]);

  const chunks = await loadApprovedChunkRows(session.skill_node_id);
  if (chunks.length === 0) {
    throw appError(
      "EXERCISE_NO_SOURCE",
      "Chưa có học liệu đã duyệt cho phần này nên chưa tạo được bài luyện.",
    );
  }

  if (!env.aiAllowApprovedContentExport) {
    throw appError(
      "EXTERNAL_TRANSFER_DISABLED",
      "Kết nối nội dung bài học với nhà cung cấp AI chưa được quản trị viên cho phép, nên chưa tạo được bài luyện.",
    );
  }

  await assertTutorAllowance({ orgId: profile.org_id, userId: studentId });

  const sources = chunks.slice(0, 4);
  const approvedContext = sources
    .map((source, index) => `[Nguồn ${index + 1}: ${source.title}]\n${source.content}`)
    .join("\n\n");
  const input = [
    `Loại bài luyện cần sinh: ${TYPE_LABEL[type]}`,
    `Nguồn đã duyệt:\n${approvedContext}`,
    "Chỉ trả về một object JSON đúng schema của loại này. Không kèm giải thích ngoài JSON.",
  ].join("\n\n");

  const generated = await generateStructuredExercise({
    instructions: exercisePrompt,
    input,
    orgId: profile.org_id,
    userId: studentId,
  });

  const item = generated.item;
  if (!item || item.type !== type) {
    throw appError("EXERCISE_GENERATION_FAILED", "AI chưa tạo được bài luyện phù hợp. Hãy thử lại.");
  }
  const invalid = validateExercise(item);
  if (invalid) throw appError("EXERCISE_GENERATION_FAILED", `AI chưa tạo được bài luyện hợp lệ (${invalid}).`);

  const safety = await moderateText(exerciseText(item), {
    orgId: profile.org_id,
    userId: studentId,
    feature: "tutor_exercise_safety",
  });
  if (safety.flagged) {
    throw appError("EXERCISE_UNSAFE", "Bài luyện vừa tạo chưa đạt kiểm duyệt an toàn. Hãy thử lại.");
  }

  const { payload, answerKey } = splitExercise(item);
  const insertResult = await supabase
    .from("tutor_exercises")
    .insert({
      session_id: session.id,
      skill_node_id: session.skill_node_id,
      type,
      prompt: item.prompt,
      payload,
      answer_key: answerKey,
      source_chunk_ids: sources.map((source) => source.id),
      generated_by: generated.model,
      status: "active",
    })
    .select("id,type,prompt,payload,created_at")
    .single();
  throwDatabaseError(insertResult.error, "save tutor exercise");

  return {
    id: insertResult.data.id,
    type: insertResult.data.type,
    prompt: insertResult.data.prompt,
    ...insertResult.data.payload,
    formative: true,
    createdAt: insertResult.data.created_at,
  };
}

async function loadOwnedExercise(studentId, exerciseId) {
  const result = await supabase
    .from("tutor_exercises")
    .select("id,type,answer_key,status,tutor_sessions!inner(user_id)")
    .eq("id", exerciseId)
    .eq("tutor_sessions.user_id", studentId)
    .maybeSingle();
  throwDatabaseError(result.error, "load owned exercise");
  if (!result.data) throw appError("EXERCISE_NOT_FOUND", "Không tìm thấy bài luyện này.");
  return result.data;
}

async function awardEffortExpOnce(studentId, exerciseId) {
  const priorResult = await supabase
    .from("tutor_exercise_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", studentId)
    .eq("exercise_id", exerciseId);
  throwDatabaseError(priorResult.error, "check prior exercise attempt");
  if (Number(priorResult.count || 0) > 0) return null;

  const expResult = await supabase
    .from("exp_totals")
    .select("total_exp,level")
    .eq("user_id", studentId)
    .maybeSingle();
  throwDatabaseError(expResult.error, "load EXP total for practice reward");

  const totalExp = Math.max(0, Number(expResult.data?.total_exp || 0)) + PRACTICE_EFFORT_EXP;
  const eventResult = await supabase.from("exp_events").insert({
    user_id: studentId,
    action_type: "tutor_practice",
    amount: PRACTICE_EFFORT_EXP,
  });
  throwDatabaseError(eventResult.error, "record practice EXP event");

  const totalResult = await supabase.from("exp_totals").upsert({
    user_id: studentId,
    total_exp: totalExp,
    level: nextLevel(totalExp),
  });
  throwDatabaseError(totalResult.error, "update EXP total after practice");
  return { xp: PRACTICE_EFFORT_EXP, totalExp, level: nextLevel(totalExp) };
}

export async function submitExercise({ requestedStudentId, exerciseId, response }) {
  if (!response || typeof response !== "object") {
    throw appError("VALIDATION_ERROR", "Thiếu câu trả lời.");
  }
  const studentId = await resolveStudentId(requestedStudentId);
  const exercise = await loadOwnedExercise(studentId, exerciseId);

  const graded = gradeExercise(exercise.type, exercise.answer_key, response);
  const award = await awardEffortExpOnce(studentId, exerciseId);

  const attemptResult = await supabase
    .from("tutor_exercise_attempts")
    .insert({
      exercise_id: exerciseId,
      user_id: studentId,
      response,
      is_correct: graded.isCorrect,
      score: Number(graded.score.toFixed(3)),
    })
    .select("id,created_at")
    .single();
  throwDatabaseError(attemptResult.error, "record exercise attempt");

  return {
    exerciseId,
    isCorrect: graded.isCorrect,
    score: graded.score,
    solution: graded.solution,
    explanation: exercise.answer_key.explanation || "",
    award,
    canPromote: graded.isCorrect,
  };
}

async function firstTeacherId(orgId) {
  const result = await supabase
    .from("profiles")
    .select("id")
    .eq("org_id", orgId)
    .eq("role", "teacher")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  throwDatabaseError(result.error, "resolve teacher for exercise promotion");
  return result.data?.id || null;
}

export async function promoteExercise({ requestedStudentId, exerciseId }) {
  const studentId = await resolveStudentId(requestedStudentId);
  const exercise = await loadOwnedExercise(studentId, exerciseId);
  if (exercise.status !== "active") {
    return { id: exerciseId, status: exercise.status, alreadySubmitted: true };
  }
  const profile = await loadStudentProfile(studentId);
  const teacherId = await firstTeacherId(profile.org_id);

  const updateResult = await supabase
    .from("tutor_exercises")
    .update({
      status: "promoted_pending",
      promoted_by: studentId,
      assigned_teacher_id: teacherId,
    })
    .eq("id", exerciseId)
    .eq("status", "active")
    .select("id,status")
    .single();
  throwDatabaseError(updateResult.error, "promote exercise to teacher");
  return updateResult.data;
}

// ---- Teacher side ----------------------------------------------------------

async function resolveTeacherId(requestedTeacherId) {
  if (requestedTeacherId) return requestedTeacherId;
  const result = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "teacher")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  throwDatabaseError(result.error, "resolve demo teacher for proposals");
  if (!result.data) throw appError("DEMO_DATA_MISSING", "Không tìm thấy giáo viên.");
  return result.data.id;
}

export async function listExerciseProposals(requestedTeacherId) {
  const teacherId = await resolveTeacherId(requestedTeacherId);
  const proposalsResult = await supabase
    .from("tutor_exercises")
    .select("id,type,prompt,payload,answer_key,skill_node_id,promoted_by,created_at")
    .eq("status", "promoted_pending")
    .eq("assigned_teacher_id", teacherId)
    .order("created_at", { ascending: true })
    .limit(50);
  throwDatabaseError(proposalsResult.error, "list exercise proposals");
  const proposals = proposalsResult.data || [];
  if (proposals.length === 0) return [];

  const [studentsResult, nodesResult] = await Promise.all([
    supabase.from("profiles").select("id,full_name")
      .in("id", [...new Set(proposals.map((item) => item.promoted_by).filter(Boolean))]),
    supabase.from("skill_nodes").select("id,name")
      .in("id", [...new Set(proposals.map((item) => item.skill_node_id))]),
  ]);
  throwDatabaseError(studentsResult.error, "load proposal students");
  throwDatabaseError(nodesResult.error, "load proposal skill nodes");
  const studentById = new Map((studentsResult.data || []).map((item) => [item.id, item]));
  const nodeById = new Map((nodesResult.data || []).map((item) => [item.id, item]));

  return proposals.map((item) => ({
    ...item,
    student: studentById.get(item.promoted_by) || null,
    skillNode: nodeById.get(item.skill_node_id) || null,
  }));
}

async function createDraftQuestionFromMcq(exercise, teacherId) {
  const nodeResult = await supabase
    .from("skill_nodes")
    .select("id,grade_band,steam_weights")
    .eq("id", exercise.skill_node_id)
    .single();
  throwDatabaseError(nodeResult.error, "load skill node for question draft");

  const insertResult = await supabase
    .from("questions")
    .insert({
      skill_node_id: exercise.skill_node_id,
      grade_band: nodeResult.data.grade_band,
      type: "mcq",
      difficulty: "medium",
      steam_weights: nodeResult.data.steam_weights || {},
      body: exercise.prompt,
      options: exercise.payload.options,
      answer_key: {
        index: exercise.answer_key.correctIndex,
        explanation: exercise.answer_key.explanation || "",
      },
      status: "DRAFT",
    })
    .select("id")
    .single();
  throwDatabaseError(insertResult.error, "create draft question from exercise");
  return insertResult.data.id;
}

export async function reviewExerciseProposal({ requestedTeacherId, exerciseId, decision }) {
  if (!["approve", "reject"].includes(decision)) {
    throw appError("VALIDATION_ERROR", "Quyết định không hợp lệ.");
  }
  const teacherId = await resolveTeacherId(requestedTeacherId);
  const exerciseResult = await supabase
    .from("tutor_exercises")
    .select("id,type,prompt,payload,answer_key,skill_node_id,status")
    .eq("id", exerciseId)
    .eq("assigned_teacher_id", teacherId)
    .maybeSingle();
  throwDatabaseError(exerciseResult.error, "load exercise for review");
  const exercise = exerciseResult.data;
  if (!exercise) throw appError("EXERCISE_NOT_FOUND", "Không tìm thấy đề xuất bài luyện.");
  if (exercise.status !== "promoted_pending") {
    throw appError("EXERCISE_ALREADY_REVIEWED", "Đề xuất này đã được xử lý.");
  }

  if (decision === "reject") {
    const rejectResult = await supabase
      .from("tutor_exercises")
      .update({ status: "rejected", reviewed_by: teacherId, reviewed_at: new Date().toISOString() })
      .eq("id", exerciseId)
      .select("id,status")
      .single();
    throwDatabaseError(rejectResult.error, "reject exercise proposal");
    return { ...rejectResult.data, resultingQuestionId: null };
  }

  // approve — for MCQ we can seed the real question bank as a DRAFT (F-605/M3).
  let resultingQuestionId = null;
  if (exercise.type === "mcq") {
    resultingQuestionId = await createDraftQuestionFromMcq(exercise, teacherId);
  }
  const approveResult = await supabase
    .from("tutor_exercises")
    .update({
      status: "promoted_approved",
      reviewed_by: teacherId,
      reviewed_at: new Date().toISOString(),
      resulting_question_id: resultingQuestionId,
    })
    .eq("id", exerciseId)
    .select("id,status")
    .single();
  throwDatabaseError(approveResult.error, "approve exercise proposal");
  return { ...approveResult.data, resultingQuestionId };
}
