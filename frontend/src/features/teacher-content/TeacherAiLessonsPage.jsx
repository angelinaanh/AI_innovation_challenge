import {
  BookOpenCheck,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Undo2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../../lib/apiClient.js";
import { FormAlert } from "../auth/AuthFormControls.jsx";
import { SteamLessonView } from "../lesson-player/SteamLessonView.jsx";

function StatusPill({ status }) {
  const published = status === "PUBLISHED";
  return (
    <span className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-black ${published ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
      {published ? "Đã xuất bản" : "Nháp"}
    </span>
  );
}

function LessonRow({ lesson, busyId, onPreview, onPublish, onUnpublish }) {
  const busy = busyId === lesson.id;
  const published = lesson.status === "PUBLISHED";
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold text-slate-900">
          Bài {lesson.outlineLessonId}. {lesson.title}
        </p>
        <p className="mt-0.5 text-xs font-medium text-slate-500">
          {lesson.chapterTitle} · {lesson.sectionCount} mục · {lesson.quizCount} quiz
          {lesson.hasQuest ? " · có nhiệm vụ" : ""}
        </p>
      </div>
      <StatusPill status={lesson.status} />
      <button type="button" className="secondary-button !min-h-9 !px-3 !text-xs" onClick={() => onPreview(lesson)}>
        <Eye size={14} />Xem
      </button>
      {published ? (
        <button type="button" className="secondary-button !min-h-9 !px-3 !text-xs" disabled={busy} onClick={() => onUnpublish(lesson)}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Undo2 size={14} />}Thu hồi
        </button>
      ) : (
        <button type="button" className="primary-button !min-h-9 !px-3 !text-xs" disabled={busy} onClick={() => onPublish(lesson)}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}Xuất bản
        </button>
      )}
    </div>
  );
}

export function TeacherAiLessonsPage() {
  const [workspace, setWorkspace] = useState(null);
  const [error, setError] = useState(null);
  const [openCourse, setOpenCourse] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [preview, setPreview] = useState(null);

  const load = useCallback(async (signal) => {
    setError(null);
    try {
      const data = await api.getAiCourses(signal);
      setWorkspace(data);
      // Mở sẵn khóa mới nhất để giáo viên thấy ngay việc cần làm.
      setOpenCourse((current) => current ?? data.courses[0]?.id ?? null);
    } catch (loadError) {
      if (loadError.name !== "AbortError") setError(loadError.message);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function runAction(id, action) {
    setBusyId(id);
    setError(null);
    try {
      await action();
      await load();
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusyId(null);
    }
  }

  async function openPreview(lesson) {
    setError(null);
    try {
      setPreview(await api.getTeacherAiLesson(lesson.id));
    } catch (previewError) {
      setError(previewError.message);
    }
  }

  if (preview) {
    return (
      <div className="space-y-5">
        <button type="button" className="secondary-button" onClick={() => setPreview(null)}>
          <ChevronRight size={16} className="rotate-180" />Về danh sách bài giảng
        </button>
        <header className="border-b border-slate-200 pb-5">
          <p className="eyebrow">{preview.chapterTitle}</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">Bài {preview.outlineLessonId}. {preview.title}</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Bản xem trước đúng như học sinh sẽ thấy khi bài được xuất bản.
          </p>
        </header>
        <SteamLessonView content={preview.content} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="border-b border-slate-200 pb-5">
        <p className="eyebrow">Content Studio · AI</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950 md:text-3xl">Bài giảng AI đã lưu</h1>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
          Bài giảng lưu ở trạng thái nháp. Học sinh trong lớp chỉ nhìn thấy sau khi bạn xuất bản.
        </p>
      </header>

      <FormAlert>{error}</FormAlert>

      {!workspace ? (
        <div className="space-y-3">{[1, 2].map((item) => <div key={item} className="skeleton h-32" />)}</div>
      ) : workspace.courses.length === 0 ? (
        <div className="surface px-6 py-14 text-center">
          <Sparkles className="mx-auto text-slate-300" size={38} />
          <h2 className="mt-4 text-lg font-black">Chưa có bài giảng AI nào</h2>
          <p className="mt-2 text-sm text-slate-500">Hãy tạo bài giảng từ tài liệu của bạn để bắt đầu.</p>
          <Link to="/teacher/ai-lessons" className="primary-button mt-5 inline-flex">
            <Sparkles size={17} />Tạo bài giảng bằng AI
          </Link>
        </div>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3" aria-label="Tổng quan">
            <div className="surface flex min-h-24 items-center gap-4 p-4">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100 text-slate-700"><FileText size={21} /></div>
              <div><p className="text-2xl font-black">{workspace.counts.draft}</p><p className="mt-1 text-xs font-bold text-slate-500">Bài còn nháp</p></div>
            </div>
            <div className="surface flex min-h-24 items-center gap-4 p-4">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><BookOpenCheck size={21} /></div>
              <div><p className="text-2xl font-black">{workspace.counts.published}</p><p className="mt-1 text-xs font-bold text-slate-500">Đã tới học sinh</p></div>
            </div>
            <div className="surface flex min-h-24 items-center gap-4 p-4">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-sky-50 text-sky-700"><Users size={21} /></div>
              <div><p className="text-2xl font-black">{workspace.courses.length}</p><p className="mt-1 text-xs font-bold text-slate-500">Khóa đã tạo</p></div>
            </div>
          </section>

          {workspace.courses.map((course) => {
            const open = openCourse === course.id;
            const draftCount = course.lessons.filter((lesson) => lesson.status !== "PUBLISHED").length;
            return (
              <article key={course.id} className="surface overflow-hidden">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-slate-50"
                  onClick={() => setOpenCourse(open ? null : course.id)}
                  aria-expanded={open}
                >
                  {open ? <ChevronDown size={18} className="shrink-0 text-slate-400" /> : <ChevronRight size={18} className="shrink-0 text-slate-400" />}
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-black text-slate-950">
                      {course.subject} · Lớp {course.grade}
                    </span>
                    <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">
                      {course.class ? course.class.name : "Lớp đã bị xóa"} · {course.lessons.length} bài
                      {course.sourceFilename ? ` · ${course.sourceFilename}` : ""}
                    </span>
                  </span>
                  {draftCount > 0 && (
                    <span className="shrink-0 rounded-md bg-amber-100 px-2 py-1 text-[11px] font-black text-amber-800">
                      {draftCount} nháp
                    </span>
                  )}
                </button>

                {open && (
                  <div className="space-y-2.5 border-t border-slate-200 px-5 py-5">
                    {course.lessons.map((lesson) => (
                      <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        busyId={busyId}
                        onPreview={openPreview}
                        onPublish={(item) => runAction(item.id, () => api.publishAiLesson(item.id))}
                        onUnpublish={(item) => runAction(item.id, () => api.unpublishAiLesson(item.id))}
                      />
                    ))}
                    {draftCount > 0 && (
                      <button
                        type="button"
                        className="primary-button mt-2"
                        disabled={busyId === course.id}
                        onClick={() => runAction(course.id, () => api.publishAiCourse(course.id))}
                      >
                        {busyId === course.id ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                        Xuất bản toàn bộ {course.lessons.length} bài
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}

          <button type="button" className="secondary-button" onClick={() => load()}>
            <RefreshCw size={16} />Tải lại
          </button>
        </>
      )}
    </div>
  );
}
