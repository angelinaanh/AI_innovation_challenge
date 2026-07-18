/**
 * Lộ trình học theo môn: đọc nội dung syllabus và tiến độ học sinh.
 *
 * Nguồn nội dung: bảng public.learning_paths (seed từ syllabusData.js). Nếu bảng
 * chưa tồn tại/chưa seed, tự fallback về syllabusData.js để tính năng luôn chạy.
 * Tiến độ: bảng public.learning_path_progress (fallback rỗng nếu chưa có bảng).
 */
import { supabase } from "../supabase.js";
import { resolveStudentId } from "../student/studentContext.js";
import { getSyllabus, listSyllabusSubjectKeys } from "./syllabusData.js";

// Mã lỗi Postgres khi bảng chưa được tạo (migration chưa chạy) — coi như "chưa
// seed" và fallback, thay vì làm hỏng cả request.
function isMissingTable(error) {
  if (!error) return false;
  const code = error.code || "";
  const message = error.message || "";
  // 42P01 = Postgres "undefined_table"; PGRST205 = PostgREST không thấy bảng
  // trong schema cache (khi migration 0013 chưa chạy).
  return code === "42P01" || code === "PGRST205"
    || /does not exist|schema cache|could not find the table/i.test(message);
}

function normalizeGrade(grade) {
  const value = Number.parseInt(grade, 10);
  return Number.isInteger(value) && value >= 1 && value <= 12 ? value : 9;
}

/** Danh sách các môn có lộ trình cho một lớp (key + tên + tóm tắt ngắn). */
export async function listLearningSubjects(gradeInput) {
  const grade = normalizeGrade(gradeInput);
  const result = await supabase
    .from("learning_paths")
    .select("subject_key,data")
    .eq("grade", grade);

  let rows = result.data;
  if (result.error) {
    if (!isMissingTable(result.error)) throw result.error;
    rows = null; // fallback
  }
  if (!rows || rows.length === 0) {
    rows = listSyllabusSubjectKeys(grade).map((subject_key) => ({
      subject_key,
      data: getSyllabus(grade, subject_key),
    }));
  }

  return {
    grade,
    subjects: rows
      .filter((row) => row.data)
      .map((row) => ({
        subjectKey: row.subject_key,
        name: row.data.name || row.subject_key,
        summary: row.data.summary || "",
        chapterCount: (row.data.parts || []).reduce((n, part) => n + (part.chapters?.length || 0), 0),
      })),
  };
}

/** Toàn bộ syllabus của một môn (dùng cho tổng quan + trang lộ trình chi tiết). */
export async function getLearningPath(gradeInput, subjectKey) {
  const grade = normalizeGrade(gradeInput);
  const result = await supabase
    .from("learning_paths")
    .select("data")
    .eq("grade", grade)
    .eq("subject_key", subjectKey)
    .maybeSingle();

  let data = result.data?.data || null;
  if (result.error && !isMissingTable(result.error)) throw result.error;
  if (!data) data = getSyllabus(grade, subjectKey); // fallback / chưa seed
  if (!data) {
    const error = new Error("Không tìm thấy lộ trình học cho môn này.");
    error.code = "CONTENT_NOT_FOUND";
    throw error;
  }
  return { grade, subjectKey, syllabus: data };
}

/** Tiến độ (mảng id đã hoàn thành) của học sinh trên một môn/lớp. */
export async function getProgress(userId, gradeInput, subjectKey) {
  const grade = normalizeGrade(gradeInput);
  const studentId = await resolveStudentId(userId);
  const result = await supabase
    .from("learning_path_progress")
    .select("completed")
    .eq("student_id", studentId)
    .eq("grade", grade)
    .eq("subject_key", subjectKey)
    .maybeSingle();

  if (result.error && !isMissingTable(result.error)) throw result.error;
  const completed = Array.isArray(result.data?.completed) ? result.data.completed : [];
  return { grade, subjectKey, completed };
}

/**
 * Lưu tiến độ. Hợp nhất (union) với bản đang có để hoàn thành luôn cộng dồn,
 * tránh mất tiến độ khi client gửi thiếu (nhiều thiết bị). Bỏ qua êm nếu bảng
 * chưa tồn tại (migration chưa chạy) — frontend vẫn giữ localStorage.
 */
export async function saveProgress(userId, gradeInput, subjectKey, completedInput, replace = false) {
  const grade = normalizeGrade(gradeInput);
  const studentId = await resolveStudentId(userId);
  const incoming = Array.isArray(completedInput)
    ? completedInput.filter((id) => typeof id === "string").slice(0, 2000)
    : [];

  // replace = true (nút "đặt lại"): ghi đè hẳn. Mặc định hợp nhất để tiến độ
  // luôn cộng dồn, không mất khi client gửi thiếu (nhiều thiết bị).
  if (replace) {
    const reset = [...new Set(incoming)];
    const written = await supabase
      .from("learning_path_progress")
      .upsert(
        { student_id: studentId, grade, subject_key: subjectKey, completed: reset, updated_at: new Date().toISOString() },
        { onConflict: "student_id,grade,subject_key" },
      );
    if (written.error && !isMissingTable(written.error)) throw written.error;
    return { grade, subjectKey, completed: reset, persisted: !written.error };
  }

  const existing = await supabase
    .from("learning_path_progress")
    .select("completed")
    .eq("student_id", studentId)
    .eq("grade", grade)
    .eq("subject_key", subjectKey)
    .maybeSingle();
  if (existing.error && !isMissingTable(existing.error)) throw existing.error;
  if (existing.error && isMissingTable(existing.error)) {
    return { grade, subjectKey, completed: incoming, persisted: false };
  }

  const merged = [...new Set([...(existing.data?.completed || []), ...incoming])];
  const upsert = await supabase
    .from("learning_path_progress")
    .upsert(
      { student_id: studentId, grade, subject_key: subjectKey, completed: merged, updated_at: new Date().toISOString() },
      { onConflict: "student_id,grade,subject_key" },
    );
  if (upsert.error) {
    if (isMissingTable(upsert.error)) return { grade, subjectKey, completed: merged, persisted: false };
    throw upsert.error;
  }
  return { grade, subjectKey, completed: merged, persisted: true };
}
