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
