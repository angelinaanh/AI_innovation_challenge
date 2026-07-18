/**
 * Gom danh sách bài giảng AI phẳng thành Môn học -> Chương -> Bài.
 *
 * Một lớp thường được gán bài từ nhiều khóa khác nhau, nên nếu đổ phẳng thì
 * "Bài 1.1" của môn này nằm cạnh "Bài 1.1" của môn kia và người học không biết
 * mình đang xem môn gì. Backend đã sắp theo (môn, thứ tự bài) nên ở đây chỉ gom
 * theo thứ tự xuất hiện, không sắp lại.
 */
export function groupAiLessonsBySubject(lessons) {
  const subjects = new Map();

  for (const lesson of lessons || []) {
    // Bài cũ tạo trước khi API trả `subject` vẫn phải hiện ra, không được rơi
    // mất — dồn vào một nhóm rõ ràng thay vì ẩn đi.
    const subjectKey = lesson.subject || "Chưa rõ môn học";
    if (!subjects.has(subjectKey)) {
      subjects.set(subjectKey, { subject: subjectKey, grade: lesson.grade || "", chapters: new Map(), count: 0 });
    }
    const subject = subjects.get(subjectKey);
    subject.count += 1;

    const chapterKey = lesson.chapterTitle || "Chưa phân chương";
    if (!subject.chapters.has(chapterKey)) subject.chapters.set(chapterKey, []);
    subject.chapters.get(chapterKey).push(lesson);
  }

  return [...subjects.values()].map((subject) => ({
    subject: subject.subject,
    grade: subject.grade,
    lessonCount: subject.count,
    chapters: [...subject.chapters.entries()].map(([title, items]) => ({ title, lessons: items })),
  }));
}
