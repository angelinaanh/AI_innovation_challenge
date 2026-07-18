import assert from "node:assert/strict";
import test from "node:test";

import {
  ageFromDate,
  returnPathForRole,
  safeReturnPath,
} from "../src/features/auth/authHelpers.js";
import { gradeLabel } from "../src/lib/academicCatalog.js";

const TODAY = new Date("2026-07-18T12:00:00+07:00");

test("calculates the under-16 guardian threshold", () => {
  assert.equal(ageFromDate("2010-07-18", TODAY), 16);
  assert.equal(ageFromDate("2010-07-19", TODAY), 15);
});

test("keeps a return path only inside the authenticated role workspace", () => {
  assert.equal(returnPathForRole("/student/classes", "student"), "/student/classes");
  assert.equal(returnPathForRole("/student/classes", "teacher"), "/");
  assert.equal(returnPathForRole("/teacher/classes/123", "teacher"), "/teacher/classes/123");
  assert.equal(returnPathForRole("/admin", "admin"), "/admin");
  assert.equal(returnPathForRole("//malicious.example", "teacher"), "/");
});

test("keeps post-login return paths on the same origin", () => {
  assert.equal(safeReturnPath("/student/path"), "/student/path");
  assert.equal(safeReturnPath("//malicious.example"), "/");
  assert.equal(safeReturnPath("/\\malicious.example"), "/");
  assert.equal(safeReturnPath("https://malicious.example"), "/");
});

test("formats exact grade labels", () => {
  assert.equal(gradeLabel(1), "Lớp 1");
  assert.equal(gradeLabel("12"), "Lớp 12");
  assert.equal(gradeLabel(13), "Chưa xác định lớp");
});
