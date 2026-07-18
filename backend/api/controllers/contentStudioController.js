import {
  assignAiLessonsToClass,
  getStudentAiLesson,
  getTeacherAiLesson,
  listClassAiLessons,
  listStudentAiLessons,
  listTeacherAiCourses,
  publishAiLessons,
  removeAiLessonFromClass,
  saveGeneratedCourse,
  unpublishAiLesson,
  updateAiLesson,
} from "../../services/content-studio/aiLessonService.js";
import {
  archiveContentLesson,
  createContentDraft,
  createContentVersion,
  getContentLesson,
  listContentWorkspace,
  publishContentLesson,
  submitContentReview,
  updateContentDraft,
} from "../../services/content-studio/contentStudioService.js";

const uid = (request) => request.auth?.profile?.id;

// Bước cuối của Lesson Generator: lưu khóa bài giảng AI giáo viên đã duyệt.
export async function postAiCourse(request, response, next) {
  try {
    const data = await saveGeneratedCourse(uid(request), request.body);
    response.status(201).json({ data });
  } catch (error) { next(error); }
}

export async function getAiCourses(request, response, next) {
  try { response.json({ data: await listTeacherAiCourses(uid(request)) }); }
  catch (error) { next(error); }
}

export async function getAiLesson(request, response, next) {
  try { response.json({ data: await getTeacherAiLesson(uid(request), request.params.lessonId) }); }
  catch (error) { next(error); }
}

export async function patchAiLesson(request, response, next) {
  try { response.json({ data: await updateAiLesson(uid(request), request.params.lessonId, request.body) }); }
  catch (error) { next(error); }
}

export async function postAiLessonPublish(request, response, next) {
  try {
    const data = await publishAiLessons(uid(request), { lessonId: request.params.lessonId });
    response.json({ data });
  } catch (error) { next(error); }
}

export async function postAiCoursePublish(request, response, next) {
  try {
    const data = await publishAiLessons(uid(request), { courseId: request.params.courseId });
    response.json({ data });
  } catch (error) { next(error); }
}

export async function postAiLessonUnpublish(request, response, next) {
  try { response.json({ data: await unpublishAiLesson(uid(request), request.params.lessonId) }); }
  catch (error) { next(error); }
}

// Gán bài giảng AI vào lớp — dùng ở trang chi tiết lớp học.
export async function getClassAiLessons(request, response, next) {
  try {
    const data = await listClassAiLessons(uid(request), request.params.classId);
    response.json({ data });
  } catch (error) { next(error); }
}

export async function postClassAiLessons(request, response, next) {
  try {
    const data = await assignAiLessonsToClass(
      uid(request), request.params.classId, request.body?.lessonIds,
    );
    response.status(201).json({ data });
  } catch (error) { next(error); }
}

export async function deleteClassAiLesson(request, response, next) {
  try {
    const data = await removeAiLessonFromClass(
      uid(request), request.params.classId, request.params.lessonId,
    );
    response.json({ data });
  } catch (error) { next(error); }
}

// ------------------------------------------------------------ Học sinh ----
export async function getStudentAiLessons(request, response, next) {
  try { response.json({ data: await listStudentAiLessons(uid(request)) }); }
  catch (error) { next(error); }
}

export async function getStudentAiLessonDetail(request, response, next) {
  try { response.json({ data: await getStudentAiLesson(uid(request), request.params.lessonId) }); }
  catch (error) { next(error); }
}

export async function getContentWorkspace(request, response, next) {
  try { response.json({ data: await listContentWorkspace(uid(request)) }); }
  catch (error) { next(error); }
}

export async function postContentDraft(request, response, next) {
  try {
    const data = await createContentDraft(uid(request), request.body);
    response.status(201).json({ data });
  } catch (error) { next(error); }
}

export async function getTeacherLesson(request, response, next) {
  try { response.json({ data: await getContentLesson(uid(request), request.params.lessonId) }); }
  catch (error) { next(error); }
}

export async function patchTeacherLesson(request, response, next) {
  try { response.json({ data: await updateContentDraft(uid(request), request.params.lessonId, request.body) }); }
  catch (error) { next(error); }
}

export async function postLessonReview(request, response, next) {
  try { response.json({ data: await submitContentReview(uid(request), request.params.lessonId) }); }
  catch (error) { next(error); }
}

export async function postLessonPublish(request, response, next) {
  try { response.json({ data: await publishContentLesson(uid(request), request.params.lessonId, request.body) }); }
  catch (error) { next(error); }
}

export async function postLessonVersion(request, response, next) {
  try {
    const data = await createContentVersion(uid(request), request.params.lessonId);
    response.status(201).json({ data });
  } catch (error) { next(error); }
}

export async function postLessonArchive(request, response, next) {
  try { response.json({ data: await archiveContentLesson(uid(request), request.params.lessonId) }); }
  catch (error) { next(error); }
}
