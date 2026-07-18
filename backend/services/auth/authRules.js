import {
  gradeBandForLevel,
  normalizeGradeLevel,
} from "../academic/academicCatalog.js";

const ACCOUNT_STATUSES = new Set([
  "PENDING",
  "ACTIVE",
  "AT_RISK",
  "SUSPENDED",
  "EXPIRED",
]);

function validationError(message) {
  const error = new Error(message);
  error.code = "VALIDATION_ERROR";
  return error;
}

function parseDateOfBirth(value) {
  const normalized = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw validationError("Ngày sinh không hợp lệ.");
  }
  const date = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== normalized) {
    throw validationError("Ngày sinh không hợp lệ.");
  }
  return { date, normalized };
}

export function ageOnDate(dateOfBirth, currentDate = new Date()) {
  const birthDate = dateOfBirth instanceof Date
    ? dateOfBirth
    : parseDateOfBirth(dateOfBirth).date;
  let age = currentDate.getUTCFullYear() - birthDate.getUTCFullYear();
  const beforeBirthday = currentDate.getUTCMonth() < birthDate.getUTCMonth()
    || (
      currentDate.getUTCMonth() === birthDate.getUTCMonth()
      && currentDate.getUTCDate() < birthDate.getUTCDate()
    );
  if (beforeBirthday) age -= 1;
  return age;
}

export function normalizeStudentOnboarding(user, payload = {}, currentDate = new Date()) {
  const metadata = user?.user_metadata || {};
  const fullName = String(
    payload.fullName ?? metadata.full_name ?? metadata.name ?? "",
  ).trim();
  const gradeLevel = normalizeGradeLevel(
    payload.gradeLevel ?? metadata.grade_level,
  );
  const dateOfBirthInput = payload.dateOfBirth ?? metadata.date_of_birth;
  const guardianEmail = String(
    payload.guardianEmail ?? metadata.guardian_email ?? "",
  ).trim().toLowerCase();

  if (fullName.length < 2 || fullName.length > 80) {
    throw validationError("Họ tên cần có từ 2 đến 80 ký tự.");
  }
  if (!gradeLevel) {
    throw validationError("Lớp học không hợp lệ. Vui lòng chọn từ lớp 1 đến lớp 12.");
  }

  const { date, normalized: dateOfBirth } = parseDateOfBirth(dateOfBirthInput);
  const age = ageOnDate(date, currentDate);
  if (age < 5 || age > 100) {
    throw validationError("Ngày sinh chưa phù hợp với tài khoản học sinh.");
  }

  const requiresGuardianConsent = age < 16;
  if (
    requiresGuardianConsent
    && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianEmail)
  ) {
    throw validationError("Email người giám hộ là bắt buộc với học sinh dưới 16 tuổi.");
  }

  return {
    fullName,
    gradeLevel,
    gradeBand: gradeBandForLevel(gradeLevel),
    dateOfBirth,
    guardianEmail: requiresGuardianConsent ? guardianEmail : null,
    age,
    requiresGuardianConsent,
    accountStatus: requiresGuardianConsent ? "PENDING" : "ACTIVE",
  };
}

export function normalizeTeacherOnboarding(user, payload = {}) {
  const metadata = user?.user_metadata || {};
  const fullName = String(
    payload.fullName ?? metadata.full_name ?? metadata.name ?? "",
  ).trim();
  if (fullName.length < 2 || fullName.length > 80) {
    throw validationError("Họ tên cần có từ 2 đến 80 ký tự.");
  }
  return { fullName, accountStatus: "ACTIVE" };
}

export function onboardingRole(user, payload = {}) {
  return payload.role === "teacher"
    || user?.user_metadata?.role === "teacher"
    || user?.app_metadata?.provisioned_role === "teacher"
    ? "teacher"
    : "student";
}

export function normalizeAccountStatus(value, fallback = "ACTIVE") {
  const normalized = String(value || "").toUpperCase();
  return ACCOUNT_STATUSES.has(normalized) ? normalized : fallback;
}

export function isLearningAccountActive(status) {
  return ["ACTIVE", "AT_RISK"].includes(normalizeAccountStatus(status));
}
