import {
  BookOpenCheck,
  Check,
  ListChecks,
  Loader2,
  Plus,
  Rocket,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../../lib/apiClient.js";
import { FormAlert } from "../auth/AuthFormControls.jsx";

function StatusPill({ status }) {
  const published = status === "PUBLISHED";
  return (
    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-black ${published ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
      {published ? "Học sinh thấy" : "Chưa xuất bản"}
    </span>
  );
}

/**
 * Hộp thoại chọn bài giảng AI để thêm vào lớp. Nguồn là thư viện bài giảng của
 * chính giáo viên; bài đã có trong lớp bị vô hiệu hoá để tránh thêm trùng.
 */
function AddLessonDialog({ classId, assignedIds, onClose, onAdded }) {
  const [workspace, setWorkspace] = useState(null);
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    api.getAiCourses(controller.signal)
      .then(setWorkspace)
      .catch((loadError) => {
        if (loadError.name !== "AbortError") setError(loadError.message);
      });
    return () => controller.abort();
  }, []);

  function toggle(lessonId) {
    setPicked((current) => current.includes(lessonId)
      ? current.filter((id) => id !== lessonId)
      : [...current, lessonId]);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api.assignAiLessonsToClass(classId, picked);
      onAdded();
    } catch (submitError) {
      setError(submitError.message);
      setBusy(false);
    }
  }

  const courses = workspace?.courses || [];
  const hasAny = courses.some((course) => course.lessons.length > 0);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="eyebrow">Thư viện bài giảng AI</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">Thêm bài giảng vào lớp</h2>
          </div>
          <button type="button" className="icon-button inline-grid" onClick={onClose} aria-label="Đóng"><X size={18} /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <FormAlert>{error}</FormAlert>

          {!workspace ? (
            <div className="space-y-2">{[1, 2].map((item) => <div key={item} className="skeleton h-16" />)}</div>
          ) : !hasAny ? (
            <div className="py-10 text-center">
              <Sparkles className="mx-auto text-slate-300" size={34} />
              <p className="mt-3 text-sm font-bold text-slate-500">Bạn chưa có bài giảng AI nào.</p>
              <Link to="/teacher/ai-lessons" className="primary-button mt-4 inline-flex" onClick={onClose}>
                <Sparkles size={16} />Tạo bài giảng bằng AI
              </Link>
            </div>
          ) : (
            courses.filter((course) => course.lessons.length > 0).map((course) => (
              <section key={course.id}>
                <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                  {course.subject} · Lớp {course.grade}
                </p>
                <div className="mt-2 space-y-1.5">
                  {course.lessons.map((lesson) => {
                    const already = assignedIds.includes(lesson.id);
                    const selected = picked.includes(lesson.id);
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        disabled={already}
                        onClick={() => toggle(lesson.id)}
                        className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
                          already
                            ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                            : selected
                              ? "border-emerald-600 bg-emerald-50"
                              : "border-slate-200 hover:border-emerald-300"
                        }`}
                      >
                        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${selected ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"}`}>
                          {(selected || already) && <Check size={13} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-extrabold text-slate-900">
                            Bài {lesson.outlineLessonId}. {lesson.title}
                          </span>
                          <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">
                            {lesson.sectionCount} mục · {lesson.quizCount} quiz
                            {already ? " · đã có trong lớp" : ""}
                          </span>
                        </span>
                        <StatusPill status={lesson.status} />
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-4">
          <button type="button" className="secondary-button" onClick={onClose} disabled={busy}>Hủy</button>
          <button type="button" className="primary-button" onClick={submit} disabled={busy || picked.length === 0}>
            {busy ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />}
            Thêm {picked.length > 0 ? `${picked.length} bài` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Mục "Bài giảng AI" trong trang chi tiết lớp học. */
export function ClassAiLessonsPanel({ classId }) {
  const [lessons, setLessons] = useState(null);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const load = useCallback(async (signal) => {
    setError(null);
    try {
      const data = await api.getClassAiLessons(classId, signal);
      setLessons(data.lessons);
    } catch (loadError) {
      if (loadError.name !== "AbortError") setError(loadError.message);
    }
  }, [classId]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function remove(lessonId) {
    setRemovingId(lessonId);
    setError(null);
    try {
      await api.removeAiLessonFromClass(classId, lessonId);
      await load();
    } catch (removeError) {
      setError(removeError.message);
    } finally {
      setRemovingId(null);
    }
  }

  const draftCount = (lessons || []).filter((lesson) => lesson.status !== "PUBLISHED").length;

  return (
    <section className="surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <p className="eyebrow">Nội dung lớp</p>
          <h2 className="mt-1 text-lg font-black">Bài giảng AI</h2>
        </div>
        <button type="button" className="primary-button !min-h-10 !px-3.5 !text-xs" onClick={() => setAdding(true)}>
          <Plus size={16} />Thêm bài giảng
        </button>
      </div>

      <div className="px-5 py-4">
        <FormAlert>{error}</FormAlert>

        {draftCount > 0 && (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-bold text-amber-800">
            {draftCount} bài chưa xuất bản nên học sinh chưa nhìn thấy.{" "}
            <Link to="/teacher/ai-lessons/library" className="underline">Xuất bản ngay</Link>
          </p>
        )}

        {!lessons ? (
          <div className="space-y-2">{[1, 2].map((item) => <div key={item} className="skeleton h-14" />)}</div>
        ) : lessons.length === 0 ? (
          <div className="py-10 text-center">
            <BookOpenCheck className="mx-auto text-slate-300" size={34} />
            <p className="mt-3 text-sm font-bold text-slate-500">Lớp này chưa có bài giảng nào.</p>
            <p className="mt-1 text-xs text-slate-400">Thêm bài giảng AI bạn đã tạo để học sinh học được.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="flex flex-wrap items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-slate-900">
                    Bài {lesson.outlineLessonId}. {lesson.title}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
                    <span>{lesson.chapterTitle}</span>
                    <span className="flex items-center gap-1"><Sparkles size={11} />{lesson.sectionCount} mục</span>
                    <span className="flex items-center gap-1"><ListChecks size={11} />{lesson.quizCount} quiz</span>
                    {lesson.hasQuest && <span className="flex items-center gap-1"><Rocket size={11} />có nhiệm vụ</span>}
                  </p>
                </div>
                <StatusPill status={lesson.status} />
                <button
                  type="button"
                  className="icon-button inline-grid"
                  aria-label="Gỡ khỏi lớp"
                  title="Gỡ khỏi lớp (bài giảng vẫn còn trong thư viện)"
                  disabled={removingId === lesson.id}
                  onClick={() => remove(lesson.id)}
                >
                  {removingId === lesson.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {adding && (
        <AddLessonDialog
          classId={classId}
          assignedIds={(lessons || []).map((lesson) => lesson.id)}
          onClose={() => setAdding(false)}
          onAdded={() => { setAdding(false); load(); }}
        />
      )}
    </section>
  );
}
