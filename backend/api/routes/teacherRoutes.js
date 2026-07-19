import { Router } from "express";

import multer from "multer";

import { aiContentRateLimiter } from "../../middleware/rateLimit.js";
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
  postContentGenerate,
  postContentOutline,
  postLessonArchive,
  postLessonPublish,
  postLessonReview,
  postLessonVersion,
} from "../controllers/contentStudioController.js";

export const teacherRouter = Router();

// Lesson Generator nhận tài liệu qua multipart; giữ file trong RAM (không ghi
// đĩa) và chặn cứng 20MB ngay ở tầng upload.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
});

// Chuyển lỗi riêng của multer (vd vượt 20MB) sang mã lỗi chuẩn của hệ thống để
// giáo viên nhận đúng thông báo tiếng Việt thay vì lỗi 500 chung chung.
function uploadDocument(request, response, next) {
  upload.single("file")(request, response, (error) => {
    if (!error) return next();
    if (error.code === "LIMIT_FILE_SIZE") {
      error.code = "UPLOAD_TOO_LARGE";
      error.message = "Tài liệu vượt quá giới hạn 20MB. Vui lòng tải lên tài liệu nhỏ hơn 20MB.";
    } else {
      error.code = "VALIDATION_ERROR";
      error.message = "Không đọc được tệp tải lên. Vui lòng thử lại.";
    }
    next(error);
  });
}

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
// Bước 1 & 2: sinh dàn ý từ tài liệu và viết bài giảng chi tiết — gọi thẳng
// OpenAI từ backend (thay cho AI Content Service tách riêng trước đây).
teacherRouter.post("/content/outline", aiContentRateLimiter, uploadDocument, postContentOutline);
teacherRouter.post("/content/generate", aiContentRateLimiter, postContentGenerate);
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
