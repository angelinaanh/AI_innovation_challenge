import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  FileUp,
  GripVertical,
  ListChecks,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";

import { FormAlert, FormField } from "../auth/AuthFormControls.jsx";

// Python AI Content Service (FastAPI) — tách khỏi backend Node.
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || "http://127.0.0.1:8000";

const GRADES = Array.from({ length: 12 }, (_, index) => index + 1);

const initialConfig = {
  subject: "",
  grade: "",
  level: "Basic",
  quizCount: 3,
};

async function postOutline(config, file) {
  const body = new FormData();
  body.append("file", file);
  body.append("subject", config.subject.trim());
  body.append("grade", String(config.grade));
  body.append("level", config.level);
  body.append("quiz_count", String(config.quizCount));
  const response = await fetch(`${AI_SERVICE_URL}/api/teacher/content/outline`, { method: "POST", body });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.detail || "Không tạo được dàn ý. Kiểm tra AI service đã chạy chưa.");
  return data;
}

async function postGenerate(payload) {
  const response = await fetch(`${AI_SERVICE_URL}/api/teacher/content/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.detail || "Không sinh được bài giảng.");
  return data;
}

// Render markdown tối giản (heading/bold/danh sách) — đủ để giáo viên xem nháp.
function MarkdownLite({ text }) {
  const lines = String(text || "").split("\n");
  return (
    <div className="space-y-2 text-sm leading-6 text-slate-700">
      {lines.map((line, index) => {
        const bolded = line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={i} className="font-black text-slate-900">{part.slice(2, -2)}</strong>
            : part);
        if (/^###\s/.test(line)) return <h4 key={index} className="pt-2 text-base font-black text-slate-900">{line.replace(/^###\s*/, "")}</h4>;
        if (/^##\s/.test(line)) return <h3 key={index} className="pt-3 text-lg font-black text-slate-950">{line.replace(/^##\s*/, "")}</h3>;
        if (/^[-*]\s/.test(line)) return <p key={index} className="pl-4">• {bolded.map((p) => (typeof p === "string" ? p.replace(/^[-*]\s*/, "") : p))}</p>;
        if (!line.trim()) return <div key={index} className="h-1" />;
        return <p key={index}>{bolded}</p>;
      })}
    </div>
  );
}

export function TeacherLessonGeneratorPage() {
  // step: "config" (form + upload) -> "outline" (giáo viên duyệt) -> "result"
  const [step, setStep] = useState("config");
  const [config, setConfig] = useState(initialConfig);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [documentId, setDocumentId] = useState(null);
  const [course, setCourse] = useState(null); // course_outline: Chương -> Bài -> Mục
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

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

  // Flatten Chương -> Bài -> Mục thành danh sách phẳng cho /generate:
  // title giữ ngữ cảnh bài học để retrieval và prompt viết đúng trọng tâm.
  function flattenCourse() {
    const items = [];
    for (const chapter of course?.chapters || []) {
      for (const lesson of chapter.lessons || []) {
        for (const section of lesson.sections || []) {
          const title = String(section.section_title || "").trim();
          if (!title) continue;
          items.push({
            id: String(section.section_id),
            title: `${lesson.lesson_title} — ${title}`,
            description: String(section.intent || "").trim(),
          });
        }
      }
    }
    return items;
  }

  async function generateLesson() {
    const cleaned = flattenCourse();
    if (cleaned.length === 0) { setError("Dàn ý cần ít nhất một mục có tiêu đề."); return; }
    setBusy(true);
    setError(null);
    try {
      const data = await postGenerate({
        outline: cleaned,
        document_id: documentId,
        subject: config.subject.trim(),
        grade: String(config.grade),
        level: config.level,
        quiz_count: Number(config.quizCount),
      });
      setResult(data);
      setStep("result");
    } catch (generateError) {
      setError(generateError.message);
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
    setResult(null);
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
        {[["config", "1. Cấu hình & tài liệu"], ["outline", "2. Duyệt dàn ý"], ["result", "3. Bài giảng"]].map(([key, label], index) => (
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
            <button type="button" className="primary-button" onClick={generateLesson} disabled={busy}>
              {busy ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
              {busy ? "AI đang viết từng mục..." : "Chốt dàn ý & sinh bài giảng"}
            </button>
          </div>
        </section>
      )}

      {/* ------------------------------------------- Bước 3: kết quả ---- */}
      {step === "result" && result && (
        <section className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
            <CheckCircle2 size={17} />
            Đã sinh {result.sections.length} mục và {result.quizzes.length} câu quiz. Đây là bản nháp — hãy rà soát trước khi dùng cho học sinh.
          </div>

          {result.sections.map((section) => (
            <article key={section.outline_id} className="surface p-5 sm:p-6">
              <h2 className="text-xl font-black text-slate-950">{section.title}</h2>
              <div className="mt-3"><MarkdownLite text={section.content_markdown} /></div>

              {section.quizzes.length > 0 && (
                <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                  <p className="flex items-center gap-2 text-xs font-black uppercase text-slate-400"><ListChecks size={15} />Quiz ({section.quizzes.length} câu)</p>
                  {section.quizzes.map((quiz, quizIndex) => (
                    <div key={quizIndex} className="rounded-lg border border-slate-200 p-3.5">
                      <p className="text-sm font-extrabold text-slate-900">Câu {quizIndex + 1}. {quiz.question}</p>
                      <ul className="mt-2 space-y-1.5">
                        {quiz.options.map((option, optionIndex) => (
                          <li key={optionIndex} className={`rounded-md px-3 py-1.5 text-sm font-bold ${option === quiz.correct_answer ? "bg-emerald-50 text-emerald-800" : "bg-slate-50 text-slate-600"}`}>
                            {String.fromCharCode(65 + optionIndex)}. {option}
                            {option === quiz.correct_answer && <span className="ml-2 text-[11px] font-black uppercase text-emerald-600">Đáp án</span>}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs font-medium leading-5 text-slate-500"><span className="font-black">Giải thích:</span> {quiz.explanation}</p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button type="button" className="secondary-button" onClick={() => setStep("outline")}><ArrowLeft size={16} />Sửa dàn ý & sinh lại</button>
            <button type="button" className="secondary-button" onClick={restart}><RefreshCw size={16} />Tạo bài giảng mới</button>
          </div>
        </section>
      )}
    </div>
  );
}
