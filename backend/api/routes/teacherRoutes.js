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
import {
  getContentWorkspace,
  getTeacherLesson,
  patchTeacherLesson,
  postContentDraft,
  postLessonArchive,
  postLessonPublish,
  postLessonReview,
  postLessonVersion,
} from "../controllers/contentStudioController.js";

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

// Content Studio: AI/local draft, human review, publish, archive and versioning.
teacherRouter.get("/content", getContentWorkspace);
teacherRouter.post("/content/drafts", postContentDraft);
teacherRouter.get("/lessons/:lessonId", getTeacherLesson);
teacherRouter.patch("/lessons/:lessonId", patchTeacherLesson);
teacherRouter.post("/lessons/:lessonId/review", postLessonReview);
teacherRouter.post("/lessons/:lessonId/publish", postLessonPublish);
teacherRouter.post("/lessons/:lessonId/versions", postLessonVersion);
teacherRouter.post("/lessons/:lessonId/archive", postLessonArchive);
