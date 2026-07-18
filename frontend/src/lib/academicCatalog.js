export const GRADE_LEVELS = Object.freeze(
  Array.from({ length: 12 }, (_, index) => index + 1),
);

export const GRADE_GROUPS = Object.freeze([
  { label: "Tiểu học", grades: [1, 2, 3, 4, 5] },
  { label: "Trung học cơ sở", grades: [6, 7, 8, 9] },
  { label: "Trung học phổ thông", grades: [10, 11, 12] },
]);

export const STEAM_AXIS_LABELS = Object.freeze({
  S: "Science - Khoa học",
  T: "Technology - Công nghệ thông tin",
  E: "Engineering - Kỹ thuật",
  A: "Arts - Nghệ thuật và Nhân văn",
  M: "Mathematics - Toán học",
});

export function gradeLabel(value) {
  const gradeLevel = Number(value);
  return Number.isInteger(gradeLevel) && gradeLevel >= 1 && gradeLevel <= 12
    ? `Lớp ${gradeLevel}`
    : "Chưa xác định lớp";
}
