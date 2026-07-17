import crypto from "node:crypto";

import { supabase } from "../supabase.js";
import { getStudentPath } from "../student/studentDashboardService.js";
import { resolveStudentId, throwDatabaseError } from "../student/studentContext.js";
import {
  calculateMasteryDelta,
  calculateQuizReward,
  gradeMultipleChoice,
  validateAnswerIndex,
} from "./learningRules.js";

function appError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function vietnamDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function previousDate(dateString) {
  const date = new Date(`${dateString}T12:00:00+07:00`);
  date.setDate(date.getDate() - 1);
  return vietnamDate(date);
}

function relationValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

async function ensureAccessibleNode(studentId, skillNodeId) {
  const path = await getStudentPath(studentId);
  const node = path.nodes.find((item) => item.id === skillNodeId);
  if (!node) {
    throw appError("LESSON_NOT_FOUND", "Không tìm thấy Skill Node được yêu cầu.");
  }
  if (node.status === "locked") {
    throw appError("SKILL_NODE_LOCKED", node.lockedReason || "Skill Node này chưa được mở khóa.");
  }
  return node;
}

export async function getPublishedLesson(requestedStudentId, skillNodeId) {
  const studentId = await resolveStudentId(requestedStudentId);
  const pathNode = await ensureAccessibleNode(studentId, skillNodeId);

  const lessonResult = await supabase
    .from("lessons")
    .select("id,skill_node_id,status,difficulty,content,published_at,skill_nodes!inner(name,description,steam_weights)")
    .eq("skill_node_id", skillNodeId)
    .eq("status", "PUBLISHED")
    .order("difficulty", { ascending: false })
    .limit(1)
    .maybeSingle();
  throwDatabaseError(lessonResult.error, "load published lesson");

  if (!lessonResult.data) {
    throw appError("LESSON_NOT_FOUND", "Bài học chưa được giáo viên xuất bản.");
  }

  const questionsResult = await supabase
    .from("questions")
    .select("id,type,difficulty,body,options,steam_weights")
    .eq("lesson_id", lessonResult.data.id)
    .eq("status", "PUBLISHED")
    .order("created_at", { ascending: true });
  throwDatabaseError(questionsResult.error, "load published lesson questions");

  const skillNode = relationValue(lessonResult.data.skill_nodes) || {};
  return {
    studentId,
    pathStatus: pathNode.status,
    skillNode: {
      id: skillNodeId,
      name: skillNode.name || pathNode.name,
      description: skillNode.description || pathNode.description,
      steamWeights: skillNode.steam_weights || pathNode.steamWeights,
    },
    lesson: {
      id: lessonResult.data.id,
      difficulty: lessonResult.data.difficulty,
      content: lessonResult.data.content,
      publishedAt: lessonResult.data.published_at,
      approved: true,
    },
    questions: questionsResult.data || [],
  };
}

async function updateStreak(studentId) {
  const result = await supabase
    .from("streaks")
    .select("current_streak,longest_streak,last_active_date")
    .eq("user_id", studentId)
    .maybeSingle();
  throwDatabaseError(result.error, "load streak for quiz reward");

  const today = vietnamDate();
  const current = result.data || {
    current_streak: 0,
    longest_streak: 0,
    last_active_date: null,
  };
  if (current.last_active_date === today) return current;

  const nextCurrent = current.last_active_date === previousDate(today)
    ? current.current_streak + 1
    : 1;
  const next = {
    user_id: studentId,
    current_streak: nextCurrent,
    longest_streak: Math.max(current.longest_streak, nextCurrent),
    last_active_date: today,
  };
  const updateResult = await supabase.from("streaks").upsert(next);
  throwDatabaseError(updateResult.error, "update streak after quiz");
  return next;
}

async function awardFirstCorrectAttempt({ studentId, question, attemptId, usedHint }) {
  const expResult = await supabase
    .from("exp_totals")
    .select("total_exp,level")
    .eq("user_id", studentId)
    .maybeSingle();
  throwDatabaseError(expResult.error, "load EXP total for quiz reward");

  const reward = calculateQuizReward({
    usedHint,
    currentTotalExp: expResult.data?.total_exp || 0,
  });
  const steamDelta = calculateMasteryDelta(question.steam_weights);

  const scoreResult = await supabase.from("score_events").insert({
    user_id: studentId,
    source_type: "quiz",
    source_id: attemptId,
    delta_vector: steamDelta,
    reason_skill_node_id: question.skill_node_id,
  });
  throwDatabaseError(scoreResult.error, "record quiz STEAM event");

  const expEventResult = await supabase.from("exp_events").insert({
    user_id: studentId,
    action_type: "quiz_mastery_reward",
    amount: reward.xp,
  });
  throwDatabaseError(expEventResult.error, "record quiz EXP event");

  const expTotalResult = await supabase.from("exp_totals").upsert({
    user_id: studentId,
    total_exp: reward.totalExp,
    level: reward.level,
  });
  throwDatabaseError(expTotalResult.error, "update EXP total after quiz");
  await updateStreak(studentId);

  return { ...reward, steamDelta };
}

export async function submitQuizAttempt(requestedStudentId, payload) {
  const studentId = await resolveStudentId(requestedStudentId);
  const questionId = payload?.questionId;
  const answerIndex = payload?.answerIndex;
  const usedHint = payload?.usedHint === true;
  const rawDurationMs = Number(payload?.durationMs ?? 0);
  const durationMs = Number.isFinite(rawDurationMs)
    ? Math.max(0, Math.min(rawDurationMs, 3600000))
    : 0;

  if (!questionId) {
    throw appError("VALIDATION_ERROR", "questionId là bắt buộc.");
  }

  const questionResult = await supabase
    .from("questions")
    .select("id,lesson_id,skill_node_id,type,options,answer_key,steam_weights,status,lessons!inner(status)")
    .eq("id", questionId)
    .eq("status", "PUBLISHED")
    .eq("lessons.status", "PUBLISHED")
    .maybeSingle();
  throwDatabaseError(questionResult.error, "load question for grading");
  const question = questionResult.data;

  if (!question || question.type !== "mcq") {
    throw appError("QUESTION_NOT_AVAILABLE", "Câu hỏi không tồn tại hoặc chưa được xuất bản.");
  }
  if (!validateAnswerIndex(answerIndex, question.options)) {
    throw appError("VALIDATION_ERROR", "Đáp án được chọn không hợp lệ.");
  }
  await ensureAccessibleNode(studentId, question.skill_node_id);

  const priorResult = await supabase
    .from("attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", studentId)
    .eq("question_id", questionId)
    .eq("is_correct", true);
  throwDatabaseError(priorResult.error, "check previous correct attempt");

  const isCorrect = gradeMultipleChoice(answerIndex, question.answer_key);
  const firstCorrect = isCorrect && Number(priorResult.count || 0) === 0;
  const attemptId = crypto.randomUUID();
  const attemptResult = await supabase
    .from("attempts")
    .insert({
      id: attemptId,
      user_id: studentId,
      question_id: questionId,
      is_correct: isCorrect,
      used_hint: usedHint,
      duration_ms: durationMs,
    })
    .select("id,created_at")
    .single();
  throwDatabaseError(attemptResult.error, "record quiz attempt");

  let award = null;
  let pathUpdate = null;
  if (firstCorrect) {
    award = await awardFirstCorrectAttempt({
      studentId,
      question,
      attemptId,
      usedHint,
    });
    pathUpdate = await getStudentPath(studentId);
  }

  return {
    attemptId,
    isCorrect,
    firstCorrect,
    canRetry: !isCorrect,
    feedback: isCorrect
      ? question.answer_key?.explanation || "Chính xác! Bạn đã vận dụng đúng khái niệm."
      : "Chưa đúng. Hãy so sánh khối lặp hữu hạn với khối lặp mãi mãi rồi thử lại.",
    award,
    pathUpdate: pathUpdate
      ? {
          completedCount: pathUpdate.completedCount,
          recommendation: pathUpdate.recommendation,
          scores: pathUpdate.scores,
        }
      : null,
  };
}
