import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceOnboardingChat,
  gradePlacement,
  missingSlots,
  normalizeGeneratedQuestions,
  radarSummary,
  resolveTrack,
  validateCollectedProfile,
} from "../services/onboarding/onboardingRules.js";
import { buildDeterministicQuestions } from "../services/onboarding/placementBank.js";

test("chat extracts the pending slot from the latest student message", () => {
  const step = advanceOnboardingChat({ collected: {}, lastUserMessage: "Mình tên là Lan" });
  assert.equal(step.collected.fullName, "Lan");
  assert.equal(step.complete, false);
  assert.match(step.reply, /tuổi/i); // hỏi slot tiếp theo
});

test("chat parses age, grade and yes/no enrolment", () => {
  assert.equal(advanceOnboardingChat({ collected: { fullName: "Lan" }, lastUserMessage: "10 tuổi" }).collected.age, 10);
  assert.equal(advanceOnboardingChat({ collected: { fullName: "Lan", age: 10 }, lastUserMessage: "Lớp 4 ạ" }).collected.gradeLevel, 4);
  assert.equal(
    advanceOnboardingChat({ collected: { fullName: "Lan", age: 10, gradeLevel: 4 }, lastUserMessage: "Dạ còn đi học" }).collected.isEnrolled,
    true,
  );
  assert.equal(
    advanceOnboardingChat({ collected: { fullName: "Lan", age: 10, gradeLevel: 4 }, lastUserMessage: "không, em nghỉ rồi" }).collected.isEnrolled,
    false,
  );
});

test("chat explains an invalid answer instead of repeating the question", () => {
  // "2012" là năm sinh, không phải tuổi -> phải giải thích, KHÔNG điền age.
  const step = advanceOnboardingChat({ collected: { fullName: "Lan" }, lastUserMessage: "2012" });
  assert.equal(step.collected.age, undefined);
  assert.equal(step.complete, false);
  assert.match(step.reply, /năm sinh|tuổi/i);
  // câu giải thích phải khác câu hỏi gốc (không lặp máy móc)
  assert.notEqual(step.reply, "Rất vui được gặp Lan! Năm nay bạn bao nhiêu tuổi?");

  // trả lời không phải có/không cho câu còn-đi-học -> hướng dẫn lại
  const enrolStep = advanceOnboardingChat({
    collected: { fullName: "Lan", age: 14, gradeLevel: 8 },
    lastUserMessage: "Duy Tân",
  });
  assert.equal(enrolStep.collected.isEnrolled, undefined);
  assert.match(enrolStep.reply, /Có|Chưa|Không/);
});

test("chat acknowledges a valid answer before asking the next question", () => {
  const step = advanceOnboardingChat({ collected: {}, lastUserMessage: "Lan" });
  assert.equal(step.collected.fullName, "Lan");
  // có lời ghi nhận dẫn dắt ở đầu câu
  assert.match(step.reply, /tuổi/i);
});

test("chat completes only when all six slots are filled", () => {
  const collected = {
    fullName: "Lan", age: 10, gradeLevel: 4,
    isEnrolled: true, schoolName: "Trường X", selfReportedGrade: 4,
  };
  assert.equal(missingSlots(collected).length, 0);
  const step = advanceOnboardingChat({ collected, lastUserMessage: "" });
  assert.equal(step.complete, true);
  assert.match(step.reply, /Phân tích Kỹ năng/i);
});

test("validateCollectedProfile requires name and a valid grade", () => {
  assert.equal(validateCollectedProfile({ fullName: "Lan", gradeLevel: 4 }).valid, true);
  assert.equal(validateCollectedProfile({ fullName: "L", gradeLevel: 4 }).valid, false);
  assert.equal(validateCollectedProfile({ fullName: "Lan", gradeLevel: 20 }).valid, false);
});

test("deterministic bank yields 20 valid questions across for primary", () => {
  const questions = buildDeterministicQuestions(4, "primary");
  assert.equal(questions.length, 20);
  // đáp án luôn nằm trong lựa chọn (cho câu mcq)
  for (const q of questions) {
    if (q.type === "mcq" || !q.type) {
      assert.ok(q.answer_index >= 0 && q.answer_index < q.options.length);
    }
  }
});

test("normalizeGeneratedQuestions drops items whose answer is out of range", () => {
  const cleaned = normalizeGeneratedQuestions([
    { steam_axis: "M", body: "1+1?", options: ["2", "3"], answer_index: 0 },
    { steam_axis: "M", body: "bad", options: ["a", "b"], answer_index: 9 },
    { steam_axis: "Z", body: "invalid axis", options: ["a", "b", "c"], answer_index: 0 },
  ]);
  assert.equal(cleaned.length, 1);
  assert.equal(cleaned[0].order_index, 0);
});

test("gradePlacement maps correct ratio to per-axis STEAM and a track", () => {
  const questions = [
    { id: "q1", steam_axis: "M", answer_index: 0 },
    { id: "q2", steam_axis: "M", answer_index: 1 },
    { id: "q3", steam_axis: "S", answer_index: 0 },
    { id: "q4", steam_axis: "S", answer_index: 0 },
  ];
  const answers = [
    { questionId: "q1", selectedIndex: 0 }, // M đúng
    { questionId: "q2", selectedIndex: 0 }, // M sai
    { questionId: "q3", selectedIndex: 0 }, // S đúng
    { questionId: "q4", selectedIndex: 0 }, // S đúng
  ];
  const graded = gradePlacement(questions, answers);
  assert.equal(graded.steam.M, 50);
  assert.equal(graded.steam.S, 100);
  assert.equal(graded.totalCorrect, 3);
  assert.equal(graded.scorePercent, 75);
  assert.equal(graded.track, "advanced");
});

test("resolveTrack uses the 50% threshold", () => {
  assert.equal(resolveTrack(49.99), "basic");
  assert.equal(resolveTrack(50), "advanced");
});

test("radarSummary praises the strongest axis and nudges the weakest", () => {
  const summary = radarSummary({ S: 20, T: 30, E: 80, A: 10, M: 40 }, { track: "advanced" });
  assert.equal(summary.strongestAxis, "E");
  assert.equal(summary.weakestAxis, "A");
  assert.match(summary.message, /Kỹ sư/);
  assert.match(summary.message, /Nghệ thuật/);
});
