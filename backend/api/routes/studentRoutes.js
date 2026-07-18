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

export const studentRouter = Router();

studentRouter.get("/dashboard", dashboard);
studentRouter.get("/path", path);
studentRouter.get("/lessons/:skillNodeId", lesson);
studentRouter.post("/attempts", attempt);

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
