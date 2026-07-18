import assert from "node:assert/strict";
import test from "node:test";

import {
  ageOnDate,
  isLearningAccountActive,
  normalizeAccountStatus,
  normalizeStudentOnboarding,
  onboardingRole,
} from "../services/auth/authRules.js";

const TODAY = new Date("2026-07-18T12:00:00.000Z");

test("calculates age correctly before and after the birthday", () => {
  assert.equal(ageOnDate("2010-07-18", TODAY), 16);
  assert.equal(ageOnDate("2010-07-19", TODAY), 15);
});

test("activates a student aged 16 or older", () => {
  const onboarding = normalizeStudentOnboarding(null, {
    fullName: "Nguyen Minh Anh",
    gradeLevel: 10,
    dateOfBirth: "2010-07-18",
  }, TODAY);

  assert.equal(onboarding.accountStatus, "ACTIVE");
  assert.equal(onboarding.gradeBand, "high_school");
  assert.equal(onboarding.requiresGuardianConsent, false);
  assert.equal(onboarding.guardianEmail, null);
});

test("activates an under-16 account without requiring guardian email (disabled COPPA)", () => {
  const onboarding = normalizeStudentOnboarding(null, {
    fullName: "Minh",
    gradeLevel: 7,
    dateOfBirth: "2012-08-01",
    guardianEmail: "guardian@example.com",
  }, TODAY);
  assert.equal(onboarding.accountStatus, "ACTIVE");
  assert.equal(onboarding.gradeBand, "secondary");
  assert.equal(onboarding.guardianEmail, "guardian@example.com");
});

test("requires an exact grade from 1 to 12", () => {
  assert.throws(
    () => normalizeStudentOnboarding(null, {
      fullName: "Minh",
      gradeLevel: 13,
      dateOfBirth: "2012-08-01",
      guardianEmail: "guardian@example.com",
    }, TODAY),
    { code: "VALIDATION_ERROR" },
  );
});

test("normalizes account statuses and learning access", () => {
  assert.equal(normalizeAccountStatus("suspended"), "SUSPENDED");
  assert.equal(normalizeAccountStatus("unknown"), "ACTIVE");
  assert.equal(isLearningAccountActive("ACTIVE"), true);
  assert.equal(isLearningAccountActive("AT_RISK"), true);
  assert.equal(isLearningAccountActive("PENDING"), false);
});

test("self-registration can activate the selected teacher role", () => {
  assert.equal(onboardingRole({ user_metadata: { role: "teacher" } }), "teacher");
  assert.equal(onboardingRole({}, { role: "teacher" }), "teacher");
  assert.equal(onboardingRole({ app_metadata: { provisioned_role: "teacher" } }), "teacher");
  assert.equal(onboardingRole({ app_metadata: { provisioned_role: "admin" } }), "student");
});
