import { readFile } from "node:fs/promises";

import { env } from "../../utils/env.js";
import { generateStructuredJson } from "../ai/aiGateway.js";
import { supabase } from "../supabase.js";
import { throwDatabaseError } from "../student/studentContext.js";
import { gradeBandForLevel } from "../academic/academicCatalog.js";
import { buildDeterministicQuestions } from "./placementBank.js";
import {
  gradePlacement,
  normalizeGeneratedQuestions,
  radarSummary,
} from "./onboardingRules.js";

const promptUrl = new URL("../../../ai/prompts/placement_generator.md", import.meta.url);
const placementPrompt = await readFile(promptUrl, "utf8");

const MIN_QUESTIONS = 20;

function appError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function aiGenerationEnabled() {
  return Boolean(env.openAiApiKey) && env.aiAllowApprovedContentExport;
}

// Ẩn answer_index khi trả câu hỏi cho client đang làm bài.
function publicQuestion(question) {
  return {
    id: question.id,
    orderIndex: question.order_index,
    steamAxis: question.steam_axis,
    difficulty: question.difficulty,
    type: question.type || "mcq",
    body: question.body,
    imageUrl: question.image_url,
    options: question.options,
  };
}

async function buildQuestions(gradeLevel, gradeBand, orgId, userId) {
  if (aiGenerationEnabled()) {
    try {
      const { data, model } = await generateStructuredJson({
        feature: "placement_generation",
        tier: 2,
        model: env.openAiModels.contentHigh,
        instructions: placementPrompt,
        input: `Khối lớp: ${gradeLevel}. Cấp học: ${gradeBand}. Soạn đúng 25 câu, mỗi lĩnh vực STEAM 5 câu.`,
        maxTokens: 4000,
        orgId,
        userId,
      });
      const normalized = normalizeGeneratedQuestions(data?.questions);
      if (normalized.length >= MIN_QUESTIONS) {
        return { questions: normalized, generatedBy: model };
      }
    } catch (error) {
      if (error.code === "AI_BUDGET_EXCEEDED") throw error;
      // lui về bộ tất định
    }
  }
  return {
    questions: buildDeterministicQuestions(gradeLevel, gradeBand),
    generatedBy: "deterministic-fallback",
  };
}

async function loadLatestTest(userId) {
  const result = await supabase
    .from("placement_tests")
    .select("id,user_id,grade_level,status,total_questions,total_correct,score_percent,track,steam_result,submitted_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  throwDatabaseError(result.error, "load latest placement test");
  return result.data;
}

async function loadTestQuestions(testId, { withAnswers = false } = {}) {
  const columns = withAnswers
    ? "id,order_index,steam_axis,difficulty,type,body,image_url,options,answer_index,accepted_answers,rubric"
    : "id,order_index,steam_axis,difficulty,type,body,image_url,options";
  const result = await supabase
    .from("placement_questions")
    .select(columns)
    .eq("placement_test_id", testId)
    .order("order_index", { ascending: true });
  throwDatabaseError(result.error, "load placement questions");
  return result.data || [];
}

function submittedResult(test) {
  const steam = test.steam_result || {};
  return {
    status: "submitted",
    testId: test.id,
    steam,
    scorePercent: Number(test.score_percent),
    totalCorrect: test.total_correct,
    totalQuestions: test.total_questions,
    track: test.track,
    radar: radarSummary(steam, { track: test.track }),
  };
}

// Trả về trạng thái placement hiện tại của học sinh.
export async function getPlacementState(profile) {
  const test = await loadLatestTest(profile.id);
  if (!test) return { status: "not_started" };
  if (test.status === "submitted") return submittedResult(test);
  const questions = await loadTestQuestions(test.id);
  return {
    status: "in_progress",
    testId: test.id,
    gradeLevel: test.grade_level,
    questions: questions.map(publicQuestion),
  };
}

// Sinh (hoặc lấy lại) bài test đang làm. Idempotent: nếu đã có lượt in_progress
// thì trả lại chính nó, không sinh mới.
export async function generatePlacement(profile) {
  const gradeLevel = profile.grade_level;
  if (!Number.isInteger(gradeLevel) || gradeLevel < 1 || gradeLevel > 12) {
    throw appError("VALIDATION_ERROR", "Hồ sơ chưa có lớp hợp lệ để tạo bài test.");
  }

  const latest = await loadLatestTest(profile.id);
  if (latest?.status === "submitted") return submittedResult(latest);
  if (latest?.status === "in_progress") {
    const questions = await loadTestQuestions(latest.id);
    return {
      status: "in_progress",
      testId: latest.id,
      gradeLevel: latest.grade_level,
      questions: questions.map(publicQuestion),
    };
  }

  const gradeBand = gradeBandForLevel(gradeLevel);
  const { questions, generatedBy } = await buildQuestions(
    gradeLevel,
    gradeBand,
    profile.org_id,
    profile.id,
  );

  const testInsert = await supabase
    .from("placement_tests")
    .insert({
      user_id: profile.id,
      grade_level: gradeLevel,
      status: "in_progress",
      generated_by: generatedBy,
      total_questions: questions.length,
    })
    .select("id,grade_level")
    .single();
  throwDatabaseError(testInsert.error, "create placement test");
  const testId = testInsert.data.id;

  const rows = questions.map((question) => ({
    placement_test_id: testId,
    order_index: question.order_index,
    steam_axis: question.steam_axis,
    difficulty: question.difficulty,
    type: question.type || "mcq",
    body: question.body,
    image_url: question.image_url ?? null,
    options: question.options ?? null,
    answer_index: question.answer_index ?? null,
    rubric: question.rubric ?? null,
    accepted_answers: question.accepted_answers ?? null,
    explanation: question.explanation ?? null,
  }));
  const questionsInsert = await supabase
    .from("placement_questions")
    .insert(rows)
    .select("id,order_index,steam_axis,difficulty,type,body,image_url,options");
  throwDatabaseError(questionsInsert.error, "insert placement questions");

  const saved = (questionsInsert.data || [])
    .sort((a, b) => a.order_index - b.order_index);
  return {
    status: "in_progress",
    testId,
    gradeLevel,
    questions: saved.map(publicQuestion),
  };
}

// Nộp bài: chấm điểm -> ghi score_events(placement_test) (trigger cộng vào
// steam_profiles) -> gán lộ trình -> trả radar + nhận xét.
export async function submitPlacement(profile, payload = {}) {
  const testId = payload.testId;
  const answers = Array.isArray(payload.answers)
    ? payload.answers
      .filter((answer) => answer && answer.questionId != null)
      .map((answer) => ({
        questionId: answer.questionId,
        selectedIndex: answer.selectedIndex != null ? Number(answer.selectedIndex) : null,
        textAnswer: answer.textAnswer ?? null,
      }))
    : [];
  if (!testId) throw appError("VALIDATION_ERROR", "Thiếu mã bài test.");

  const test = await loadLatestTest(profile.id);
  if (!test || test.id !== testId) {
    throw appError("NOT_FOUND", "Không tìm thấy bài test đang làm.");
  }
  if (test.status === "submitted") return submittedResult(test);

  const questions = await loadTestQuestions(testId, { withAnswers: true });
  if (questions.length === 0) {
    throw appError("NOT_FOUND", "Bài test không có câu hỏi.");
  }

  const openQuestions = questions.filter(q => q.type === "open");
  const gradedAnswers = [...answers];

  if (openQuestions.length > 0 && aiGenerationEnabled()) {
    const essayPromptUrl = new URL("../../../ai/prompts/essay_grader.md", import.meta.url);
    const essayPrompt = await readFile(essayPromptUrl, "utf8");

    const gradingPromises = openQuestions.map(async (q) => {
      const ans = gradedAnswers.find(a => a.questionId === q.id);
      if (!ans || !ans.textAnswer) return;

      try {
        const { data } = await generateStructuredJson({
          feature: "essay_grading",
          tier: 1,
          model: env.openAiModels.contentHigh,
          instructions: essayPrompt,
          input: `Câu hỏi: ${q.body}\nBarem: ${q.rubric}\nTrả lời của học sinh: ${ans.textAnswer}`,
          maxTokens: 500,
          orgId: profile.org_id,
          userId: profile.id,
        });
        ans.scoreFraction = Number(data?.score) || 0;
        ans.formativeFeedback = data?.formative_feedback || null;
      } catch (err) {
        ans.scoreFraction = 0;
        ans.formativeFeedback = null;
      }
    });
    await Promise.all(gradingPromises);
  }

  const graded = gradePlacement(questions, gradedAnswers);

  const answerRows = graded.perQuestion.map((item) => {
    const ans = gradedAnswers.find(a => a.questionId === item.questionId) || {};
    return {
      placement_test_id: testId,
      question_id: item.questionId,
      selected_index: Number.isInteger(item.selectedIndex) ? item.selectedIndex : null,
      text_answer: ans.textAnswer ?? null,
      score_fraction: item.scoreFraction ?? 0,
      formative_feedback: ans.formativeFeedback ?? null,
      is_correct: item.isCorrect,
    };
  });
  const answersInsert = await supabase
    .from("placement_answers")
    .upsert(answerRows, { onConflict: "placement_test_id,question_id" });
  throwDatabaseError(answersInsert.error, "save placement answers");

  // Một score_event chứa cả 5 trục (đều >= 0). Trigger apply_score_event cộng
  // vào steam_profiles — nguồn sự thật của hồ sơ năng lực.
  const scoreEvent = await supabase.from("score_events").insert({
    user_id: profile.id,
    source_type: "placement_test",
    source_id: testId,
    delta_vector: graded.steam,
  });
  throwDatabaseError(scoreEvent.error, "write placement score event");

  const testUpdate = await supabase
    .from("placement_tests")
    .update({
      status: "submitted",
      total_correct: graded.totalCorrect,
      score_percent: graded.scorePercent,
      track: graded.track,
      steam_result: graded.steam,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", testId);
  throwDatabaseError(testUpdate.error, "finalize placement test");

  const profileUpdate = await supabase
    .from("profiles")
    .update({
      learning_track: graded.track,
      placement_completed_at: new Date().toISOString(),
    })
    .eq("id", profile.id);
  throwDatabaseError(profileUpdate.error, "set learning track");

  return {
    status: "submitted",
    testId,
    steam: graded.steam,
    scorePercent: graded.scorePercent,
    totalCorrect: graded.totalCorrect,
    totalQuestions: graded.totalQuestions,
    track: graded.track,
    radar: radarSummary(graded.steam, { track: graded.track }),
    feedbacks: answerRows.map(r => r.formative_feedback).filter(Boolean),
  };
}
