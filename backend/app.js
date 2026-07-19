import crypto from "node:crypto";

import cors from "cors";
import express from "express";

import { authRouter } from "./api/routes/authRoutes.js";
import { studentRouter } from "./api/routes/studentRoutes.js";
import { teacherRouter } from "./api/routes/teacherRoutes.js";
import { tutorRouter } from "./api/routes/tutorRoutes.js";
import communityRouter from "./api/routes/communityRoutes.js";
import {
  authenticateRequest,
  requireActiveAccount,
  requireProfile,
  requireRole,
} from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { env, isOriginAllowed } from "./utils/env.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  // Trả Error ở callback khiến cors ném vào errorHandler -> 500 TRỐNG, không kèm
  // header Access-Control-* nào, kể cả ở preflight. Trình duyệt chỉ báo "Failed
  // to fetch" và không đọc được body, nên nguyên nhân thật bị giấu hoàn toàn.
  // Từ chối "mềm" (callback(null, false)) + log origin để còn lần ra được.
  app.use(cors({
    origin(origin, callback) {
      if (isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }
      console.warn(JSON.stringify({
        level: "warn",
        code: "CORS_ORIGIN_REJECTED",
        origin,
        allowed: env.corsOrigins,
        hint: "Thêm origin này vào CORS_ORIGINS trong backend/.env rồi khởi động lại backend.",
      }));
      callback(null, false);
    },
    credentials: true,
  }));
  // Chỉ các route lưu/sửa bài giảng (có thể chứa ảnh nhúng dạng data URI) mới
  // được nới 25MB; toàn bộ API còn lại giữ 1MB để thu hẹp bề mặt DoS/ngốn RAM.
  // parser lớn chạy trước và đặt req._body -> parser 1MB phía sau tự bỏ qua.
  const largeJsonPaths = [
    /^\/api\/teacher\/content\/ai-courses\/?$/,
    /^\/api\/teacher\/ai-lessons\/[^/]+\/?$/,
  ];
  const largeJson = express.json({ limit: "25mb" });
  app.use((request, response, next) => {
    if (largeJsonPaths.some((pattern) => pattern.test(request.path))) {
      largeJson(request, response, next);
      return;
    }
    next();
  });
  app.use(express.json({ limit: "1mb" }));
  app.use((request, response, next) => {
    request.requestId = crypto.randomUUID();
    response.setHeader("x-request-id", request.requestId);
    next();
  });

  app.get("/api/health", (_request, response) => {
    response.json({
      data: {
        status: "ok",
        service: "eduone-api",
        realtime: true,
      },
    });
  });

  app.use("/api/auth", authRouter);
  app.use(
    "/api/student",
    authenticateRequest,
    requireProfile,
    requireRole("student"),
    requireActiveAccount,
    studentRouter,
  );
  app.use(
    "/api/tutor",
    authenticateRequest,
    requireProfile,
    requireRole("student"),
    requireActiveAccount,
    tutorRouter,
  );
  app.use(
    "/api/teacher",
    authenticateRequest,
    requireProfile,
    requireRole("teacher"),
    requireActiveAccount,
    teacherRouter,
  );
  app.use(
    "/api/community",
    authenticateRequest,
    requireProfile,
    requireActiveAccount,
    communityRouter,
  );
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
