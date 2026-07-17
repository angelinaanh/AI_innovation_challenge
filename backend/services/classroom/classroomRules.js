// Pure, testable logic for the classroom (classes + memberships) feature.
import crypto from "node:crypto";

export const GRADE_BANDS = ["primary", "secondary", "high_school"];
export const STEAM_AXES = ["S", "T", "E", "A", "M"];

export function isGradeBand(value) {
  return GRADE_BANDS.includes(value);
}

// Human-friendly join code, ambiguous characters removed.
export function generateJoinCode(length = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i += 1) code += alphabet[bytes[i] % alphabet.length];
  return code;
}

// Membership state machine. Two entry points (invited by teacher, requested by
// student), each resolved by exactly one actor. Returns the next status or
// throws a coded error for an illegal transition.
const TRANSITIONS = {
  // action: { from -> to, actor }
  accept_invite: { from: "invited", to: "active", actor: "student" },
  decline_invite: { from: "invited", to: "rejected", actor: "student" },
  approve_request: { from: "requested", to: "active", actor: "teacher" },
  reject_request: { from: "requested", to: "rejected", actor: "teacher" },
};

export function nextMembershipStatus(action, currentStatus) {
  const rule = TRANSITIONS[action];
  if (!rule) {
    const error = new Error("Hành động không hợp lệ.");
    error.code = "VALIDATION_ERROR";
    throw error;
  }
  if (currentStatus !== rule.from) {
    const error = new Error("Trạng thái thành viên không cho phép thao tác này.");
    error.code = "MEMBERSHIP_INVALID_STATE";
    throw error;
  }
  return rule.to;
}

export function membershipActor(action) {
  return TRANSITIONS[action]?.actor || null;
}
