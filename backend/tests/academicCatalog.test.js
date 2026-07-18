import assert from "node:assert/strict";
import test from "node:test";

import {
  SUBJECT_CATALOG,
  isSubjectAllowedForGrade,
  subjectsForGrade,
} from "../services/academic/academicCatalog.js";

test("catalog contains the 101 exact grade-subject rows", () => {
  assert.equal(SUBJECT_CATALOG.length, 101);
  for (let gradeLevel = 1; gradeLevel <= 12; gradeLevel += 1) {
    assert.ok(subjectsForGrade(gradeLevel).length > 0, `grade ${gradeLevel} has subjects`);
  }
});

test("grade subject constraints match the supplied GDPT STEAM table", () => {
  assert.equal(isSubjectAllowedForGrade("Tin học", 2), false);
  assert.equal(isSubjectAllowedForGrade("Tin học", 3), true);
  assert.equal(isSubjectAllowedForGrade("Khoa học", 4), true);
  assert.equal(isSubjectAllowedForGrade("Khoa học", 6), false);
  assert.equal(isSubjectAllowedForGrade("Khoa học tự nhiên", 9), true);
  assert.equal(isSubjectAllowedForGrade("Vật lý", 9), false);
  assert.equal(isSubjectAllowedForGrade("Vật lý", 10), true);
});

test("each subject row has exactly one STEAM tag", () => {
  for (const subject of SUBJECT_CATALOG) {
    assert.match(subject.steamAxis, /^[STEAM]$/);
  }
});
