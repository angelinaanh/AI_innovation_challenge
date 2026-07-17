import { Router } from "express";

import {
  createSession,
  escalate,
  streamMessage,
} from "../controllers/tutorController.js";
import {
  createExercise,
  promoteExerciseToTeacher,
  submitExerciseAttempt,
} from "../controllers/exerciseController.js";

export const tutorRouter = Router();

tutorRouter.post("/sessions", createSession);
tutorRouter.post("/sessions/:sessionId/messages/stream", streamMessage);
tutorRouter.post("/messages/:messageId/escalate", escalate);

// Interactive formative exercises (mcq | matching | ordering | cloze).
tutorRouter.post("/exercises", createExercise);
tutorRouter.post("/exercises/:exerciseId/submit", submitExerciseAttempt);
tutorRouter.post("/exercises/:exerciseId/promote", promoteExerciseToTeacher);
