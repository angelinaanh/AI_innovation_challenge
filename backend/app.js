import crypto from "node:crypto";

import cors from "cors";
import express from "express";

import { studentRouter } from "./api/routes/studentRoutes.js";
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

  app.use("/api/student", studentRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
