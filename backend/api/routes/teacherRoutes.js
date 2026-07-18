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
  deleteClassAiLesson,
  getAiCourses,
  getAiLesson,
  getClassAiLessons,
  getContentWorkspace,
  getTeacherLesson,
  patchAiLesson,
  patchTeacherLesson,
  postAiCourse,
  postAiCoursePublish,
  postAiLessonPublish,
  postAiLessonUnpublish,
  postClassAiLessons,
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

// Gán bài giảng AI vào lớp (quan hệ nhiều-nhiều qua class_lessons).
teacherRouter.get("/classes/:classId/ai-lessons", getClassAiLessons);
teacherRouter.post("/classes/:classId/ai-lessons", postClassAiLessons);
teacherRouter.delete("/classes/:classId/ai-lessons/:lessonId", deleteClassAiLesson);

// Content Studio: AI/local draft, human review, publish, archive and versioning.
teacherRouter.get("/content", getContentWorkspace);
teacherRouter.post("/content/drafts", postContentDraft);
// Lesson Generator (AI): lưu khóa bài giảng đã duyệt, xem lại, sửa và xuất bản
// cho học sinh trong lớp. Bài chỉ hiển thị với học sinh khi ở trạng thái
// PUBLISHED — DRAFT là không gian làm việc riêng của giáo viên.
teacherRouter.post("/content/ai-courses", postAiCourse);
teacherRouter.get("/ai-courses", getAiCourses);
teacherRouter.post("/ai-courses/:courseId/publish", postAiCoursePublish);
teacherRouter.get("/ai-lessons/:lessonId", getAiLesson);
teacherRouter.patch("/ai-lessons/:lessonId", patchAiLesson);
teacherRouter.post("/ai-lessons/:lessonId/publish", postAiLessonPublish);
teacherRouter.post("/ai-lessons/:lessonId/unpublish", postAiLessonUnpublish);
teacherRouter.get("/lessons/:lessonId", getTeacherLesson);
teacherRouter.patch("/lessons/:lessonId", patchTeacherLesson);
teacherRouter.post("/lessons/:lessonId/review", postLessonReview);
teacherRouter.post("/lessons/:lessonId/publish", postLessonPublish);
teacherRouter.post("/lessons/:lessonId/versions", postLessonVersion);
teacherRouter.post("/lessons/:lessonId/archive", postLessonArchive);
