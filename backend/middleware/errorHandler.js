import crypto from "node:crypto";

const STATUS_BY_CODE = {
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
