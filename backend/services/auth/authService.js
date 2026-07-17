import { supabase } from "../supabase.js";
import { throwDatabaseError } from "../student/studentContext.js";
import {
  isLearningAccountActive,
  normalizeAccountStatus,
  normalizeStudentOnboarding,
} from "./authRules.js";

const PROFILE_FIELDS = "id,org_id,email,full_name,role,grade_band,guardian_consent_at,created_at";

function appError(code, message, cause) {
  const error = new Error(message);
  error.code = code;
  error.cause = cause;
  return error;
}

async function loadProfile(userId) {
  const result = await supabase
    .from("profiles")
    .select(PROFILE_FIELDS)
    .eq("id", userId)
    .maybeSingle();
  throwDatabaseError(result.error, "load authenticated profile");
  return result.data || null;
}

export function accountFromIdentity(user, profile) {
  if (!profile) return null;
  let accountStatus = normalizeAccountStatus(
    user?.app_metadata?.account_status,
    "ACTIVE",
  );
  if (profile.guardian_consent_at && accountStatus === "PENDING") {
    accountStatus = "ACTIVE";
  }
  return {
    id: profile.id,
    orgId: profile.org_id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    gradeBand: profile.grade_band,
    guardianConsentAt: profile.guardian_consent_at,
    accountStatus,
    learningAccess: isLearningAccountActive(accountStatus),
  };
}

export async function authenticateAccessToken(accessToken) {
  if (!accessToken) {
    throw appError("AUTH_REQUIRED", "Bạn cần đăng nhập để tiếp tục.");
  }
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    throw appError("AUTH_INVALID", "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.", error);
  }
  const profile = await loadProfile(data.user.id);
  return {
    accessToken,
    user: data.user,
    profile,
    account: accountFromIdentity(data.user, profile),
  };
}

async function initializeStudentProjections(userId) {
  const results = await Promise.all([
    supabase.from("steam_profiles").upsert({ user_id: userId }, { onConflict: "user_id" }),
    supabase.from("exp_totals").upsert({ user_id: userId }, { onConflict: "user_id" }),
    supabase.from("streaks").upsert({ user_id: userId }, { onConflict: "user_id" }),
  ]);
  for (const [index, result] of results.entries()) {
    throwDatabaseError(result.error, `initialize student projection ${index + 1}`);
  }
}

export async function bootstrapStudentAccount(auth, payload) {
  if (auth.profile) return auth.account;

  const onboarding = normalizeStudentOnboarding(auth.user, payload);
  const appMetadata = {
    ...(auth.user.app_metadata || {}),
    account_status: onboarding.accountStatus,
    date_of_birth: onboarding.dateOfBirth,
    guardian_email: onboarding.guardianEmail,
    onboarding_version: 1,
  };
  const userMetadata = {
    ...(auth.user.user_metadata || {}),
    full_name: onboarding.fullName,
    grade_band: onboarding.gradeBand,
    guardian_email: null,
  };
  const updateResult = await supabase.auth.admin.updateUserById(auth.user.id, {
    app_metadata: appMetadata,
    user_metadata: userMetadata,
  });
  if (updateResult.error) {
    throw appError(
      "AUTH_PROVIDER_ERROR",
      "Không thể hoàn tất hồ sơ xác thực lúc này.",
      updateResult.error,
    );
  }

  const insertResult = await supabase
    .from("profiles")
    .insert({
      id: auth.user.id,
      email: auth.user.email,
      full_name: onboarding.fullName,
      role: "student",
      grade_band: onboarding.gradeBand,
    })
    .select(PROFILE_FIELDS)
    .single();

  let profile = insertResult.data;
  if (insertResult.error?.code === "23505") {
    profile = await loadProfile(auth.user.id);
  } else {
    throwDatabaseError(insertResult.error, "create student profile");
  }
  if (!profile) {
    throw appError("PROFILE_REQUIRED", "Không thể khởi tạo hồ sơ học sinh.");
  }

  await initializeStudentProjections(auth.user.id);
  return accountFromIdentity(updateResult.data.user, profile);
}
