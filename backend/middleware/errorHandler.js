import crypto from "node:crypto";

const STATUS_BY_CODE = {
  AUTH_REQUIRED: 401,
  AUTH_INVALID: 401,
  AUTH_FORBIDDEN: 403,
  AUTH_PROVIDER_ERROR: 502,
  PROFILE_REQUIRED: 409,
  PROFILE_ONBOARDING_REQUIRED: 409,
  GUARDIAN_CONSENT_REQUIRED: 403,
  ACCOUNT_INACTIVE: 403,
  DEMO_DATA_MISSING: 503,
  DATABASE_ERROR: 502,
  LESSON_NOT_FOUND: 404,
  QUESTION_NOT_AVAILABLE: 404,
  SKILL_NODE_LOCKED: 403,
  VALIDATION_ERROR: 400,
  TUTOR_SESSION_NOT_FOUND: 404,
  TUTOR_MESSAGE_NOT_FOUND: 404,
  AI_UNAVAILABLE: 503,
  AI_PROVIDER_ERROR: 502,
  AI_BUDGET_EXCEEDED: 429,
  AI_DAILY_LIMIT_REACHED: 429,
  EXERCISE_NO_SOURCE: 409,
  EXTERNAL_TRANSFER_DISABLED: 409,
  EXERCISE_GENERATION_FAILED: 502,
  EXERCISE_UNSAFE: 422,
  EXERCISE_NOT_FOUND: 404,
  EXERCISE_ALREADY_REVIEWED: 409,
  CLASS_NOT_FOUND: 404,
  STUDENT_NOT_FOUND: 404,
  ALREADY_MEMBER: 409,
  MEMBERSHIP_NOT_FOUND: 404,
  MEMBERSHIP_INVALID_STATE: 409,
  CLASS_CODE_COLLISION: 503,
  SUBJECT_INVALID: 400,
  GRADE_BAND_MISMATCH: 409,
};

export function notFound(request, response) {
  response.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "Không tìm thấy API được yêu cầu.",
      requestId: request.requestId,
    },
  });
}

export function errorHandler(error, request, response, _next) {
  const requestId = request.requestId || crypto.randomUUID();
  const status = STATUS_BY_CODE[error.code] || 500;

  console.error(JSON.stringify({
    level: "error",
    requestId,
    code: error.code || "INTERNAL_ERROR",
    message: error.message,
  }));

  response.status(status).json({
    error: {
      code: error.code || "INTERNAL_ERROR",
      message: status === 500
        ? "Hệ thống đang gặp sự cố. Vui lòng thử lại."
        : error.message,
      requestId,
    },
  });
}
