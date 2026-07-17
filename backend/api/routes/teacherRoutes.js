import { Router } from "express";

import { escalations } from "../controllers/teacherController.js";
import {
  exerciseProposals,
  reviewProposal,
} from "../controllers/exerciseController.js";
import {
  getClasses,
  getMembers,
  getSubjects,
  postClass,
  postDecision,
  postInvite,
} from "../controllers/classroomController.js";

export const teacherRouter = Router();

teacherRouter.get("/escalations", escalations);

// Review queue for Tutor practice items a student proposed for the question bank.
teacherRouter.get("/exercise-proposals", exerciseProposals);
teacherRouter.post("/exercise-proposals/:exerciseId/review", reviewProposal);

// Classes & subjects (teacher side): create a class, list classes and members,
// invite a student, and approve/reject a join request.
teacherRouter.get("/subjects", getSubjects);
teacherRouter.post("/classes", postClass);
teacherRouter.get("/classes", getClasses);
teacherRouter.get("/classes/:classId/members", getMembers);
teacherRouter.post("/classes/:classId/invite", postInvite);
teacherRouter.post("/memberships/:membershipId/decision", postDecision);
