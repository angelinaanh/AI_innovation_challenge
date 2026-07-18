import assert from "node:assert/strict";
import test from "node:test";

import {
  generateJoinCode,
  gradeBandForLevel,
  isGradeBand,
  isGradeLevel,
  membershipActor,
  nextMembershipStatus,
} from "../services/classroom/classroomRules.js";

test("join codes are readable, fixed-length, unambiguous", () => {
  const code = generateJoinCode(6);
  assert.equal(code.length, 6);
  assert.match(code, /^[A-Z2-9]+$/);
  assert.ok(!/[OI01]/.test(code), "ambiguous characters excluded");
  const codes = new Set(Array.from({ length: 200 }, () => generateJoinCode()));
  assert.ok(codes.size > 190, "codes are sufficiently random");
});

test("grade bands are validated", () => {
  assert.equal(isGradeBand("primary"), true);
  assert.equal(isGradeBand("secondary"), true);
  assert.equal(isGradeBand("high_school"), true);
  assert.equal(isGradeBand("college"), false);
});

test("exact grade levels derive the compatible grade band", () => {
  assert.equal(isGradeLevel(1), true);
  assert.equal(isGradeLevel("12"), true);
  assert.equal(isGradeLevel(0), false);
  assert.equal(isGradeLevel(13), false);
  assert.equal(gradeBandForLevel(5), "primary");
  assert.equal(gradeBandForLevel(6), "secondary");
  assert.equal(gradeBandForLevel(10), "high_school");
});

test("membership state machine allows only legal transitions", () => {
  assert.equal(nextMembershipStatus("accept_invite", "invited"), "active");
  assert.equal(nextMembershipStatus("decline_invite", "invited"), "rejected");
  assert.equal(nextMembershipStatus("approve_request", "requested"), "active");
  assert.equal(nextMembershipStatus("reject_request", "requested"), "rejected");
});

test("membership state machine rejects illegal transitions", () => {
  assert.throws(() => nextMembershipStatus("approve_request", "invited"), (e) => e.code === "MEMBERSHIP_INVALID_STATE");
  assert.throws(() => nextMembershipStatus("accept_invite", "active"), (e) => e.code === "MEMBERSHIP_INVALID_STATE");
  assert.throws(() => nextMembershipStatus("bogus", "invited"), (e) => e.code === "VALIDATION_ERROR");
});

test("each action is owned by exactly one actor", () => {
  assert.equal(membershipActor("accept_invite"), "student");
  assert.equal(membershipActor("decline_invite"), "student");
  assert.equal(membershipActor("approve_request"), "teacher");
  assert.equal(membershipActor("reject_request"), "teacher");
});
