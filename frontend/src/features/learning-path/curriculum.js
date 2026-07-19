// Danh mục môn học theo cấp học + tiện ích đọc tiến độ lộ trình đã lưu client-side.
// Tách khỏi LearningPathPage để trang Tổng quan dùng lại được (khối "Môn đang học dở").
import { GRADE9_SYLLABUS } from "./grade9Syllabus.js";

// Lớp -> cấp học (khối), để lọc đúng danh mục môn theo lớp của học sinh.
export function bandOfGrade(grade) {
  if (grade <= 5) return "primary";
  if (grade <= 9) return "secondary";
  return "high_school";
}

export const SUBJECT_ICONS = {
  math: "➕",
  natural_society: "🌱",
  science: "🔬",
  technology: "🛠️",
  scratch: "💻",
  arts: "🎨",
  natural_science: "🧪",
  physics: "⚛️",
  chemistry: "⚗️",
  biology: "🧬",
};

export const CURRICULUM = {
  primary: [
    { key: "math", name: "Toán học", steam: ["S", "A", "M"], grades: [1, 2, 3, 4, 5] },
    { key: "natural_society", name: "Tự nhiên & Xã hội", steam: ["S", "M"], grades: [1, 2, 3] },
    { key: "science", name: "Khoa học", steam: ["S", "M"], grades: [4, 5] },
    { key: "technology", name: "Công Nghệ", steam: ["S", "E"], grades: [3, 4, 5] },
    { key: "scratch", name: "Tin học", steam: ["T", "M"], grades: [3, 4, 5] },
    { key: "arts", name: "Nghệ thuật (Mỹ thuật, Âm nhạc)", steam: ["A", "E", "M"], grades: [1, 2, 3, 4, 5] },
  ],
  secondary: [
    { key: "math", name: "Toán học", steam: ["M", "T", "E"], grades: [6, 7, 8, 9] },
    { key: "natural_science", name: "Khoa học Tự nhiên", steam: ["S", "M", "E"], grades: [6, 7, 8, 9] },
    { key: "technology", name: "Công nghệ", steam: ["E", "S", "M"], grades: [6, 7, 8, 9] },
    { key: "scratch", name: "Tin học", steam: ["T", "M", "E"], grades: [6, 7, 8, 9] },
    { key: "arts", name: "Nghệ thuật (Mỹ thuật, Âm nhạc)", steam: ["A", "T", "E"], grades: [6, 7, 8, 9] },
  ],
  high_school: [
    { key: "math", name: "Toán học", steam: ["M", "T", "E"], grades: [10, 11, 12] },
    { key: "physics", name: "Vật lí", steam: ["S", "M", "E"], grades: [10, 11, 12] },
    { key: "chemistry", name: "Hóa học", steam: ["S", "M", "E"], grades: [10, 11, 12] },
    { key: "biology", name: "Sinh học", steam: ["S", "M", "E"], grades: [10, 11, 12] },
    { key: "technology", name: "Công nghệ", steam: ["E", "T", "S", "M"], grades: [10, 11, 12] },
    { key: "scratch", name: "Tin học", steam: ["T", "M", "E"], grades: [10, 11, 12] },
    { key: "arts", name: "Nghệ thuật (Mỹ thuật, Âm nhạc)", steam: ["A", "T", "E"], grades: [10, 11, 12] },
  ],
};

/** Các môn đúng lớp của học sinh (VD lớp 9 -> các môn có grade 9). */
export function subjectsForGrade(grade) {
  return (CURRICULUM[bandOfGrade(grade)] ?? []).filter((subject) => subject.grades.includes(grade));
}

/** Khóa localStorage lưu tiến độ lộ trình chi tiết — khớp với LearningPathDetail. */
export function progressStorageKey(grade, subjectKey) {
  return `eduone:lp:${grade}:${subjectKey}`;
}

/** Danh sách id bài đã hoàn thành đã lưu client-side (rỗng nếu chưa học/không đọc được). */
export function readLocalProgress(grade, subjectKey) {
  try {
    const raw = localStorage.getItem(progressStorageKey(grade, subjectKey));
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Tổng số bài học của một môn theo syllabus bundled (0 nếu chưa có dữ liệu môn đó). */
export function countSyllabusLessons(subjectKey) {
  const syllabus = GRADE9_SYLLABUS[subjectKey];
  if (!syllabus?.parts) return 0;
  return syllabus.parts.reduce(
    (total, part) => total + (part.chapters || []).reduce(
      // Chương chưa có danh sách bài vẫn tính là 1 "bài" (khớp cách LearningPathDetail làm phẳng).
      (sum, chapter) => sum + (chapter.lessons?.length || 1),
      0,
    ),
    0,
  );
}

/**
 * Các môn học sinh đang học dở: đã hoàn thành ít nhất 1 bài nhưng chưa xong hết.
 * Sắp xếp theo số bài đã học giảm dần để môn đang tập trung nằm trên cùng.
 */
export function inProgressSubjects(grade) {
  return subjectsForGrade(grade)
    .map((subject) => {
      // Bonus cuối chương không tính vào tiến độ bài học.
      const done = readLocalProgress(grade, subject.key).filter((id) => !String(id).endsWith("#bonus")).length;
      const total = countSyllabusLessons(subject.key);
      const pct = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
      return { subject, done, total, pct };
    })
    .filter((entry) => entry.done > 0 && (entry.total === 0 || entry.done < entry.total))
    .sort((a, b) => b.done - a.done);
}
