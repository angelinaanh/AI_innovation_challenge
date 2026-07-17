import { Router } from "express";

import {
  createSession,
  escalate,
  streamMessage,
} from "../controllers/tutorController.js";

export const tutorRouter = Router();

tutorRouter.post("/sessions", createSession);
tutorRouter.post("/sessions/:sessionId/messages/stream", streamMessage);
tutorRouter.post("/messages/:messageId/escalate", escalate);
