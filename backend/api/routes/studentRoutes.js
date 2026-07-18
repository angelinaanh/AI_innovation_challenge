import { Router } from "express";

import {
  attempt,
  dashboard,
  lesson,
  path,
} from "../controllers/studentController.js";
import {
  getInvitations,
  getMyClasses,
  getSubjects,
  postJoin,
  postRespond,
} from "../controllers/classroomController.js";
import {
  getStudentAiLessonDetail,
  getStudentAiLessons,
} from "../controllers/contentStudioController.js";
import {
  learningPath,
  learningProgress,
  learningSubjects,
  saveLearningProgress,
} from "../controllers/learningPathController.js";
import {
  chat as onboardingChatHandler,
  complete as onboardingCompleteHandler,
  placementGenerate,
  placementState,
  placementSubmit,
} from "../controllers/onboardingController.js";

export const studentRouter = Router();

studentRouter.get("/dashboard", dashboard);
studentRouter.get("/path", path);

// Lộ trình học theo môn (Mục lớn → Chương → Bài học → Bonus) + tiến độ.
studentRouter.get("/learning-path", learningSubjects);
studentRouter.get("/learning-path/:subjectKey", learningPath);
studentRouter.get("/learning-path/:subjectKey/progress", learningProgress);
studentRouter.post("/learning-path/:subjectKey/progress", saveLearningProgress);
studentRouter.get("/lessons/:skillNodeId", lesson);
studentRouter.post("/attempts", attempt);

// Onboarding AI chat + Placement Test (M3 / FR2 / P-01, P-02)
studentRouter.post("/onboarding/chat", onboardingChatHandler);
studentRouter.post("/onboarding/complete", onboardingCompleteHandler);
studentRouter.get("/placement", placementState);
studentRouter.post("/placement/generate", placementGenerate);
studentRouter.post("/placement/submit", placementSubmit);

// Classes & subjects (student side): browse subjects, see my classes and
// invitations, request to join by code, accept/decline an invitation.
studentRouter.get("/subjects", getSubjects);
studentRouter.get("/classes", getMyClasses);
studentRouter.get("/invitations", getInvitations);
studentRouter.post("/classes/join", postJoin);
studentRouter.post("/memberships/:membershipId/respond", postRespond);

// Bài giảng AI giáo viên đã xuất bản trong các lớp học sinh đang tham gia.
studentRouter.get("/ai-lessons", getStudentAiLessons);
studentRouter.get("/ai-lessons/:lessonId", getStudentAiLessonDetail);
