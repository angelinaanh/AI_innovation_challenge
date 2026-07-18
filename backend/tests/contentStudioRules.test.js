import assert from "node:assert/strict";
import test from "node:test";

import {
  buildStructuredDraft,
  contentSafetyText,
  nextLessonStatus,
  validateLessonDraft,
} from "../services/content-studio/contentStudioRules.js";

const SOURCE = [
  "Vòng lặp giúp chương trình thực hiện lại một nhóm lệnh nhiều lần mà không cần sao chép từng khối lệnh.",
  "Khối repeat phù hợp khi biết trước số lần lặp, còn forever tiếp tục cho tới khi chương trình dừng.",
  "Học sinh cần đặt đúng các hành động vào bên trong vòng lặp và kiểm tra kết quả sau từng thay đổi.",
].join("\n\n");

test("content lifecycle requires review before publish", () => {
  assert.equal(nextLessonStatus("submit_review", "DRAFT"), "IN_REVIEW");
  assert.equal(nextLessonStatus("publish", "IN_REVIEW"), "PUBLISHED");
  assert.equal(nextLessonStatus("archive", "PUBLISHED"), "ARCHIVED");
  assert.throws(
    () => nextLessonStatus("publish", "DRAFT"),
    { code: "CONTENT_INVALID_STATE" },
  );
});

test("local fallback creates a valid lesson and question from teacher source", () => {
  const draft = buildStructuredDraft({
    sourceText: SOURCE,
    title: "Vòng lặp trong Scratch",
    skillNodeName: "Vòng lặp kỳ diệu",
  });
  assert.equal(draft.content.checkpoints.length, 3);
  assert.equal(draft.question.options.length, 3);
  assert.equal(validateLessonDraft(draft.content, draft.question), null);
  assert.match(contentSafetyText(draft.content, draft.question), /repeat/);
});

test("draft validation rejects missing checkpoints and invalid answer index", () => {
  const draft = buildStructuredDraft({ sourceText: SOURCE, skillNodeName: "Loops" });
  assert.match(validateLessonDraft({ ...draft.content, checkpoints: [] }, draft.question), /checkpoint/);
  assert.match(validateLessonDraft(draft.content, { ...draft.question, correctIndex: 9 }), /Đáp án/);
});
