import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileUp,
  GripVertical,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../../lib/apiClient.js";
import { FormAlert, FormField } from "../auth/AuthFormControls.jsx";
import { GeneratedLessonEditor } from "./GeneratedLessonEditor.jsx";

const GRADES = Array.from({ length: 12 }, (_, index) => index + 1);

// Giữ đồng bộ với backend (aiContentGenerator: MAX_UPLOAD_BYTES / parseDocument).
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB
const ACCEPTED_EXTENSIONS = [".pdf", ".txt", ".md"];

const initialConfig = {
  subject: "",
  grade: "",
  level: "Basic",
  quizCount: 3,
  requireQuest: true,
  note: "", // Ghi chú dành cho giáo viên — đưa thêm vào prompt tạo dàn ý.
};

async function postOutline(config, file) {
  const body = new FormData();
  body.append("file", file);
  body.append("subject", config.subject.trim());
  body.append("grade", String(config.grade));
  body.append("level", config.level);
  body.append("quiz_count", String(config.quizCount));
  body.append("teacher_note", config.note.trim());
  return api.generateOutline(body);
}

async function postGenerate(payload) {
  return api.generateLessons(payload);
}

// ID cục bộ cho chương/bài/mục do giáo viên thêm tay — chỉ cần duy nhất để làm
// React key và neo danh tính bài học khi sinh nội dung.
let idCounter = 0;
function uid(prefix) {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

function newSection() {
  return { section_id: uid("sec"), section_title: "", intent: "" };
}
function newLesson() {
  return { lesson_id: uid("ls"), lesson_title: "", estimated_time_minutes: 15, sections: [newSection()] };
}
function newChapter() {
  return {
    chapter_id: uid("ch"),
    chapter_title: "",
    chapter_objective: "",
    exam: { enabled: true, question_count: 10 },
    lessons: [newLesson()],
  };
}

// Bổ sung cấu hình Exam mặc định vào dàn ý AI trả về (AI chỉ sinh chương/bài/mục).
// Giáo viên bật/tắt và chỉnh số câu ở bước duyệt; cấu hình đi kèm course_outline.
function withExamDefaults(course) {
  const next = structuredClone(course);
  next.exams = next.exams || {
    midterm: { enabled: false, question_count: 20 },
    final: { enabled: true, question_count: 30 },
  };
  for (const chapter of next.chapters || []) {
    chapter.exam = chapter.exam || { enabled: true, question_count: 10 };
  }
  return next;
}

// Ô cấu hình một bài Exam: bật/tắt + số lượng câu hỏi (khóa ô số khi tắt).
function ExamControl({ label, hint, value, onChange }) {
  const enabled = Boolean(value?.enabled);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3.5">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
          checked={enabled}
          onChange={(event) => onChange({ ...value, enabled: event.target.checked })}
        />
        <span>
          <span className="block text-xs font-black text-slate-700">{label}</span>
          {hint && <span className="mt-0.5 block text-xs font-medium text-slate-500">{hint}</span>}
        </span>
      </label>
      <label className={`flex items-center gap-2 text-xs font-black ${enabled ? "text-slate-700" : "text-slate-300"}`}>
        Số câu hỏi
        <input
          type="number"
          min={1}
          max={100}
          disabled={!enabled}
          className="auth-input !w-20 px-2.5 text-sm disabled:opacity-50"
          value={value?.question_count ?? 10}
          onChange={(event) => onChange({ ...value, question_count: event.target.value })}
        />
      </label>
    </div>
  );
}

export function TeacherLessonGeneratorPage() {
  // step: "config" (form + upload) -> "outline" (giáo viên duyệt dàn ý)
  //    -> "lessons" (giáo viên sửa bài giảng) -> "saved"
  const [step, setStep] = useState("config");
  const [config, setConfig] = useState(initialConfig);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const [course, setCourse] = useState(null); // course_outline: Chương -> Bài -> Mục
  const [lessons, setLessons] = useState(null); // bài giảng chi tiết đã sinh
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [saved, setSaved] = useState(null);
  const fileInputRef = useRef(null);

  // Danh sách lớp cần sẵn ở bước lưu; nạp nền ngay từ đầu để lúc bấm Hoàn
  // thành không phải chờ. Lỗi ở đây không chặn luồng sinh bài giảng.
  useEffect(() => {
    let alive = true;
    api.getTeacherClasses()
      .then((rows) => { if (alive) setClasses(rows || []); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  function update(field, value) {
    setConfig((current) => ({ ...current, [field]: value }));
  }

  function onPickFile(picked) {
    if (!picked) return;
    const name = picked.name.toLowerCase();
    // Reset input để lần sau chọn lại cùng file vẫn kích hoạt onChange.
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
      setFile(null);
      setError("Sai định dạng tài liệu. Vui lòng tải lên đúng định dạng PDF hoặc Text (.txt, .md).");
      return;
    }
    if (picked.size > MAX_UPLOAD_BYTES) {
      setFile(null);
      setError("Tài liệu vượt quá 20MB. Vui lòng tải lên tài liệu nhỏ hơn 20MB.");
      return;
    }
    setError(null);
    setFile(picked);
  }

  async function createOutline(event) {
    event.preventDefault();
    if (!file) { setError("Hãy tải lên tài liệu gốc (PDF hoặc Text)."); return; }
    setBusy(true);
    setError(null);
    try {
      const data = await postOutline(config, file);
      setDocumentId(data.document_id);
      setCourse(withExamDefaults(data.course_outline));
      setStep("outline");
    } catch (outlineError) {
      setError(outlineError.message);
    } finally {
      setBusy(false);
    }
  }

  // Cập nhật sâu vào course_outline theo (chapterIndex, lessonIndex, sectionIndex).
  function updateCourse(mutate) {
    setCourse((current) => {
      const next = structuredClone(current);
      mutate(next);
      return next;
    });
  }

  // ---- Chương ----
  function updateChapter(ci, field, value) {
    updateCourse((next) => { next.chapters[ci][field] = value; });
  }
  function removeChapter(ci) {
    updateCourse((next) => { next.chapters.splice(ci, 1); });
  }
  function addChapter() {
    updateCourse((next) => { next.chapters.push(newChapter()); });
  }
  function updateChapterExam(ci, exam) {
    updateCourse((next) => { next.chapters[ci].exam = exam; });
  }

  // ---- Bài học ----
  function updateLesson(ci, li, field, value) {
    updateCourse((next) => { next.chapters[ci].lessons[li][field] = value; });
  }
  function removeLesson(ci, li) {
    updateCourse((next) => { next.chapters[ci].lessons.splice(li, 1); });
  }
  function addLesson(ci) {
    updateCourse((next) => { next.chapters[ci].lessons.push(newLesson()); });
  }

  // ---- Mục nhỏ ----
  function updateSection(ci, li, si, field, value) {
    updateCourse((next) => { next.chapters[ci].lessons[li].sections[si][field] = value; });
  }
  function removeSection(ci, li, si) {
    updateCourse((next) => { next.chapters[ci].lessons[li].sections.splice(si, 1); });
  }
  function addSection(ci, li) {
    updateCourse((next) => { next.chapters[ci].lessons[li].sections.push(newSection()); });
  }

  // ---- Exam toàn môn (giữa kỳ / cuối kỳ) ----
  function updateCourseExam(which, exam) {
    updateCourse((next) => {
      next.exams = next.exams || {};
      next.exams[which] = exam;
    });
  }

  // Bỏ mục trống trước khi gửi — mục không tiêu đề sẽ khiến AI viết lạc đề.
  function prunedCourse() {
    const next = structuredClone(course);
    for (const chapter of next?.chapters || []) {
      for (const lesson of chapter.lessons || []) {
        lesson.sections = (lesson.sections || [])
          .filter((section) => String(section.section_title || "").trim());
      }
      chapter.lessons = (chapter.lessons || []).filter((lesson) => lesson.sections.length > 0);
    }
    next.chapters = (next?.chapters || []).filter((chapter) => chapter.lessons.length > 0);
    return next;
  }

  async function generateLessons() {
    const pruned = prunedCourse();
    if (pruned.chapters.length === 0) { setError("Dàn ý cần ít nhất một bài học còn mục."); return; }
    setBusy(true);
    setError(null);
    try {
      const data = await postGenerate({
        course_outline: pruned,
        document_id: documentId,
        subject: config.subject.trim(),
        grade: String(config.grade),
        level: config.level,
        quiz_count: Number(config.quizCount),
        require_quest: config.requireQuest,
        teacher_note: config.note.trim(),
      });
      setLessons(data.lessons);
      setStep("lessons");
    } catch (generateError) {
      setError(generateError.message);
    } finally {
      setBusy(false);
    }
  }

  // Bước cuối: lưu khóa bài giảng đã chỉnh sửa vào lớp giáo viên chọn.
  async function saveCourse() {
    if (!classId) { setError("Hãy chọn lớp để lưu bài giảng."); return; }
    setBusy(true);
    setError(null);
    try {
      const data = await api.saveAiCourse({
        classId,
        subject: config.subject.trim(),
        grade: String(config.grade),
        level: config.level,
        quizCount: Number(config.quizCount),
        documentId,
        sourceFilename: file?.name || null,
        courseOutline: course,
        lessons,
      });
      setSaved(data);
      setStep("saved");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  function restart() {
    setStep("config");
    setConfig(initialConfig);
    setFile(null);
    setDocumentId(null);
    setCourse(null);
    setLessons(null);
    setClassId("");
    setSaved(null);
    setError(null);
  }

  return (
    <div className="space-y-5">
      <header className="border-b border-slate-200 pb-5">
        <p className="eyebrow">Content Studio · AI</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950 md:text-3xl">Tạo bài giảng bằng AI</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Tải tài liệu gốc lên, AI đề xuất dàn ý — bạn duyệt và chỉnh sửa dàn ý trước khi AI viết bài giảng chi tiết kèm quiz.
        </p>
      </header>

      {/* Step indicator */}
      <ol className="flex flex-wrap items-center gap-2 text-xs font-black" aria-label="Các bước">
        {[
          ["config", "1. Cấu hình & tài liệu"],
          ["outline", "2. Duyệt dàn ý"],
          ["lessons", "3. Sửa bài giảng"],
          ["saved", "4. Hoàn thành"],
        ].map(([key, label], index) => (
          <li key={key} className="flex items-center gap-2">
            {index > 0 && <ArrowRight size={14} className="text-slate-300" />}
            <span className={`rounded-md px-2.5 py-1.5 ${step === key ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"}`}>{label}</span>
          </li>
        ))}
      </ol>

      <FormAlert>{error}</FormAlert>

      {/* ------------------------------------------------ Bước 1: form ---- */}
      {step === "config" && (
        <form className="surface max-w-3xl space-y-5 p-5 sm:p-6" onSubmit={createOutline}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Tên môn học"
              value={config.subject}
              onChange={(event) => update("subject", event.target.value)}
              placeholder="Ví dụ: Tin học"
              maxLength={80}
              required
            />
            <label className="block">
              <span className="mb-2 block text-xs font-black text-slate-700">Lớp</span>
              <select className="auth-input px-3.5" value={config.grade} onChange={(event) => update("grade", event.target.value)} required>
                <option value="">Chọn lớp</option>
                {GRADES.map((grade) => <option key={grade} value={grade}>Lớp {grade}</option>)}
              </select>
            </label>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-black text-slate-700">Trình độ</span>
              <select className="auth-input px-3.5" value={config.level} onChange={(event) => update("level", event.target.value)}>
                <option value="Basic">Cơ bản</option>
                <option value="Advanced">Nâng cao</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-black text-slate-700">Số câu quiz cuối mỗi bài</span>
              <input
                type="number" min={1} max={10} className="auth-input px-3.5"
                value={config.quizCount}
                onChange={(event) => update("quizCount", event.target.value)}
                required
              />
            </label>
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3.5">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
              checked={config.requireQuest}
              onChange={(event) => update("requireQuest", event.target.checked)}
            />
            <span>
              <span className="block text-xs font-black text-slate-700">Tạo nhiệm vụ thực hành cuối mỗi bài</span>
              <span className="mt-0.5 block text-xs font-medium text-slate-500">
                Nhiệm vụ mở theo bối cảnh thực tế (Webb DoK 3) — học sinh nộp sản phẩm thay vì chỉ làm trắc nghiệm.
              </span>
            </span>
          </label>

          <div>
            <span className="mb-2 block text-xs font-black text-slate-700">Cung cấp tri thức — tài liệu gốc (PDF, Text)</span>
            <button
              type="button"
              className={`flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-sm font-bold transition ${file ? "border-emerald-300 bg-emerald-50/50 text-emerald-800" : "border-slate-300 text-slate-500 hover:border-emerald-300 hover:bg-emerald-50/30"}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { event.preventDefault(); onPickFile(event.dataTransfer.files?.[0]); }}
            >
              {file ? <CheckCircle2 size={22} /> : <FileUp size={22} />}
              {file ? `Đã chọn: ${file.name}` : "Bấm để chọn hoặc kéo thả file PDF / TXT vào đây"}
              <span className="text-xs font-medium text-slate-400">Tối đa 20MB · Chỉ dùng tài liệu bạn được phép sử dụng</span>
            </button>
            <input
              ref={fileInputRef} type="file" accept=".pdf,.txt,.md" className="hidden"
              onChange={(event) => onPickFile(event.target.files?.[0])}
            />
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-black text-slate-700">Ghi chú dành cho giáo viên <span className="font-medium text-slate-400">(tùy chọn)</span></span>
            <textarea
              className="auth-input min-h-24 resize-y px-3.5 py-2.5 text-sm"
              value={config.note}
              onChange={(event) => update("note", event.target.value)}
              placeholder="Yêu cầu/định hướng riêng để AI bám theo khi lập dàn ý. VD: tập trung chương 2–3, bỏ phần phụ lục, nhấn mạnh ví dụ thực tế..."
              maxLength={1000}
            />
            <span className="mt-1 block text-xs font-medium text-slate-400">
              AI sẽ ưu tiên tuân theo ghi chú này khi tạo dàn ý, miễn là không mâu thuẫn với tài liệu gốc.
            </span>
          </label>

          <div className="flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-bold text-sky-800">
            <Bot size={17} />
            AI chỉ đề xuất bản nháp — bạn sẽ duyệt dàn ý và nội dung trước khi sử dụng với học sinh.
          </div>

          <div className="flex justify-end">
            <button type="submit" className="primary-button" disabled={busy || !config.subject.trim() || !config.grade || !file}>
              {busy ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
              {busy ? "Đang phân tích tài liệu..." : "Tạo dàn ý"}
            </button>
          </div>
        </form>
      )}

      {/* --------------------------------------- Bước 2: duyệt dàn ý ---- */}
      {step === "outline" && course && (
        <section className="max-w-3xl space-y-4">
          <div className="surface space-y-3 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-black text-slate-950">Duyệt dàn ý & cấu trúc bài kiểm tra</h2>
              <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">{config.subject} · Lớp {config.grade}</span>
            </div>
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800">
              Bước này chỉ chốt cấu trúc tiêu đề (chương/bài/mục) và số lượng câu hỏi cho các bài Exam — chưa sinh nội dung chi tiết.
            </p>
            <label className="block">
              <span className="mb-2 block text-xs font-black text-slate-700">Mục tiêu tổng thể khóa học</span>
              <textarea
                className="auth-input min-h-16 resize-y px-3.5 py-2.5 text-sm"
                value={course.overall_objective || ""}
                onChange={(event) => updateCourse((next) => { next.overall_objective = event.target.value; })}
                placeholder="Tóm tắt mục tiêu toàn khóa học trong 1-2 câu"
                maxLength={600}
              />
            </label>
          </div>

          {course.chapters.map((chapter, ci) => (
            <article key={chapter.chapter_id} className="surface space-y-4 p-5 sm:p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="eyebrow">Chương {ci + 1}</p>
                  <button
                    type="button" className="icon-button inline-grid text-rose-500"
                    aria-label="Xóa chương" title="Xóa chương" onClick={() => removeChapter(ci)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <input
                  className="auth-input px-3.5 text-base font-black" value={chapter.chapter_title}
                  onChange={(event) => updateChapter(ci, "chapter_title", event.target.value)}
                  placeholder="Tên chương (VD: Chương 1: Động lực học)" maxLength={300}
                />
                <input
                  className="auth-input px-3.5 text-xs" value={chapter.chapter_objective || ""}
                  onChange={(event) => updateChapter(ci, "chapter_objective", event.target.value)}
                  placeholder="Mục tiêu cốt lõi của chương (tùy chọn)" maxLength={600}
                />
              </div>

              {chapter.lessons.map((lesson, li) => (
                <div key={lesson.lesson_id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start gap-2">
                    <span className="mt-2 shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">Bài {ci + 1}.{li + 1}</span>
                    <input
                      className="auth-input min-w-0 flex-1 px-3 text-sm font-extrabold" value={lesson.lesson_title}
                      onChange={(event) => updateLesson(ci, li, "lesson_title", event.target.value)}
                      placeholder="Tên bài học" maxLength={300}
                    />
                    <label className="flex items-center gap-1.5 rounded-md bg-violet-50 px-2 py-1 text-[11px] font-black text-violet-700" title="Thời lượng dự kiến (phút)">
                      <Clock3 size={13} />
                      <input
                        type="number" min={5} max={180}
                        className="w-12 bg-transparent text-right outline-none"
                        value={lesson.estimated_time_minutes}
                        onChange={(event) => updateLesson(ci, li, "estimated_time_minutes", event.target.value)}
                      />
                      phút
                    </label>
                    <button
                      type="button" className="icon-button mt-0.5 inline-grid text-rose-500"
                      aria-label="Xóa bài học" title="Xóa bài học" onClick={() => removeLesson(ci, li)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    {lesson.sections.map((section, si) => (
                      <div key={section.section_id} className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                        <GripVertical size={16} className="mt-2.5 shrink-0 text-slate-300" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <input
                            className="auth-input px-3 text-sm font-extrabold" value={section.section_title}
                            onChange={(event) => updateSection(ci, li, si, "section_title", event.target.value)}
                            placeholder="Tên mục (VD: I. Khái niệm cơ bản)" maxLength={300}
                          />
                          <input
                            className="auth-input px-3 text-xs" value={section.intent}
                            onChange={(event) => updateSection(ci, li, si, "intent", event.target.value)}
                            placeholder="Ghi chú: mục này dạy gì" maxLength={1000}
                          />
                        </div>
                        <button type="button" className="icon-button mt-1 inline-grid" aria-label="Xóa mục" title="Xóa mục" onClick={() => removeSection(ci, li, si)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button type="button" className="secondary-button !min-h-9 !px-3 !text-xs" onClick={() => addSection(ci, li)}><Plus size={14} />Thêm mục</button>
                  </div>
                </div>
              ))}

              <button type="button" className="secondary-button !min-h-9 !text-xs" onClick={() => addLesson(ci)}><Plus size={14} />Thêm bài học</button>

              {/* Exam sau chương */}
              <ExamControl
                label={`Exam sau chương ${ci + 1}`}
                hint="Bài kiểm tra ngay sau khi học xong chương này."
                value={chapter.exam}
                onChange={(exam) => updateChapterExam(ci, exam)}
              />
            </article>
          ))}

          <button type="button" className="secondary-button w-full" onClick={addChapter}><Plus size={16} />Thêm chương</button>

          {/* Exam toàn môn học */}
          <div className="surface space-y-3 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-slate-500" />
              <h3 className="text-base font-black text-slate-950">Kỳ thi toàn môn học</h3>
            </div>
            <ExamControl
              label="Exam giữa kỳ (nửa môn học)"
              hint="Tổng hợp kiến thức nửa đầu môn học."
              value={course.exams?.midterm}
              onChange={(exam) => updateCourseExam("midterm", exam)}
            />
            <ExamControl
              label="Exam cuối kỳ (cuối môn học)"
              hint="Tổng hợp kiến thức toàn bộ môn học."
              value={course.exams?.final}
              onChange={(exam) => updateCourseExam("final", exam)}
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button type="button" className="secondary-button" onClick={() => setStep("config")} disabled={busy}><ArrowLeft size={16} />Quay lại</button>
            <button type="button" className="primary-button" onClick={generateLessons} disabled={busy}>
              {busy ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
              {busy ? "AI đang viết từng bài..." : "Chốt cấu trúc & tạo bài giảng"}
            </button>
          </div>
        </section>
      )}

      {/* --------------------------------- Bước 3: sửa bài giảng ---- */}
      {step === "lessons" && lessons && (
        <section className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
            <CheckCircle2 size={17} />
            Đã sinh {lessons.length} bài giảng. Bấm vào từng bài để sửa nội dung, xóa khối hoặc câu hỏi không phù hợp.
          </div>

          <GeneratedLessonEditor lessons={lessons} onChange={setLessons} />

          <div className="surface space-y-4 p-5 sm:p-6">
            <div>
              <h2 className="text-base font-black text-slate-950">Lưu vào lớp học</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Bài giảng sẽ được lưu ở trạng thái nháp trong lớp bạn chọn.
              </p>
            </div>
            {classes.length === 0 ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
                Bạn chưa có lớp nào. Hãy <Link to="/teacher" className="underline">tạo lớp học</Link> trước khi lưu bài giảng.
              </p>
            ) : (
              <label className="block">
                <span className="mb-2 block text-xs font-black text-slate-700">Lớp</span>
                <select className="auth-input px-3.5" value={classId} onChange={(event) => setClassId(event.target.value)} required>
                  <option value="">Chọn lớp</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}{item.gradeLevel ? ` · Lớp ${item.gradeLevel}` : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button type="button" className="secondary-button" onClick={() => setStep("outline")} disabled={busy}>
              <ArrowLeft size={16} />Sửa dàn ý & sinh lại
            </button>
            <button type="button" className="primary-button" onClick={saveCourse} disabled={busy || !classId}>
              {busy ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
              {busy ? "Đang lưu..." : "Hoàn thành & lưu bài giảng"}
            </button>
          </div>
        </section>
      )}

      {/* ------------------------------------------ Bước 4: đã lưu ---- */}
      {step === "saved" && saved && (
        <section className="surface mx-auto max-w-xl space-y-5 p-6 text-center sm:p-8">
          <CheckCircle2 size={40} className="mx-auto text-emerald-600" />
          <div>
            <h2 className="text-xl font-black text-slate-950">Đã lưu bài giảng</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              {saved.lessonCount} bài giảng và {saved.questionCount} câu hỏi đã được lưu vào lớp
              {" "}<span className="font-black text-slate-800">{saved.className}</span> ở trạng thái nháp.
              Học sinh chỉ nhìn thấy sau khi bạn xuất bản.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/teacher/ai-lessons/library" className="secondary-button">
              <ArrowRight size={16} />Xem & xuất bản
            </Link>
            <button type="button" className="primary-button" onClick={restart}>
              <RefreshCw size={16} />Tạo bài giảng mới
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
