import assert from "node:assert/strict";
import test from "node:test";

import { validateGeneratedCourse } from "../services/content-studio/aiLessonRules.js";

// Khóa hợp lệ tối thiểu, shape steam_lesson theo ai/prompts/create_leacturer.md.
function validCourse() {
  return {
    classId: "11111111-1111-1111-1111-111111111111",
    subject: "Vật lí",
    grade: "8",
    level: "Basic",
    quizCount: 3,
    lessons: [
      {
        lesson_id: "1.1",
        lesson_title: "Khái niệm lực",
        chapter_title: "Chương 1: Lực và Chuyển động",
        engage_hook: "Vì sao xe dừng lại khi phanh?",
        sections: [
          {
            section_id: "1.1.1",
            section_title: "I. Khái niệm lực",
            content_blocks: [
              { type: "text", content: "**Lực** là đại lượng đặc trưng cho tác dụng của vật này lên vật khác." },
              { type: "formula", content: "$$ F = m \\cdot a $$" },
            ],
          },
        ],
        lesson_highlights: ["Lực đo bằng Niutơn."],
        evaluation: {
          quizzes: [
            {
              question: "Lực được đo bằng đơn vị nào?",
              options: [
                { text: "Niutơn (N)", is_correct: true, feedback: "Đúng, N là đơn vị SI của lực." },
                { text: "Jun (J)", is_correct: false, feedback: "Jun là đơn vị của công, không phải lực." },
              ],
            },
          ],
        },
        practical_quest: null,
      },
    ],
  };
}

test("accepts a well-formed AI generated course", () => {
  assert.equal(validateGeneratedCourse(validCourse()), null);
});

test("requires a class before saving", () => {
  const course = validCourse();
  course.classId = "";
  assert.match(validateGeneratedCourse(course), /chọn lớp/);
});

test("rejects a quiz that does not have exactly one correct option", () => {
  const noAnswer = validCourse();
  noAnswer.lessons[0].evaluation.quizzes[0].options.forEach((option) => { option.is_correct = false; });
  assert.match(validateGeneratedCourse(noAnswer), /đúng 1 đáp án đúng/);

  const twoAnswers = validCourse();
  twoAnswers.lessons[0].evaluation.quizzes[0].options.forEach((option) => { option.is_correct = true; });
  assert.match(validateGeneratedCourse(twoAnswers), /đúng 1 đáp án đúng/);
});

test("rejects a section the teacher stripped every block from", () => {
  const course = validCourse();
  course.lessons[0].sections[0].content_blocks = [];
  assert.match(validateGeneratedCourse(course), /ít nhất một khối nội dung/);
});

// Mỗi loại block dùng field bắt buộc riêng — block rỗng lọt xuống DB sẽ hiện
// khối trắng trong lesson player.
test("validates the required field per block type", () => {
  const imageMissingAlt = validCourse();
  imageMissingAlt.lessons[0].sections[0].content_blocks = [{ type: "image_suggestion", alt_text: "" }];
  assert.match(validateGeneratedCourse(imageMissingAlt), /mô tả/);

  const practiceMissingAnswer = validCourse();
  practiceMissingAnswer.lessons[0].sections[0].content_blocks = [
    { type: "quick_practice", question: "2 + 2 = ?", answer: "" },
  ];
  assert.match(validateGeneratedCourse(practiceMissingAnswer), /đáp án/);

  const unknownType = validCourse();
  unknownType.lessons[0].sections[0].content_blocks = [{ type: "video", content: "x" }];
  assert.match(validateGeneratedCourse(unknownType), /không hợp lệ/);
});

test("rejects a practical quest that is present but incomplete", () => {
  const course = validCourse();
  course.lessons[0].practical_quest = { quest_title: "Mô hình cầu", task: "" };
  assert.match(validateGeneratedCourse(course), /thiếu yêu cầu/);
});

test("allows a lesson without a practical quest", () => {
  const course = validCourse();
  delete course.lessons[0].practical_quest;
  assert.equal(validateGeneratedCourse(course), null);
});

// Bài lý thuyết/dẫn nhập có thể không cần quiz — giáo viên vẫn lưu và xuất bản
// được, dù xóa hết câu hỏi hay bỏ luôn khối evaluation.
test("allows a lesson with no quizzes", () => {
  const emptyList = validCourse();
  emptyList.lessons[0].evaluation.quizzes = [];
  assert.equal(validateGeneratedCourse(emptyList), null);

  const noEvaluation = validCourse();
  delete noEvaluation.lessons[0].evaluation;
  assert.equal(validateGeneratedCourse(noEvaluation), null);
});

// Không bắt buộc có quiz, nhưng quiz đã tồn tại thì vẫn phải đúng shape.
test("still validates quizzes when the lesson has them", () => {
  const course = validCourse();
  course.lessons[0].evaluation.quizzes[0].options = [{ text: "Chỉ một phương án", is_correct: true }];
  assert.match(validateGeneratedCourse(course), /2 đến 6 phương án/);
});
