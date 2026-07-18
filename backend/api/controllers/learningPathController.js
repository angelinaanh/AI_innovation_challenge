import {
  getLearningPath,
  getProgress,
  listLearningSubjects,
  saveProgress,
} from "../../services/learning/learningPathService.js";

const uid = (request) => request.auth?.profile?.id;

// Danh sách môn có lộ trình theo lớp (?grade=9).
export async function learningSubjects(request, response, next) {
  try { response.json({ data: await listLearningSubjects(request.query.grade) }); }
  catch (error) { next(error); }
}

// Toàn bộ syllabus của một môn (tóm tắt, mục tiêu, mục lục phần/chương/bài, bonus).
export async function learningPath(request, response, next) {
  try { response.json({ data: await getLearningPath(request.query.grade, request.params.subjectKey) }); }
  catch (error) { next(error); }
}

// Tiến độ đã hoàn thành của học sinh trên môn/lớp.
export async function learningProgress(request, response, next) {
  try { response.json({ data: await getProgress(uid(request), request.query.grade, request.params.subjectKey) }); }
  catch (error) { next(error); }
}

// Lưu (hợp nhất) tiến độ khi học sinh hoàn thành bài/bonus.
export async function saveLearningProgress(request, response, next) {
  try {
    const data = await saveProgress(
      uid(request), request.body?.grade, request.params.subjectKey,
      request.body?.completed, request.body?.replace === true,
    );
    response.json({ data });
  } catch (error) { next(error); }
}
