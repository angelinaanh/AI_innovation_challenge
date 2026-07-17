import assert from "node:assert/strict";
import test from "node:test";

import {
  ageFromDate,
  safeReturnPath,
} from "../src/features/auth/authHelpers.js";

const TODAY = new Date("2026-07-18T12:00:00+07:00");

test("calculates the under-16 guardian threshold", () => {
  assert.equal(ageFromDate("2010-07-18", TODAY), 16);
  assert.equal(ageFromDate("2010-07-19", TODAY), 15);
});

test("keeps post-login return paths on the same origin", () => {
  assert.equal(safeReturnPath("/student/path"), "/student/path");
  assert.equal(safeReturnPath("//malicious.example"), "/");
  assert.equal(safeReturnPath("/\\malicious.example"), "/");
  assert.equal(safeReturnPath("https://malicious.example"), "/");
});
