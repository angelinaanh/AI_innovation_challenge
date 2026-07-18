/**
 * Kiểm tra khóa bài giảng do AI sinh và giáo viên đã chỉnh sửa, trước khi lưu
 * vào DB. Shape tương ứng content_format = 'steam_lesson' (migration 0007),
 * bám theo ai/prompts/create_leacturer.md.
 *
 * Trả về chuỗi mô tả lỗi đầu tiên, hoặc null nếu hợp lệ — cùng quy ước với
 * validateLessonDraft trong contentStudioRules.js.
 */
const LEVELS = new Set(["Basic", "Advanced"]);
// "image" = ảnh giáo viên tự tải lên (url là data URI hoặc link); khác với
// "image_suggestion" do AI đề xuất (chỉ có mô tả chữ).
const BLOCK_TYPES = new Set(["text", "formula", "image_suggestion", "quick_practice", "image", "tip"]);

function cleanText(value) {
  return String(value || "").trim();
}

function validateBlock(block, where) {
  if (!block || typeof block !== "object") return `${where}: block không hợp lệ.`;
  if (!BLOCK_TYPES.has(block.type)) return `${where}: loại block "${block.type}" không hợp lệ.`;
  if (block.type === "image_suggestion") {
    return cleanText(block.alt_text) ? null : `${where}: gợi ý hình ảnh cần mô tả.`;
  }
  if (block.type === "image") {
    return cleanText(block.url) ? null : `${where}: khối ảnh cần tải lên hình ảnh.`;
  }
  if (block.type === "quick_practice") {
    if (!cleanText(block.question)) return `${where}: bài tập nhanh cần câu hỏi.`;
    return cleanText(block.answer) ? null : `${where}: bài tập nhanh cần đáp án.`;
  }
  return cleanText(block.content) ? null : `${where}: nội dung không được để trống.`;
}

function validateQuiz(quiz, where) {
  if (cleanText(quiz?.question).length < 5) return `${where}: câu hỏi quá ngắn.`;
  if (!Array.isArray(quiz.options) || quiz.options.length < 2 || quiz.options.length > 6) {
    return `${where}: cần từ 2 đến 6 phương án.`;
  }
  if (quiz.options.some((option) => !cleanText(option?.text))) {
    return `${where}: có phương án để trống.`;
  }
  const correctCount = quiz.options.filter((option) => option?.is_correct === true).length;
  if (correctCount !== 1) return `${where}: phải có đúng 1 đáp án đúng (đang có ${correctCount}).`;
  return null;
}

export function validateSingleLesson(lesson) {
  return validateLesson(lesson, 0);
}

function validateLesson(lesson, index) {
  const where = `Bài ${lesson?.lesson_id || index + 1}`;
  if (!lesson || typeof lesson !== "object") return `${where}: dữ liệu không hợp lệ.`;
  if (cleanText(lesson.lesson_title).length < 3) return `${where}: thiếu tên bài học.`;

  if (!Array.isArray(lesson.sections) || lesson.sections.length === 0) {
    return `${where}: cần ít nhất một mục.`;
  }
  for (const section of lesson.sections) {
    const sectionWhere = `${where} · mục "${cleanText(section?.section_title) || "?"}"`;
    if (cleanText(section?.section_title).length < 2) return `${sectionWhere}: thiếu tên mục.`;
    if (!Array.isArray(section.content_blocks) || section.content_blocks.length === 0) {
      return `${sectionWhere}: cần ít nhất một khối nội dung.`;
    }
    for (const block of section.content_blocks) {
      const blockError = validateBlock(block, sectionWhere);
      if (blockError) return blockError;
    }
  }

  if (!Array.isArray(lesson.lesson_highlights) || lesson.lesson_highlights.length === 0) {
    return `${where}: cần ít nhất một ý tổng kết.`;
  }
  const quizzes = lesson.evaluation?.quizzes;
  if (!Array.isArray(quizzes) || quizzes.length === 0) return `${where}: cần ít nhất một câu quiz.`;
  for (const [quizIndex, quiz] of quizzes.entries()) {
    const quizError = validateQuiz(quiz, `${where} · câu ${quizIndex + 1}`);
    if (quizError) return quizError;
  }

  // practical_quest là tùy chọn (require_quest = FALSE -> null), nhưng nếu có
  // thì phải đủ tên và yêu cầu, nếu không học sinh nhận nhiệm vụ rỗng.
  if (lesson.practical_quest) {
    if (cleanText(lesson.practical_quest.quest_title).length < 3) {
      return `${where}: nhiệm vụ thực hành thiếu tên.`;
    }
    if (cleanText(lesson.practical_quest.task).length < 10) {
      return `${where}: nhiệm vụ thực hành thiếu yêu cầu.`;
    }
  }
  return null;
}

export function validateGeneratedCourse(payload) {
  if (!payload || typeof payload !== "object") return "Thiếu dữ liệu bài giảng.";
  if (!cleanText(payload.classId)) return "Hãy chọn lớp để lưu bài giảng.";
  if (cleanText(payload.subject).length < 2) return "Thiếu tên môn học.";
  if (!cleanText(payload.grade)) return "Thiếu khối lớp.";
  if (!LEVELS.has(payload.level)) return "Trình độ không hợp lệ.";

  const quizCount = Number(payload.quizCount);
  if (!Number.isInteger(quizCount) || quizCount < 1 || quizCount > 10) {
    return "Số câu quiz cần từ 1 đến 10.";
  }
  if (!Array.isArray(payload.lessons) || payload.lessons.length === 0) {
    return "Khóa học cần ít nhất một bài giảng.";
  }
  if (payload.lessons.length > 60) return "Khóa học vượt quá 60 bài giảng.";

  for (const [index, lesson] of payload.lessons.entries()) {
    const lessonError = validateLesson(lesson, index);
    if (lessonError) return lessonError;
  }
  return null;
}
