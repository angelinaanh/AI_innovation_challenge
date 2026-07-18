export const GRADE_LEVELS = Object.freeze(
  Array.from({ length: 12 }, (_, index) => index + 1),
);

export const STEAM_AXES = Object.freeze(["S", "T", "E", "A", "M"]);

const SUBJECT_DEFINITIONS = Object.freeze([
  { name: "Tự nhiên và Xã hội", steamAxis: "S", grades: [1, 2, 3] },
  { name: "Khoa học", steamAxis: "S", grades: [4, 5] },
  { name: "Khoa học tự nhiên", steamAxis: "S", grades: [6, 7, 8, 9] },
  { name: "Vật lý", steamAxis: "S", grades: [10, 11, 12] },
  { name: "Hóa học", steamAxis: "S", grades: [10, 11, 12] },
  { name: "Sinh học", steamAxis: "S", grades: [10, 11, 12] },
  { name: "Tin học", steamAxis: "T", grades: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { name: "Công nghệ", steamAxis: "E", grades: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { name: "Tiếng Việt", steamAxis: "A", grades: [1, 2, 3, 4, 5] },
  { name: "Ngữ văn", steamAxis: "A", grades: [6, 7, 8, 9, 10, 11, 12] },
  { name: "Mỹ thuật", steamAxis: "A", grades: GRADE_LEVELS },
  { name: "Âm nhạc", steamAxis: "A", grades: GRADE_LEVELS },
  { name: "Đạo đức", steamAxis: "A", grades: [1, 2, 3, 4, 5] },
  { name: "Lịch sử và Địa lý", steamAxis: "A", grades: [6, 7, 8, 9] },
  { name: "Lịch sử", steamAxis: "A", grades: [10, 11, 12] },
  { name: "Địa lý", steamAxis: "A", grades: [10, 11, 12] },
  { name: "Toán", steamAxis: "M", grades: GRADE_LEVELS },
]);

export const SUBJECT_CATALOG = Object.freeze(
  SUBJECT_DEFINITIONS.flatMap(({ name, steamAxis, grades }) =>
    grades.map((gradeLevel) => Object.freeze({
      name,
      steamAxis,
      gradeLevel,
      gradeBand: gradeBandForLevel(gradeLevel),
    }))),
);

export function normalizeGradeLevel(value) {
  if (value === "" || value === null || value === undefined) return null;
  const gradeLevel = Number(value);
  return Number.isInteger(gradeLevel) && gradeLevel >= 1 && gradeLevel <= 12
    ? gradeLevel
    : null;
}

export function isGradeLevel(value) {
  return normalizeGradeLevel(value) !== null;
}

export function gradeBandForLevel(value) {
  const gradeLevel = Number(value);
  if (!Number.isInteger(gradeLevel)) return null;
  if (gradeLevel >= 1 && gradeLevel <= 5) return "primary";
  if (gradeLevel >= 6 && gradeLevel <= 9) return "secondary";
  if (gradeLevel >= 10 && gradeLevel <= 12) return "high_school";
  return null;
}

export function subjectsForGrade(value) {
  const gradeLevel = normalizeGradeLevel(value);
  if (!gradeLevel) return [];
  return SUBJECT_CATALOG.filter((subject) => subject.gradeLevel === gradeLevel);
}

export function isSubjectAllowedForGrade(name, value) {
  const gradeLevel = normalizeGradeLevel(value);
  return Boolean(gradeLevel) && SUBJECT_CATALOG.some(
    (subject) => subject.gradeLevel === gradeLevel && subject.name === name,
  );
}
