import assert from "node:assert/strict";
import test from "node:test";

import {
  gradeExercise,
  isExerciseType,
  nextLevel,
  normalizeBlank,
  splitExercise,
  validateExercise,
} from "../services/tutor/exerciseRules.js";

test("recognizes the four supported exercise types", () => {
  assert.equal(isExerciseType("mcq"), true);
  assert.equal(isExerciseType("matching"), true);
  assert.equal(isExerciseType("ordering"), true);
  assert.equal(isExerciseType("cloze"), true);
  assert.equal(isExerciseType("essay"), false);
});

test("rejects malformed model output before it can reach a student", () => {
  assert.match(validateExercise(null), /không hợp lệ/);
  assert.match(
    validateExercise({ type: "mcq", prompt: "x", options: ["a"], correctIndex: 0 }),
    /2–4 lựa chọn/,
  );
  assert.match(
    validateExercise({ type: "mcq", prompt: "x", options: ["a", "b"], correctIndex: 5 }),
    /đáp án đúng/,
  );
  assert.equal(
    validateExercise({ type: "mcq", prompt: "Khối nào lặp?", options: ["repeat", "if"], correctIndex: 0 }),
    null,
  );
});

test("mcq split hides the answer key and grading marks the right option", () => {
  const item = {
    type: "mcq",
    prompt: "Khối nào lặp 10 lần rồi dừng?",
    options: ["forever", "repeat 10", "if then"],
    correctIndex: 1,
    explanation: "repeat chạy đúng số lần rồi dừng.",
  };
  const { payload, answerKey } = splitExercise(item);
  assert.equal(payload.options.length, 3);
  assert.equal(payload.correctIndex, undefined, "render payload must not leak the answer");
  assert.equal(answerKey.correctIndex, 1);

  assert.deepEqual(gradeExercise("mcq", answerKey, { selectedIndex: 1 }), {
    isCorrect: true,
    score: 1,
    solution: { correctIndex: 1 },
  });
  assert.equal(gradeExercise("mcq", answerKey, { selectedIndex: 0 }).isCorrect, false);
});

test("matching shuffles the right column but grades partial credit fairly", () => {
  const item = {
    type: "matching",
    prompt: "Nối khối với chức năng",
    left: [{ id: "l1", label: "move" }, { id: "l2", label: "if" }, { id: "l3", label: "repeat" }],
    right: [{ id: "r1", label: "di chuyển" }, { id: "r2", label: "rẽ nhánh" }, { id: "r3", label: "lặp" }],
    pairs: { l1: "r1", l2: "r2", l3: "r3" },
    explanation: "",
  };
  const { payload, answerKey } = splitExercise(item);
  assert.equal(payload.right.length, 3);
  assert.equal(payload.pairs, undefined, "answer pairs must not be in the render payload");

  const full = gradeExercise("matching", answerKey, { pairs: { l1: "r1", l2: "r2", l3: "r3" } });
  assert.equal(full.isCorrect, true);
  assert.equal(full.score, 1);

  const partial = gradeExercise("matching", answerKey, { pairs: { l1: "r1", l2: "r3", l3: "r2" } });
  assert.equal(partial.isCorrect, false);
  assert.ok(Math.abs(partial.score - 1 / 3) < 1e-9);
});

test("ordering never renders the correct order and scores by position", () => {
  const item = {
    type: "ordering",
    prompt: "Sắp các khối",
    items: [{ id: "a", label: "green flag" }, { id: "b", label: "repeat 10" }, { id: "c", label: "move" }],
    correctOrder: ["a", "b", "c"],
    explanation: "",
  };
  const { payload, answerKey } = splitExercise(item);
  const renderedOrder = payload.items.map((entry) => entry.id);
  assert.notDeepEqual(renderedOrder, answerKey.correctOrder, "must not present already-solved");

  assert.equal(gradeExercise("ordering", answerKey, { order: ["a", "b", "c"] }).score, 1);
  const twoRight = gradeExercise("ordering", answerKey, { order: ["a", "c", "b"] });
  assert.equal(twoRight.isCorrect, false);
  assert.ok(Math.abs(twoRight.score - 1 / 3) < 1e-9);
});

test("cloze grading is diacritic- and case-insensitive", () => {
  const item = {
    type: "cloze",
    prompt: "Điền vào chỗ trống",
    text: "Khối {{b1}} chạy đúng số lần rồi dừng.",
    blanks: [{ id: "b1", answer: "repeat", options: ["repeat", "forever"] }],
    explanation: "",
  };
  const { payload, answerKey } = splitExercise(item);
  assert.equal(payload.blanks[0].answer, undefined, "cloze answer must stay server-side");
  assert.equal(normalizeBlank("Repeat"), "repeat");
  assert.equal(gradeExercise("cloze", answerKey, { answers: { b1: "  REPEAT " } }).isCorrect, true);
  assert.equal(gradeExercise("cloze", answerKey, { answers: { b1: "forever" } }).isCorrect, false);
});

test("effort level curve matches the learning reward table", () => {
  assert.equal(nextLevel(0), 1);
  assert.equal(nextLevel(499), 1);
  assert.equal(nextLevel(500), 2);
});
