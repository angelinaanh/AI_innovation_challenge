import { readFile } from "node:fs/promises";

import { env } from "../../utils/env.js";
import {
  assertTutorAllowance,
  generateTutorAnswer,
  moderateText,
  recordAiUsage,
} from "../ai/aiGateway.js";
import { getPublishedLesson } from "../learning/learningService.js";
import { emitTutorEscalated } from "../realtime/realtimeHub.js";
import { supabase } from "../supabase.js";
import { resolveStudentId, throwDatabaseError } from "../student/studentContext.js";
import {
  getApprovedCitationMap,
  retrieveApprovedKnowledge,
} from "./tutorKnowledgeService.js";
import {
  isAnswerSeeking,
  isPromptOverrideAttempt,
  normalizeText,
  splitAnswerForStreaming,
} from "./tutorRules.js";

const promptUrl = new URL("../../../ai/prompts/tutor_socratic.md", import.meta.url);
const refusalUrl = new URL("../../../ai/prompts/refusal.md", import.meta.url);
const [tutorPrompt, refusalCopy] = await Promise.all([
  readFile(promptUrl, "utf8"),
  readFile(refusalUrl, "utf8").then((content) => content.split("\n").slice(2).join("\n").trim()),
]);

const SAFETY_COPY = "Mình chưa thể trả lời nội dung này trong Tutor. Mình đã đánh dấu để giáo viên có thể hỗ trợ bạn an toàn và phù hợp hơn.";

function appError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function validateMessage(message) {
  const normalized = String(message || "").trim();
  if (normalized.length < 2 || normalized.length > 600) {
    throw appError("VALIDATION_ERROR", "Câu hỏi cần có từ 2 đến 600 ký tự.");
  }
  return normalized;
}

async function loadStudentProfile(studentId) {
  const result = await supabase
    .from("profiles")
    .select("id,org_id,full_name")
    .eq("id", studentId)
    .eq("role", "student")
    .single();
  throwDatabaseError(result.error, "load Tutor student profile");
  return result.data;
}

async function loadOwnedSession(studentId, sessionId) {
  const result = await supabase
    .from("tutor_sessions")
    .select("id,user_id,skill_node_id,created_at")
    .eq("id", sessionId)
    .eq("user_id", studentId)
    .maybeSingle();
  throwDatabaseError(result.error, "load Tutor session");
  if (!result.data) {
    throw appError("TUTOR_SESSION_NOT_FOUND", "Không tìm thấy phiên AI Tutor này.");
  }
  return result.data;
}

async function loadMessages(sessionId) {
  const result = await supabase
    .from("tutor_messages")
    .select("id,role,content,retrieved_chunk_ids,tokens_in,tokens_out,created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(40);
  throwDatabaseError(result.error, "load Tutor messages");
  return result.data || [];
}

async function saveMessage({ sessionId, role, content, chunkIds = null, usage = {} }) {
  const result = await supabase
    .from("tutor_messages")
    .insert({
      session_id: sessionId,
      role,
      content,
      retrieved_chunk_ids: chunkIds,
      tokens_in: usage.tokensIn || null,
      tokens_out: usage.tokensOut || null,
    })
    .select("id,role,content,retrieved_chunk_ids,created_at")
    .single();
  throwDatabaseError(result.error, "save Tutor message");
  return result.data;
}

async function createEscalation({ session, messageId, studentId, reason }) {
  const existingResult = await supabase
    .from("tutor_escalations")
    .select("id,status,assigned_teacher_id")
    .eq("message_id", messageId)
    .maybeSingle();
  throwDatabaseError(existingResult.error, "check existing Tutor escalation");
  if (existingResult.data) return existingResult.data;

  const profile = await loadStudentProfile(studentId);
  const teacherResult = await supabase
    .from("profiles")
    .select("id")
    .eq("org_id", profile.org_id)
    .eq("role", "teacher")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  throwDatabaseError(teacherResult.error, "assign Tutor escalation teacher");

  const escalationResult = await supabase
    .from("tutor_escalations")
    .insert({
      session_id: session.id,
      message_id: messageId,
      status: "pending",
      assigned_teacher_id: teacherResult.data?.id || null,
    })
    .select("id,status,assigned_teacher_id")
    .single();
  throwDatabaseError(escalationResult.error, "create Tutor escalation");

  emitTutorEscalated({
    escalationId: escalationResult.data.id,
    studentId,
    skillNodeId: session.skill_node_id,
    assignedTeacherId: escalationResult.data.assigned_teacher_id,
    reason,
  });
  return escalationResult.data;
}

function findCachedAnswer(question, messages) {
  const normalized = normalizeText(question);
  for (let index = messages.length - 2; index >= 0; index -= 1) {
    const studentMessage = messages[index];
    const assistantMessage = messages[index + 1];
    if (
      studentMessage.role === "student"
      && assistantMessage?.role === "assistant"
      && normalizeText(studentMessage.content) === normalized
    ) {
      return assistantMessage;
    }
  }
  return null;
}

async function emitAnswer({ answer, messageId, studentMessageId, mode, confidence, citations, emit, cached }) {
  for (const delta of splitAnswerForStreaming(answer)) {
    emit("token", { delta });
    await new Promise((resolve) => setTimeout(resolve, 18));
  }
  for (const citation of citations) {
    emit("citation", citation);
  }
  emit("done", {
    messageId,
    studentMessageId,
    mode,
    confidence,
    cached,
    escalationRecommended: false,
  });
}

async function emitRefusal({ content, session, studentMessage, emit, mode, autoEscalate = false }) {
  const assistantMessage = await saveMessage({
    sessionId: session.id,
    role: "assistant",
    content,
  });
  let escalation = null;
  if (autoEscalate) {
    escalation = await createEscalation({
      session,
      messageId: studentMessage.id,
      studentId: session.user_id,
      reason: mode,
    });
  }
  emit("refusal", {
    messageId: assistantMessage.id,
    studentMessageId: studentMessage.id,
    content,
    mode,
    escalationRecommended: !autoEscalate,
    escalationId: escalation?.id || null,
  });
  emit("done", {
    messageId: assistantMessage.id,
    studentMessageId: studentMessage.id,
    mode,
    confidence: 0,
    cached: false,
    escalationRecommended: !autoEscalate,
    escalationId: escalation?.id || null,
  });
}

export async function createOrResumeTutorSession(requestedStudentId, skillNodeId) {
  if (!skillNodeId) {
    throw appError("VALIDATION_ERROR", "skillNodeId là bắt buộc.");
  }
  const studentId = await resolveStudentId(requestedStudentId);
  const lesson = await getPublishedLesson(studentId, skillNodeId);
  const existingResult = await supabase
    .from("tutor_sessions")
    .select("id,user_id,skill_node_id,created_at")
    .eq("user_id", studentId)
    .eq("skill_node_id", skillNodeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  throwDatabaseError(existingResult.error, "resume Tutor session");

  let session = existingResult.data;
  if (!session) {
    const createResult = await supabase
      .from("tutor_sessions")
      .insert({ user_id: studentId, skill_node_id: skillNodeId })
      .select("id,user_id,skill_node_id,created_at")
      .single();
    throwDatabaseError(createResult.error, "create Tutor session");
    session = createResult.data;
  }

  const [messages, citationMap] = await Promise.all([
    loadMessages(session.id),
    getApprovedCitationMap(skillNodeId),
  ]);
  const studentMessageIds = messages
    .filter((message) => message.role === "student")
    .map((message) => message.id);
  let escalationByMessageId = new Map();
  if (studentMessageIds.length > 0) {
    const escalationResult = await supabase
      .from("tutor_escalations")
      .select("id,message_id,status")
      .in("message_id", studentMessageIds);
    throwDatabaseError(escalationResult.error, "load Tutor session escalations");
    escalationByMessageId = new Map(
      (escalationResult.data || []).map((item) => [item.message_id, item]),
    );
  }
  return {
    session,
    skillNode: lesson.skillNode,
    trust: {
      label: "AI Tutor dùng nội dung đã được giáo viên duyệt",
      citationsRequired: true,
      scope: "current_skill_node",
    },
    messages: messages.map((message, index) => {
      const citations = (message.retrieved_chunk_ids || [])
        .map((id) => citationMap.get(id))
        .filter(Boolean);
      const priorStudentMessage = message.role === "assistant"
        && messages[index - 1]?.role === "student"
        ? messages[index - 1]
        : null;
      const escalation = priorStudentMessage
        ? escalationByMessageId.get(priorStudentMessage.id)
        : null;
      return {
        ...message,
        citations,
        studentMessageId: priorStudentMessage?.id || null,
        escalationRecommended: Boolean(priorStudentMessage && citations.length === 0 && !escalation),
        escalated: Boolean(escalation),
      };
    }),
  };
}

export async function streamTutorMessage({ requestedStudentId, sessionId, rawMessage, emit }) {
  const question = validateMessage(rawMessage);
  const studentId = await resolveStudentId(requestedStudentId);
  const [session, profile] = await Promise.all([
    loadOwnedSession(studentId, sessionId),
    loadStudentProfile(studentId),
  ]);
  await getPublishedLesson(studentId, session.skill_node_id);
  const previousMessages = await loadMessages(session.id);
  const studentMessage = await saveMessage({
    sessionId: session.id,
    role: "student",
    content: question,
  });

  try {
    await assertTutorAllowance({ orgId: profile.org_id, userId: studentId });
  } catch (error) {
    if (["AI_BUDGET_EXCEEDED", "AI_DAILY_LIMIT_REACHED"].includes(error.code)) {
      await emitRefusal({
        content: error.message,
        session,
        studentMessage,
        emit,
        mode: "limit",
      });
      return;
    }
    throw error;
  }

  if (isPromptOverrideAttempt(question)) {
    await emitRefusal({
      content: "Mình không thể thay đổi hoặc tiết lộ quy tắc an toàn của Tutor. Hãy hỏi một câu liên quan trực tiếp đến bài học này nhé.",
      session,
      studentMessage,
      emit,
      mode: "prompt_override",
    });
    return;
  }

  const cached = findCachedAnswer(question, previousMessages);
  if (cached) {
    const citationMap = await getApprovedCitationMap(session.skill_node_id);
    const citations = (cached.retrieved_chunk_ids || [])
      .map((id) => citationMap.get(id))
      .filter(Boolean);
    const assistantMessage = await saveMessage({
      sessionId: session.id,
      role: "assistant",
      content: cached.content,
      chunkIds: cached.retrieved_chunk_ids,
    });
    await recordAiUsage({
      orgId: profile.org_id,
      userId: studentId,
      feature: "tutor",
      model: env.openAiModels.tutor,
      tier: 1,
      cacheHit: true,
    });
    await emitAnswer({
      answer: cached.content,
      messageId: assistantMessage.id,
      studentMessageId: studentMessage.id,
      mode: "grounded",
      confidence: 1,
      citations,
      emit,
      cached: true,
    });
    return;
  }

  let retrieval;
  try {
    retrieval = await retrieveApprovedKnowledge({
      question,
      skillNodeId: session.skill_node_id,
      orgId: profile.org_id,
      userId: studentId,
    });
  } catch (error) {
    if (["AI_PROVIDER_ERROR", "AI_UNAVAILABLE"].includes(error.code)) {
      await emitRefusal({
        content: error.message,
        session,
        studentMessage,
        emit,
        mode: "provider_unavailable",
      });
      return;
    }
    throw error;
  }
  if (!retrieval.grounded) {
    await emitRefusal({
      content: refusalCopy,
      session,
      studentMessage,
      emit,
      mode: "out_of_scope",
    });
    return;
  }

  if (!env.aiAllowApprovedContentExport) {
    await emitRefusal({
      content: "Mình đã tìm thấy nguồn phù hợp, nhưng kết nối nội dung bài học với nhà cung cấp AI chưa được quản trị viên cho phép. Bạn có thể gửi câu hỏi cho giáo viên.",
      session,
      studentMessage,
      emit,
      mode: "external_transfer_disabled",
    });
    return;
  }

  let inputSafety;
  try {
    inputSafety = await moderateText(question, {
      orgId: profile.org_id,
      userId: studentId,
      feature: "tutor_safety_input",
    });
  } catch {
    await emitRefusal({
      content: "Mình chưa thể kiểm tra an toàn cho câu hỏi lúc này. Bạn có thể gửi câu hỏi cho giáo viên.",
      session,
      studentMessage,
      emit,
      mode: "safety_unavailable",
    });
    return;
  }
  if (inputSafety.flagged) {
    await emitRefusal({
      content: SAFETY_COPY,
      session,
      studentMessage,
      emit,
      mode: "safety",
      autoEscalate: true,
    });
    return;
  }

  const mode = isAnswerSeeking(question) ? "socratic" : "grounded";
  const recentHistory = previousMessages.slice(-6)
    .map((message) => `${message.role === "student" ? "Học sinh" : "Tutor"}: ${message.content}`)
    .join("\n");
  const approvedContext = retrieval.sources
    .map((source, index) => `[Nguồn ${index + 1}: ${source.title}]\n${source.content}`)
    .join("\n\n");
  const modelInput = [
    `Chế độ: ${mode}`,
    recentHistory ? `Hội thoại gần đây:\n${recentHistory}` : "",
    `Nguồn đã duyệt:\n${approvedContext}`,
    `Câu hỏi hiện tại:\n${question}`,
  ].filter(Boolean).join("\n\n");

  let generated;
  try {
    generated = await generateTutorAnswer({
      instructions: tutorPrompt,
      input: modelInput,
      orgId: profile.org_id,
      userId: studentId,
    });
  } catch (error) {
    if (["AI_PROVIDER_ERROR", "AI_UNAVAILABLE"].includes(error.code)) {
      await emitRefusal({
        content: error.message,
        session,
        studentMessage,
        emit,
        mode: "provider_unavailable",
      });
      return;
    }
    throw error;
  }

  let outputSafety;
  try {
    outputSafety = await moderateText(generated.text, {
      orgId: profile.org_id,
      userId: studentId,
      feature: "tutor_safety_output",
    });
  } catch {
    await emitRefusal({
      content: "Mình chưa thể kiểm tra an toàn cho câu trả lời lúc này. Bạn có thể gửi câu hỏi cho giáo viên.",
      session,
      studentMessage,
      emit,
      mode: "safety_unavailable",
    });
    return;
  }
  if (outputSafety.flagged || !generated.text) {
    await emitRefusal({
      content: SAFETY_COPY,
      session,
      studentMessage,
      emit,
      mode: "safety",
      autoEscalate: true,
    });
    return;
  }

  const citations = retrieval.sources.map(({ content: _content, ...citation }) => citation);
  const assistantMessage = await saveMessage({
    sessionId: session.id,
    role: "assistant",
    content: generated.text,
    chunkIds: citations.map((citation) => citation.sourceChunkId),
    usage: generated,
  });
  await emitAnswer({
    answer: generated.text,
    messageId: assistantMessage.id,
    studentMessageId: studentMessage.id,
    mode,
    confidence: retrieval.confidence,
    citations,
    emit,
    cached: false,
  });
}

export async function escalateTutorMessage(requestedStudentId, messageId) {
  const studentId = await resolveStudentId(requestedStudentId);
  const messageResult = await supabase
    .from("tutor_messages")
    .select("id,session_id,role")
    .eq("id", messageId)
    .eq("role", "student")
    .maybeSingle();
  throwDatabaseError(messageResult.error, "load Tutor message for escalation");
  if (!messageResult.data) {
    throw appError("TUTOR_MESSAGE_NOT_FOUND", "Không tìm thấy câu hỏi cần gửi giáo viên.");
  }
  const session = await loadOwnedSession(studentId, messageResult.data.session_id);
  return createEscalation({
    session,
    messageId,
    studentId,
    reason: "student_requested",
  });
}

export async function listTutorEscalations(requestedTeacherId) {
  let teacherId = requestedTeacherId;
  if (!teacherId) {
    const teacherResult = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "teacher")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    throwDatabaseError(teacherResult.error, "resolve demo teacher");
    teacherId = teacherResult.data?.id;
  }
  if (!teacherId) throw appError("DEMO_DATA_MISSING", "Không tìm thấy giáo viên demo.");

  const escalationResult = await supabase
    .from("tutor_escalations")
    .select("id,session_id,message_id,status,assigned_teacher_id,resolution,resolved_at")
    .eq("assigned_teacher_id", teacherId)
    .order("id", { ascending: false })
    .limit(50);
  throwDatabaseError(escalationResult.error, "load teacher Tutor escalations");
  const escalations = escalationResult.data || [];
  if (escalations.length === 0) return [];

  const [sessionsResult, messagesResult] = await Promise.all([
    supabase.from("tutor_sessions").select("id,user_id,skill_node_id,created_at")
      .in("id", [...new Set(escalations.map((item) => item.session_id))]),
    supabase.from("tutor_messages").select("id,content,created_at")
      .in("id", escalations.map((item) => item.message_id)),
  ]);
  throwDatabaseError(sessionsResult.error, "load escalation sessions");
  throwDatabaseError(messagesResult.error, "load escalated messages");
  const sessions = sessionsResult.data || [];

  const [profilesResult, nodesResult] = await Promise.all([
    supabase.from("profiles").select("id,full_name")
      .in("id", [...new Set(sessions.map((session) => session.user_id))]),
    supabase.from("skill_nodes").select("id,name")
      .in("id", [...new Set(sessions.map((session) => session.skill_node_id))]),
  ]);
  throwDatabaseError(profilesResult.error, "load escalation students");
  throwDatabaseError(nodesResult.error, "load escalation Skill Nodes");

  const sessionById = new Map(sessions.map((item) => [item.id, item]));
  const messageById = new Map((messagesResult.data || []).map((item) => [item.id, item]));
  const profileById = new Map((profilesResult.data || []).map((item) => [item.id, item]));
  const nodeById = new Map((nodesResult.data || []).map((item) => [item.id, item]));
  return escalations.map((escalation) => {
    const session = sessionById.get(escalation.session_id);
    return {
      ...escalation,
      question: messageById.get(escalation.message_id)?.content || "",
      student: profileById.get(session?.user_id) || null,
      skillNode: nodeById.get(session?.skill_node_id) || null,
    };
  });
}
