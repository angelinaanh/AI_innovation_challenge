import rateLimit from "express-rate-limit";

// Giới hạn tần suất cho các route AI đắt tiền (sinh dàn ý / bài giảng). Khoá
// theo user (các route này luôn đã qua auth) để một tài khoản không thể gọi dồn
// làm cạn ngân sách/CPU. Trả về đúng envelope lỗi của hệ thống.
export const aiContentRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  limit: 6, // tối đa 6 request AI/phút/user
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (request) => request.auth?.profile?.id ?? "anonymous",
  handler: (request, response) => {
    response.status(429).json({
      error: {
        code: "RATE_LIMITED",
        message: "Bạn thao tác AI quá nhanh. Vui lòng chờ khoảng một phút rồi thử lại.",
        requestId: request.requestId,
      },
    });
  },
});
