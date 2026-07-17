import crypto from "node:crypto";

const STATUS_BY_CODE = {
  DEMO_DATA_MISSING: 503,
  DATABASE_ERROR: 502,
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
