import { readFile } from "node:fs/promises";

import { env } from "../../utils/env.js";
import { generateStructuredJson } from "../ai/aiGateway.js";
import { supabase } from "../supabase.js";
import { throwDatabaseError } from "../student/studentContext.js";
import { gradeBandForLevel } from "../academic/academicCatalog.js";
import {
  advanceOnboardingChat,
  ONBOARDING_SLOTS,
  missingSlots,
  validateCollectedProfile,
} from "./onboardingRules.js";

const promptUrl = new URL("../../../ai/prompts/onboarding_assistant.md", import.meta.url);
const onboardingPrompt = await readFile(promptUrl, "utf8");

function appError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

// Gửi dữ liệu tự khai của học sinh (tên/tuổi) tới OpenAI chỉ khi tổ chức đã bật
// cổng cho phép — nếu chưa, dùng bộ hội thoại tất định (không rời máy chủ).
function aiChatEnabled() {
  return Boolean(env.openAiApiKey) && env.aiAllowApprovedContentExport;
}

// Chỉ giữ đúng các slot hợp lệ, ép kiểu về đúng định dạng mong đợi.
function sanitizeCollected(raw = {}) {
  const collected = {};
  for (const slot of ONBOARDING_SLOTS) {
    const value = raw[slot.key];
    if (value === undefined || value === null) continue;
    if (["age", "gradeLevel", "selfReportedGrade"].includes(slot.key)) {
      const number = Number(value);
      if (Number.isInteger(number)) collected[slot.key] = number;
    } else if (slot.key === "isEnrolled") {
      if (typeof value === "boolean") collected[slot.key] = value;
    } else {
      const text = String(value).trim();
      if (text || slot.key === "schoolName") collected[slot.key] = text;
    }
  }
  return collected;
}

async function aiChatStep({ profile, collected, lastUserMessage, messages }) {
  const input = [
    `Thông tin đã biết: ${JSON.stringify(collected)}`,
    `Lịch sử hội thoại: ${JSON.stringify((messages || []).slice(-12))}`,
    `Tin nhắn mới nhất của học sinh: ${lastUserMessage || "(chưa có)"}`,
  ].join("\n");
  const { data } = await generateStructuredJson({
    feature: "onboarding_chat",
    tier: 2,
    instructions: onboardingPrompt,
    input,
    maxTokens: 500,
    orgId: profile.org_id,
    userId: profile.id,
  });
  if (!data || typeof data.reply !== "string") {
    throw appError("AI_PROVIDER_ERROR", "AI onboarding trả về sai định dạng.");
  }
  const merged = sanitizeCollected({ ...collected, ...(data.data || data.collected || {}) });
  return {
    reply: data.reply,
    collected: merged,
    complete: missingSlots(merged).length === 0,
  };
}

// Một lượt hội thoại onboarding. Frontend gửi { messages, collected } và nhận
// lại { reply, collected, complete }. Server ưu tiên AI, lui về bộ tất định.
export async function onboardingChat(profile, payload = {}) {
  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const seedCollected = sanitizeCollected({
    fullName: profile.full_name || undefined,
    gradeLevel: profile.grade_level || undefined,
    ...(payload.collected || {}),
  });
  const lastUserMessage = [...messages].reverse()
    .find((message) => message?.role === "user")?.content || "";

  if (aiChatEnabled()) {
    try {
      return await aiChatStep({ profile, collected: seedCollected, lastUserMessage, messages });
    } catch (error) {
      if (error.code === "AI_BUDGET_EXCEEDED") throw error;
      // mọi lỗi khác -> lui về bộ hội thoại tất định
    }
  }

  const result = advanceOnboardingChat({ collected: seedCollected, lastUserMessage });
  return { reply: result.reply, collected: sanitizeCollected(result.collected), complete: result.complete };
}

// Lưu thông tin thu thập được vào hồ sơ và đánh dấu hoàn tất bước onboarding.
export async function completeOnboarding(profile, payload = {}) {
  const collected = sanitizeCollected(payload.collected || {});
  const validation = validateCollectedProfile(collected);
  if (!validation.valid) {
    throw appError("VALIDATION_ERROR", validation.errors.join(" "));
  }

  const gradeLevel = collected.gradeLevel;
  const update = {
    full_name: collected.fullName,
    grade_level: gradeLevel,
    grade_band: gradeBandForLevel(gradeLevel),
    self_reported_grade: collected.selfReportedGrade ?? null,
    school_name: collected.schoolName || null,
    is_enrolled: typeof collected.isEnrolled === "boolean" ? collected.isEnrolled : null,
    onboarding_completed_at: new Date().toISOString(),
  };

  const result = await supabase
    .from("profiles")
    .update(update)
    .eq("id", profile.id)
    .eq("role", "student")
    .select("id,full_name,grade_level,grade_band,self_reported_grade,school_name,is_enrolled,onboarding_completed_at")
    .single();
  throwDatabaseError(result.error, "save onboarding profile");

  return { profile: result.data };
}
