import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
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

// Python AI Content Service (FastAPI) — tách khỏi backend Node.
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || "http://127.0.0.1:8000";

const GRADES = Array.from({ length: 12 }, (_, index) => index + 1);

const initialConfig = {
  subject: "",
  grade: "",
  level: "Basic",
  quizCount: 3,
  requireQuest: true,
};

// fetch() ném TypeError trần ("Failed to fetch") cho MỌI lỗi tầng mạng — service
// chưa chạy, sai port, CORS chặn — nên thông báo đó vô nghĩa với giáo viên và
// tốn hàng giờ khi debug. Bọc lại để nói đúng chỗ cần sửa và kèm URL đang gọi.
async function aiServiceFetch(path, init, fallbackMessage) {
  let response;
  try {
    response = await fetch(`${AI_SERVICE_URL}${path}`, init);
  } catch {
    throw new Error(
      `Không kết nối được AI service tại ${AI_SERVICE_URL}. `
      + "Hãy khởi động service (uvicorn app.main:app --reload --port 8000 trong thư mục ai-service) "
      + "rồi thử lại. Nếu service đang chạy ở port khác, sửa VITE_AI_SERVICE_URL trong frontend/.env.",
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(detailMessage(data?.detail) || fallbackMessage);
  return data;
}

// FastAPI trả detail dạng chuỗi khi HTTPException, nhưng dạng mảng object khi
// lỗi validation (422) — nếu đưa thẳng vào Error sẽ hiện "[object Object]".
function detailMessage(detail) {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg).filter(Boolean).join("; ");
  }
  return "";
}

async function postOutline(config, file) {
  const body = new FormData();
  body.append("file", file);
  body.append("subject", config.subject.trim());
  body.append("grade", String(config.grade));
  body.append("level", config.level);
  body.append("quiz_count", String(config.quizCount));
  return aiServiceFetch("/api/teacher/content/outline", { method: "POST", body }, "Không tạo được dàn ý.");
}

async function postGenerate(payload) {
  return aiServiceFetch(
    "/api/teacher/content/generate",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Không sinh được bài giảng.",
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
    if (!name.endsWith(".pdf") && !name.endsWith(".txt") && !name.endsWith(".md")) {
      setError("Chỉ hỗ trợ tài liệu PDF hoặc Text (.txt).");
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
      setCourse(data.course_outline);
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

  function updateSection(ci, li, si, field, value) {
    updateCourse((next) => { next.chapters[ci].lessons[li].sections[si][field] = value; });
  }

  function removeSection(ci, li, si) {
    updateCourse((next) => { next.chapters[ci].lessons[li].sections.splice(si, 1); });
  }

  function addSection(ci, li) {
    updateCourse((next) => {
      const lesson = next.chapters[ci].lessons[li];
      lesson.sections.push({
        section_id: `${lesson.lesson_id}.${lesson.sections.length + 1}-${Date.now()}`,
        section_title: "",
        intent: "",
      });
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
          <div className="surface p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-950">Dàn ý khóa học — chỉnh sửa trước khi sinh bài</h2>
                {course.overall_objective && <p className="mt-1 text-sm font-medium leading-6 text-slate-500">{course.overall_objective}</p>}
              </div>
              <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">{config.subject} · Lớp {config.grade}</span>
            </div>
          </div>

          {course.chapters.map((chapter, ci) => (
            <article key={chapter.chapter_id} className="surface space-y-4 p-5 sm:p-6">
              <div>
                <p className="eyebrow">Chương {chapter.chapter_id}</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">{chapter.chapter_title}</h3>
                {chapter.chapter_objective && <p className="mt-1 text-sm font-medium leading-6 text-slate-500">{chapter.chapter_objective}</p>}
              </div>

              {chapter.lessons.map((lesson, li) => (
                <div key={lesson.lesson_id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black text-slate-900">Bài {lesson.lesson_id}. {lesson.lesson_title}</p>
                    <span className="flex items-center gap-1.5 rounded-md bg-violet-50 px-2 py-1 text-[11px] font-black text-violet-700">
                      <Clock3 size={13} />{lesson.estimated_time_minutes} phút
                    </span>
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
            </article>
          ))}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button type="button" className="secondary-button" onClick={() => setStep("config")} disabled={busy}><ArrowLeft size={16} />Quay lại</button>
            <button type="button" className="primary-button" onClick={generateLessons} disabled={busy}>
              {busy ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
              {busy ? "AI đang viết từng bài..." : "Tạo bài giảng"}
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
