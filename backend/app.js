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
import { env } from "./utils/env.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
  }));
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
