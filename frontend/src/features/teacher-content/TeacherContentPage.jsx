import {
  ArrowRight,
  BookOpenCheck,
  Bot,
  CircleDashed,
  Clock3,
  FileCheck2,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../../lib/apiClient.js";
import { FormAlert, FormField } from "../auth/AuthFormControls.jsx";

const gradeLabels = { primary: "Tiểu học", secondary: "THCS", high_school: "THPT" };
const statusLabels = { DRAFT: "Bản nháp", IN_REVIEW: "Đang duyệt", PUBLISHED: "Đã xuất bản" };
const statusStyles = {
  DRAFT: "bg-slate-100 text-slate-700",
  IN_REVIEW: "bg-amber-100 text-amber-800",
  PUBLISHED: "bg-emerald-100 text-emerald-800",
};

const initialForm = { skillNodeId: "", title: "", difficulty: "basic", sourceText: "" };

function LessonLink({ lesson }) {
  return (
    <Link to={`/teacher/content/${lesson.id}`} className="group flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 hover:border-emerald-300 hover:bg-emerald-50/40">
      <span className={`rounded-md px-2 py-1 text-[11px] font-black ${statusStyles[lesson.status]}`}>{statusLabels[lesson.status]}</span>
      <span className="min-w-0 flex-1 truncate text-sm font-extrabold text-slate-700">{lesson.title}</span>
      <ArrowRight className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-700" size={17} />
    </Link>
  );
}

export function TeacherContentPage() {
  const [workspace, setWorkspace] = useState(null);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(initialForm);
  const navigate = useNavigate();

  const load = useCallback(async (signal) => {
    setError(null);
    try { setWorkspace(await api.getTeacherContent(signal)); }
    catch (loadError) { if (loadError.name !== "AbortError") setError(loadError.message); }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    load(controller.signal);
    const refresh = () => load();
    window.addEventListener("eduone:content-published", refresh);
    return () => {
      controller.abort();
      window.removeEventListener("eduone:content-published", refresh);
    };
  }, [load]);

  const groupedNodes = useMemo(() => {
    const groups = new Map();
    for (const node of workspace?.nodes || []) {
      const key = node.subject || "Khác";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(node);
    }
    return [...groups.entries()];
  }, [workspace]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function createDraft(event) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const draft = await api.createContentDraft(form);
      setCreateOpen(false);
      setForm(initialForm);
      navigate(`/teacher/content/${draft.id}`);
    } catch (createError) {
      setError(createError.message);
      setCreating(false);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Content Studio</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950 md:text-3xl">Nội dung giảng dạy</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">Tạo bản nháp từ nguồn, biên tập, duyệt và xuất bản tới học sinh.</p>
        </div>
        <button type="button" className="primary-button" onClick={() => setCreateOpen(true)}><Plus size={18} />Tạo bài học</button>
      </header>

      <FormAlert>{error}</FormAlert>

      {!workspace ? (
        <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="skeleton h-24" />)}</div><div className="skeleton h-96" /></div>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3" aria-label="Tổng quan nội dung">
            {[
              { label: "Bản nháp", value: workspace.counts.draft, icon: CircleDashed, tone: "bg-slate-100 text-slate-700" },
              { label: "Chờ xuất bản", value: workspace.counts.review, icon: Clock3, tone: "bg-amber-50 text-amber-700" },
              { label: "Đang phục vụ học sinh", value: workspace.counts.published, icon: ShieldCheck, tone: "bg-emerald-50 text-emerald-700" },
            ].map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="surface flex min-h-24 items-center gap-4 p-4"><div className={`grid h-11 w-11 place-items-center rounded-lg ${tone}`}><Icon size={21} /></div><div><p className="text-2xl font-black tabular-nums">{value}</p><p className="mt-1 text-xs font-bold text-slate-500">{label}</p></div></div>
            ))}
          </section>

          <div className="flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-bold text-sky-800">
            <Bot size={17} />
            {workspace.aiMode === "ai" ? "Bản nháp dùng AI và luôn cần giáo viên duyệt." : "Chế độ cục bộ đang bật; dữ liệu nguồn chưa được gửi ra nhà cung cấp AI."}
          </div>

          {groupedNodes.map(([subject, nodes]) => (
            <section key={subject} aria-labelledby={`subject-${subject}`}>
              <div className="mb-3 flex items-center justify-between"><h2 id={`subject-${subject}`} className="section-title capitalize">{subject}</h2><span className="text-xs font-bold text-slate-400">{nodes.length} Skill Node</span></div>
              <div className="grid gap-4 xl:grid-cols-2">
                {nodes.map((node) => (
                  <article key={node.id} className="surface p-5">
                    <div className="flex items-start gap-4">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-700"><BookOpenCheck size={21} /></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black uppercase text-slate-400">{gradeLabels[node.grade_band] || node.grade_band} · Node {node.order_index}</p>
                        <h3 className="mt-1 text-lg font-black text-slate-950">{node.name}</h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{node.description}</p>
                      </div>
                    </div>
                    <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                      {node.working.map((lesson) => <LessonLink key={lesson.id} lesson={lesson} />)}
                      {node.published.map((lesson) => <LessonLink key={lesson.id} lesson={lesson} />)}
                      {node.working.length === 0 && node.published.length === 0 && <p className="py-2 text-sm font-bold text-slate-400">Chưa có bài học cho node này.</p>}
                    </div>
                    {node.archivedCount > 0 && <p className="mt-3 text-xs font-bold text-slate-400">{node.archivedCount} phiên bản đã lưu trữ</p>}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-slate-950/35 p-4" role="presentation">
          <div className="my-4 w-full max-w-2xl rounded-lg bg-white p-5 shadow-2xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="create-content-title">
            <div className="flex items-center justify-between gap-4">
              <div><p className="eyebrow">Nguồn mới</p><h2 id="create-content-title" className="mt-1 text-xl font-black">Tạo bản nháp bài học</h2></div>
              <button type="button" className="icon-button inline-grid" aria-label="Đóng" title="Đóng" onClick={() => setCreateOpen(false)}><X size={20} /></button>
            </div>
            <form className="mt-6 space-y-5" onSubmit={createDraft}>
              <label className="block"><span className="mb-2 block text-xs font-black text-slate-700">Skill Node</span><select className="auth-input px-3.5" value={form.skillNodeId} onChange={(event) => update("skillNodeId", event.target.value)} required><option value="">Chọn Skill Node</option>{workspace?.nodes.map((node) => <option key={node.id} value={node.id}>{node.name} · {gradeLabels[node.grade_band]}</option>)}</select></label>
              <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_180px]">
                <FormField label="Tiêu đề mong muốn" value={form.title} onChange={(event) => update("title", event.target.value)} maxLength={120} placeholder="Ví dụ: Biến số qua trò chơi bắt sao" required />
                <label className="block"><span className="mb-2 block text-xs font-black text-slate-700">Mức độ</span><select className="auth-input px-3.5" value={form.difficulty} onChange={(event) => update("difficulty", event.target.value)}><option value="basic">Cơ bản</option><option value="advanced">Nâng cao</option></select></label>
              </div>
              <label className="block"><span className="mb-2 block text-xs font-black text-slate-700">Nội dung nguồn</span><textarea className="auth-input min-h-56 resize-y px-3.5 py-3 leading-6" minLength={120} maxLength={20000} value={form.sourceText} onChange={(event) => update("sourceText", event.target.value)} placeholder="Dán giáo án, ghi chú chuyên môn hoặc nội dung đã được phép sử dụng..." required /><span className="mt-1.5 block text-right text-xs font-bold text-slate-400">{form.sourceText.length.toLocaleString("vi-VN")} / 20.000</span></label>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" className="secondary-button" onClick={() => setCreateOpen(false)}>Hủy</button>
                <button type="submit" className="primary-button" disabled={creating || !form.skillNodeId || form.sourceText.trim().length < 120}><FileCheck2 size={17} />{creating ? "Đang tạo bản nháp..." : "Tạo bản nháp"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
