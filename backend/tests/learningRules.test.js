import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateMasteryDelta,
  calculateQuizReward,
  gradeMultipleChoice,
  validateAnswerIndex,
} from "../services/learning/learningRules.js";

test("validates and grades MCQ answers without exposing answer logic to frontend", () => {
  const options = ["A", "B", "C"];
  assert.equal(validateAnswerIndex(1, options), true);
  assert.equal(validateAnswerIndex(3, options), false);
  assert.equal(validateAnswerIndex(null, options), false);
  assert.equal(validateAnswerIndex("1", options), false);
  assert.equal(gradeMultipleChoice(1, { index: 1 }), true);
  assert.equal(gradeMultipleChoice(0, { index: 1 }), false);
});

test("turns STEAM weights into a deterministic positive mastery delta", () => {
  assert.deepEqual(
    calculateMasteryDelta({ T: 0.45, M: 0.35, E: 0.2 }),
    { T: 4, M: 3, E: 2 },
  );
});

test("awards less XP after hints while preserving earned progress", () => {
  assert.deepEqual(
    calculateQuizReward({ usedHint: false, currentTotalExp: 1420 }),
    { xp: 80, totalExp: 1500, level: 4 },
  );
  assert.deepEqual(
    calculateQuizReward({ usedHint: true, currentTotalExp: 1420 }),
    { xp: 50, totalExp: 1470, level: 3 },
  );
});
