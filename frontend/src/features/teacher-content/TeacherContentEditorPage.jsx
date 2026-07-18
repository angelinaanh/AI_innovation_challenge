import {
  Archive,
  ArrowLeft,
  BookOpenCheck,
  Check,
  Clock3,
  CopyPlus,
  FileText,
  Rocket,
  Save,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { api } from "../../lib/apiClient.js";
import { FormAlert } from "../auth/AuthFormControls.jsx";

const statusMeta = {
  DRAFT: { label: "Bản nháp", className: "bg-slate-100 text-slate-700" },
  IN_REVIEW: { label: "Đang duyệt", className: "bg-amber-100 text-amber-800" },
  PUBLISHED: { label: "Đã xuất bản", className: "bg-emerald-100 text-emerald-800" },
  ARCHIVED: { label: "Đã lưu trữ", className: "bg-rose-100 text-rose-800" },
};

function TextArea({ label, value, onChange, disabled, minHeight = "min-h-24", ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-slate-700">{label}</span>
      <textarea {...props} disabled={disabled} className={`auth-input ${minHeight} resize-y px-3.5 py-3 leading-6 disabled:bg-slate-50 disabled:text-slate-500`} value={value || ""} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function TeacherContentEditorPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [content, setContent] = useState(null);
  const [question, setQuestion] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [working, setWorking] = useState(null);
  const openedAt = useRef(Date.now());

  const load = useCallback(async (signal) => {
    setError(null);
    try {
      const detail = await api.getTeacherLesson(lessonId, signal);
      setData(detail);
      setContent(structuredClone(detail.content));
      setQuestion(structuredClone(detail.question));
    } catch (loadError) {
      if (loadError.name !== "AbortError") setError(loadError.message);
    }
  }, [lessonId]);

  useEffect(() => {
    const controller = new AbortController();
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    openedAt.current = Date.now();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const humanMinutes = useMemo(
    () => Math.max(1, Math.round((Date.now() - openedAt.current) / 60000)),
    [working],
  );
  const editable = Boolean(data?.permissions?.editable);
  const status = statusMeta[data?.lesson?.status] || statusMeta.DRAFT;

  function updateContent(field, value) {
    setContent((current) => ({ ...current, [field]: value }));
    setNotice(null);
  }

  function updateCheckpoint(index, field, value) {
    setContent((current) => ({
      ...current,
      checkpoints: current.checkpoints.map((checkpoint, checkpointIndex) => (
        checkpointIndex === index ? { ...checkpoint, [field]: value } : checkpoint
      )),
    }));
    setNotice(null);
  }

  function updateQuestion(field, value) {
    setQuestion((current) => ({ ...current, [field]: value }));
    setNotice(null);
  }

  function updateOption(index, value) {
    setQuestion((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => optionIndex === index ? value : option),
    }));
    setNotice(null);
  }

  async function persistDraft() {
    return api.updateTeacherLesson(lessonId, { content, question, humanMinutes });
  }

  async function save() {
    setWorking("save");
    setError(null);
    try {
      await persistDraft();
      await load();
      setNotice("Đã lưu bản nháp. Mọi thay đổi vẫn chỉ giáo viên nhìn thấy.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setWorking(null);
    }
  }

  async function submitReview() {
    setWorking("review");
    setError(null);
    try {
      await persistDraft();
      await api.submitLessonReview(lessonId);
      await load();
      setNotice("Bài học đã chuyển sang trạng thái đang duyệt.");
    } catch (reviewError) {
      setError(reviewError.message);
    } finally {
      setWorking(null);
    }
  }

  async function publish() {
    setWorking("publish");
    setError(null);
    try {
      await api.publishTeacherLesson(lessonId, humanMinutes);
      await load();
      setNotice("Đã xuất bản. Học sinh trong tổ chức vừa nhận cập nhật realtime.");
    } catch (publishError) {
      setError(publishError.message);
    } finally {
      setWorking(null);
    }
  }

  async function createVersion() {
    setWorking("version");
    setError(null);
    try {
      const version = await api.createLessonVersion(lessonId);
      navigate(`/teacher/content/${version.id}`);
    } catch (versionError) {
      setError(versionError.message);
      setWorking(null);
    }
  }

  async function archiveLesson() {
    if (!window.confirm("Lưu trữ bài học này? Học sinh sẽ không còn truy cập nếu đây là phiên bản đang xuất bản.")) return;
    setWorking("archive");
    setError(null);
    try {
      await api.archiveTeacherLesson(lessonId);
      navigate("/teacher/content");
    } catch (archiveError) {
      setError(archiveError.message);
      setWorking(null);
    }
  }

  if (!data && !error) {
    return <div className="grid gap-5 xl:grid-cols-[minmax(280px,0.38fr)_minmax(0,0.62fr)]"><div className="skeleton h-[620px]" /><div className="skeleton h-[780px]" /></div>;
  }

  if (!data) {
    return <div className="surface mx-auto max-w-xl p-8 text-center"><FormAlert>{error}</FormAlert><Link to="/teacher/content" className="secondary-button mt-5"><ArrowLeft size={17} />Về Content Studio</Link></div>;
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/teacher/content" className="inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-emerald-700"><ArrowLeft size={17} />Content Studio</Link>
        <span className={`rounded-md px-3 py-1.5 text-xs font-black ${status.className}`}>{status.label}</span>
      </div>

      <header className="border-b border-slate-200 pb-5">
        <p className="eyebrow">{data.skillNode.subject} · {data.skillNode.name}</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950 md:text-3xl">{content.title}</h1>
        <div className="mt-3 flex flex-wrap gap-4 text-xs font-bold text-slate-500">
          <span className="inline-flex items-center gap-1.5"><Clock3 size={15} />{content.estimatedMinutes} phút</span>
          <span className="inline-flex items-center gap-1.5"><BookOpenCheck size={15} />{data.lesson.difficulty === "advanced" ? "Nâng cao" : "Cơ bản"}</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck size={15} />{data.lesson.generatedBy || "Giáo viên biên soạn"}</span>
        </div>
      </header>

      <FormAlert>{error}</FormAlert>
      <FormAlert tone="success">{notice}</FormAlert>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(300px,0.36fr)_minmax(0,0.64fr)]">
        <aside className="surface overflow-hidden xl:sticky xl:top-24">
          <div className="border-b border-slate-200 px-5 py-4"><p className="eyebrow">Nguồn gốc</p><h2 className="mt-1 text-lg font-black">Tài liệu giáo viên</h2></div>
          <div className="max-h-[calc(100vh-220px)] overflow-y-auto px-5 py-5">
            <div className="mb-4 flex items-center gap-2 text-xs font-black text-emerald-700"><FileText size={16} />Chỉ dùng làm căn cứ biên soạn</div>
            <p className="whitespace-pre-wrap text-sm font-medium leading-7 text-slate-600">{data.source?.text || "Không có nội dung nguồn dạng văn bản."}</p>
          </div>
        </aside>

        <div className="space-y-5">
          <section className="surface p-5 md:p-6" aria-labelledby="lesson-general-title">
            <p className="eyebrow">Thông tin chung</p>
            <h2 id="lesson-general-title" className="mt-1 text-lg font-black">Cấu trúc bài học</h2>
            <div className="mt-5 space-y-5">
              <label className="block"><span className="mb-2 block text-xs font-black text-slate-700">Tiêu đề</span><input className="auth-input px-3.5 disabled:bg-slate-50 disabled:text-slate-500" disabled={!editable} maxLength={120} value={content.title || ""} onChange={(event) => updateContent("title", event.target.value)} /></label>
              <TextArea label="Tóm tắt" disabled={!editable} minHeight="min-h-28" maxLength={600} value={content.summary} onChange={(value) => updateContent("summary", value)} />
              <div className="grid gap-5 sm:grid-cols-[170px_minmax(0,1fr)]">
                <label className="block"><span className="mb-2 block text-xs font-black text-slate-700">Thời lượng (phút)</span><input type="number" min="5" max="180" className="auth-input px-3.5 disabled:bg-slate-50" disabled={!editable} value={content.estimatedMinutes} onChange={(event) => updateContent("estimatedMinutes", Number(event.target.value))} /></label>
                <TextArea label="Mục tiêu học tập (mỗi dòng một mục tiêu)" disabled={!editable} value={(content.learningObjectives || []).join("\n")} onChange={(value) => updateContent("learningObjectives", value.split("\n").map((item) => item.trim()).filter(Boolean))} />
              </div>
            </div>
          </section>

          <section className="surface overflow-hidden" aria-labelledby="checkpoint-title">
            <div className="border-b border-slate-200 px-5 py-4 md:px-6"><p className="eyebrow">Nội dung chính</p><h2 id="checkpoint-title" className="mt-1 text-lg font-black">Checkpoints</h2></div>
            <div className="divide-y divide-slate-200">
              {(content.checkpoints || []).map((checkpoint, index) => (
                <div key={checkpoint.id || index} className="space-y-4 px-5 py-6 md:px-6">
                  <div className="flex items-center justify-between gap-3"><p className="text-sm font-black text-violet-700">Checkpoint {index + 1}</p><span className="text-xs font-bold text-slate-400">{checkpoint.durationMinutes || 6} phút</span></div>
                  <label className="block"><span className="mb-2 block text-xs font-black text-slate-700">Tiêu đề</span><input className="auth-input px-3.5 disabled:bg-slate-50" disabled={!editable} value={checkpoint.title || ""} onChange={(event) => updateCheckpoint(index, "title", event.target.value)} /></label>
                  <TextArea label="Nội dung" disabled={!editable} minHeight="min-h-36" value={checkpoint.body} onChange={(value) => updateCheckpoint(index, "body", value)} />
                  <TextArea label="Điểm cần ghi nhớ" disabled={!editable} value={checkpoint.takeaway} onChange={(value) => updateCheckpoint(index, "takeaway", value)} />
                </div>
              ))}
            </div>
          </section>

          <section className="surface p-5 md:p-6" aria-labelledby="quiz-editor-title">
            <p className="eyebrow">Đánh giá nhanh</p>
            <h2 id="quiz-editor-title" className="mt-1 text-lg font-black">Câu hỏi trắc nghiệm</h2>
            <div className="mt-5 space-y-5">
              <TextArea label="Câu hỏi" disabled={!editable} value={question.body} onChange={(value) => updateQuestion("body", value)} />
              <div className="space-y-3">
                {(question.options || []).map((option, index) => (
                  <label key={index} className="flex items-center gap-3"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-black ${Number(question.correctIndex) === index ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"}`}>{String.fromCharCode(65 + index)}</span><input className="auth-input px-3.5 disabled:bg-slate-50" disabled={!editable} value={option} onChange={(event) => updateOption(index, event.target.value)} /></label>
                ))}
              </div>
              <div className="grid gap-5 sm:grid-cols-[180px_minmax(0,1fr)]">
                <label className="block"><span className="mb-2 block text-xs font-black text-slate-700">Đáp án đúng</span><select className="auth-input px-3.5 disabled:bg-slate-50" disabled={!editable} value={question.correctIndex} onChange={(event) => updateQuestion("correctIndex", Number(event.target.value))}>{question.options.map((_, index) => <option key={index} value={index}>Phương án {String.fromCharCode(65 + index)}</option>)}</select></label>
                <TextArea label="Giải thích đáp án" disabled={!editable} value={question.explanation} onChange={(value) => updateQuestion("explanation", value)} />
              </div>
            </div>
          </section>

          <div className="surface flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center">
            {editable && <button type="button" className="secondary-button" disabled={Boolean(working)} onClick={save}>{working === "save" ? "Đang lưu..." : <><Save size={17} />Lưu bản nháp</>}</button>}
            {data.permissions.canSubmitReview && <button type="button" className="primary-button" disabled={Boolean(working)} onClick={submitReview}>{working === "review" ? "Đang gửi..." : <><Send size={17} />Gửi duyệt</>}</button>}
            {data.permissions.canPublish && <button type="button" className="primary-button bg-violet-700 shadow-[0_3px_0_#ddd6fe] hover:bg-violet-800" disabled={Boolean(working)} onClick={publish}>{working === "publish" ? "Đang xuất bản..." : <><Rocket size={17} />Xuất bản tới học sinh</>}</button>}
            {data.permissions.canRevise && <button type="button" className="primary-button" disabled={Boolean(working)} onClick={createVersion}>{working === "version" ? "Đang tạo..." : <><CopyPlus size={17} />Tạo phiên bản mới</>}</button>}
            {data.lesson.status === "PUBLISHED" && <span className="inline-flex items-center gap-2 text-xs font-black text-emerald-700"><Check size={16} />Học sinh chỉ thấy phiên bản này</span>}
            {data.permissions.canArchive && <button type="button" className="ml-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-xs font-black text-rose-600 hover:bg-rose-50" disabled={Boolean(working)} onClick={archiveLesson}><Archive size={17} />Lưu trữ</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
