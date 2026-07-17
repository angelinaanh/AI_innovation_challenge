import { env } from "../../utils/env.js";
import { supabase } from "../supabase.js";
import { throwDatabaseError } from "../student/studentContext.js";
import { getOpenAiClient } from "./openaiClient.js";

const MODEL_PRICING_PER_MILLION = Object.freeze({
  "gpt-5.6-luna": { input: 1, output: 6 },
  "gpt-5.6-terra": { input: 2.5, output: 15 },
  "gpt-5.6-sol": { input: 5, output: 30 },
  "text-embedding-3-small": { input: 0.02, output: 0 },
  "omni-moderation-latest": { input: 0, output: 0 },
});

function appError(code, message, cause) {
  const error = new Error(message);
  error.code = code;
  error.cause = cause;
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

function estimateCost(model, tokensIn = 0, tokensOut = 0) {
  const pricing = MODEL_PRICING_PER_MILLION[model];
  if (!pricing) return 0;
  return ((tokensIn * pricing.input) + (tokensOut * pricing.output)) / 1_000_000;
}

async function loadOrCreateBudget(orgId) {
  const date = vietnamDate();
  const result = await supabase
    .from("daily_cost_budgets")
    .select("org_id,date,budget_usd,spent_usd,circuit_tripped")
    .eq("org_id", orgId)
    .eq("date", date)
    .maybeSingle();
  throwDatabaseError(result.error, "load AI daily budget");

  if (result.data) return result.data;

  const createResult = await supabase
    .from("daily_cost_budgets")
    .insert({
      org_id: orgId,
      date,
      budget_usd: env.aiDailyBudgetUsd,
    })
    .select("org_id,date,budget_usd,spent_usd,circuit_tripped")
    .single();
  throwDatabaseError(createResult.error, "create AI daily budget");
  return createResult.data;
}

export async function assertTutorAllowance({ orgId, userId }) {
  const budget = await loadOrCreateBudget(orgId);
  if (budget.circuit_tripped || Number(budget.spent_usd) >= Number(budget.budget_usd)) {
    throw appError(
      "AI_BUDGET_EXCEEDED",
      "AI Tutor đã đạt ngân sách hôm nay. Bạn có thể gửi câu hỏi cho giáo viên.",
    );
  }

  const today = vietnamDate();
  const usageResult = await supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature", "tutor_safety_input")
    .gte("created_at", `${today}T00:00:00+07:00`);
  throwDatabaseError(usageResult.error, "check Tutor daily limit");

  if (Number(usageResult.count || 0) >= env.aiTutorDailyLimitPerStudent) {
    throw appError(
      "AI_DAILY_LIMIT_REACHED",
      "Bạn đã dùng hết lượt AI Tutor hôm nay. Hãy gửi câu hỏi cho giáo viên.",
    );
  }
  return budget;
}

export async function recordAiUsage({
  orgId,
  userId,
  feature,
  model,
  tier,
  tokensIn = 0,
  tokensOut = 0,
  cacheHit = false,
}) {
  const costUsd = estimateCost(model, tokensIn, tokensOut);
  const usageResult = await supabase.from("ai_usage").insert({
    org_id: orgId,
    feature,
    model,
    tier,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    cost_usd: costUsd,
    cache_hit: cacheHit,
    user_id: userId,
  });
  throwDatabaseError(usageResult.error, "record AI usage");

  const budget = await loadOrCreateBudget(orgId);
  const spentUsd = Number(budget.spent_usd || 0) + costUsd;
  const budgetResult = await supabase
    .from("daily_cost_budgets")
    .update({
      spent_usd: spentUsd,
      circuit_tripped: spentUsd >= Number(budget.budget_usd),
    })
    .eq("org_id", orgId)
    .eq("date", budget.date);
  throwDatabaseError(budgetResult.error, "update AI daily budget");

  return { costUsd, circuitTripped: spentUsd >= Number(budget.budget_usd) };
}

export async function moderateText(text, { orgId, userId, feature }) {
  try {
    const response = await getOpenAiClient().moderations.create({
      model: env.openAiModels.moderation,
      input: text,
    });
    await recordAiUsage({
      orgId,
      userId,
      feature,
      model: env.openAiModels.moderation,
      tier: 2,
    });
    const result = response.results[0];
    return {
      flagged: Boolean(result?.flagged),
      categories: result?.categories || {},
    };
  } catch (error) {
    if (["AI_UNAVAILABLE", "DATABASE_ERROR"].includes(error.code)) throw error;
    throw appError(
      "AI_PROVIDER_ERROR",
      "Không thể kiểm tra an toàn cho nội dung lúc này.",
      error,
    );
  }
}

export async function createEmbeddings({ texts, orgId, userId }) {
  try {
    const response = await getOpenAiClient().embeddings.create({
      model: env.openAiModels.embedding,
      input: texts,
      encoding_format: "float",
    });
    const tokensIn = Number(response.usage?.prompt_tokens || 0);
    await recordAiUsage({
      orgId,
      userId,
      feature: "tutor_retrieval",
      model: env.openAiModels.embedding,
      tier: 2,
      tokensIn,
    });
    return response.data.map((item) => item.embedding);
  } catch (error) {
    if (["AI_UNAVAILABLE", "DATABASE_ERROR"].includes(error.code)) throw error;
    throw appError(
      "AI_PROVIDER_ERROR",
      "Không thể truy hồi nguồn bài học lúc này.",
      error,
    );
  }
}

export async function generateTutorAnswer({ instructions, input, orgId, userId }) {
  try {
    const response = await getOpenAiClient().responses.create({
      model: env.openAiModels.tutor,
      instructions,
      input,
      reasoning: { effort: "low" },
      max_output_tokens: 500,
      store: false,
    });
    const tokensIn = Number(response.usage?.input_tokens || 0);
    const tokensOut = Number(response.usage?.output_tokens || 0);
    await recordAiUsage({
      orgId,
      userId,
      feature: "tutor",
      model: env.openAiModels.tutor,
      tier: 2,
      tokensIn,
      tokensOut,
    });
    return {
      text: response.output_text?.trim() || "",
      model: env.openAiModels.tutor,
      tokensIn,
      tokensOut,
    };
  } catch (error) {
    if (["AI_UNAVAILABLE", "DATABASE_ERROR"].includes(error.code)) throw error;
    throw appError(
      "AI_PROVIDER_ERROR",
      "AI Tutor đang bận. Bạn có thể thử lại hoặc gửi câu hỏi cho giáo viên.",
      error,
    );
  }
}
