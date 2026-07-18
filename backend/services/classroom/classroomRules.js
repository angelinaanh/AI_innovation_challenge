// Pure, testable logic for the classroom (classes + memberships) feature.
import crypto from "node:crypto";

export const GRADE_BANDS = ["primary", "secondary", "high_school"];
export const STEAM_AXES = ["S", "T", "E", "A", "M"];
export const GRADE_RANGE_BY_BAND = {
  primary: [1, 5],
  secondary: [6, 9],
  high_school: [10, 12],
};

export function isGradeBand(value) {
  return GRADE_BANDS.includes(value);
}

// Kiểm tra lớp cụ thể (1-12) có thuộc đúng khối đã chọn hay không.
export function isGradeInBand(grade, gradeBand) {
  const range = GRADE_RANGE_BY_BAND[gradeBand];
  if (!range) return false;
  return Number.isInteger(grade) && grade >= range[0] && grade <= range[1];
}

// Bảng phân loại môn học theo lĩnh vực STEAM x khối lớp (GDPT 2018).
// Nguồn sự thật cứng, độc lập với subjects.min_grade/max_grade trên DB —
// curriculum này cố định, không cần chờ migration 0004 backfill mới đúng.
// Cùng 1 tên môn (VD "Tin học", "Công nghệ", "Toán") lặp lại ở nhiều khối
// với phạm vi lớp khác nhau nên khoá theo (gradeBand, name).
export const SUBJECT_GRADE_RANGES = {
  primary: {
    "Tự nhiên & Xã hội": [1, 3],
    "Khoa học": [4, 5],
    "Tin học": [3, 5],
    "Công nghệ": [3, 5],
    "Tiếng Việt": [1, 5],
    "Mỹ thuật": [1, 5],
    "Âm nhạc": [1, 5],
    "Đạo đức": [1, 5],
    "Toán": [1, 5],
  },
  secondary: {
    "Khoa học tự nhiên": [6, 9],
    "Tin học": [6, 9],
    "Công nghệ": [6, 9],
    "Ngữ văn": [6, 9],
    "Mỹ thuật": [6, 9],
    "Âm nhạc": [6, 9],
    "Lịch sử & Địa lý": [6, 9],
    "Toán": [6, 9],
  },
  high_school: {
    "Vật lý": [10, 12],
    "Hóa học": [10, 12],
    "Sinh học": [10, 12],
    "Tin học": [10, 12],
    "Công nghệ": [10, 12],
    "Ngữ văn": [10, 12],
    "Mỹ thuật": [10, 12],
    "Âm nhạc": [10, 12],
    "Lịch sử": [10, 12],
    "Địa lý": [10, 12],
    "Toán": [10, 12],
  },
};

// Trả về [min, max] cho (gradeBand, subject name), hoặc null nếu môn này
// không nằm trong danh mục GDPT 2018 cố định (VD môn tổ chức tự thêm sau).
export function subjectGradeRange(gradeBand, name) {
  return SUBJECT_GRADE_RANGES[gradeBand]?.[name] || null;
}

// Môn `name` (trong `gradeBand`) có được dạy ở đúng `grade` cụ thể không.
// Ưu tiên bảng cứng ở trên; nếu môn lạ không có trong bảng, rơi về
// min_grade/max_grade từ DB (migration 0004); nếu cả hai đều thiếu, chỉ
// còn so khớp grade_band (kém chính xác nhất, dữ liệu cũ trước 0004).
export function isSubjectInGrade(subject, gradeBand, grade) {
  const fixedRange = subjectGradeRange(gradeBand, subject.name);
  if (fixedRange) return Number.isInteger(grade) && grade >= fixedRange[0] && grade <= fixedRange[1];
  if (subject.min_grade != null && subject.max_grade != null) {
    return Number.isInteger(grade) && grade >= subject.min_grade && grade <= subject.max_grade;
  }
  return subject.grade_band === gradeBand;
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
