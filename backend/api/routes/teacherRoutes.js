import { Router } from "express";

import { escalations } from "../controllers/teacherController.js";
import {
  exerciseProposals,
  reviewProposal,
} from "../controllers/exerciseController.js";

export const teacherRouter = Router();

teacherRouter.get("/escalations", escalations);

// Review queue for Tutor practice items a student proposed for the question bank.
teacherRouter.get("/exercise-proposals", exerciseProposals);
teacherRouter.post("/exercise-proposals/:exerciseId/review", reviewProposal);
