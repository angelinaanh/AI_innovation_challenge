import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Clock3,
  ListChecks,
  RefreshCw,
  Rocket,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "../../lib/apiClient.js";
import { FormAlert } from "../auth/AuthFormControls.jsx";
import { SteamLessonView } from "../lesson-player/SteamLessonView.jsx";

/** Chi tiết một bài giảng — route /student/ai-lessons/:lessonId. */
export function StudentAiLessonDetailPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    document.documentElement.scrollTop = 0;
    setLesson(null);
    setError(null);
    api.getStudentAiLesson(lessonId, controller.signal)
      .then(setLesson)
      .catch((loadError) => { if (loadError.name !== "AbortError") setError(loadError.message); });
    return () => controller.abort();
  }, [lessonId]);

  if (error) {
    return (
      <div className="surface mx-auto max-w-xl p-8 text-center">
        <FormAlert>{error}</FormAlert>
        <button type="button" className="secondary-button mt-5" onClick={() => navigate("/student/ai-lessons")}>
          <ArrowLeft size={17} />Về danh sách bài giảng
        </button>
      </div>
    );
  }

  if (!lesson) {
    return <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="skeleton h-40" />)}</div>;
  }

  return (
    <div className="space-y-5">
      <button type="button" className="secondary-button" onClick={() => navigate("/student/ai-lessons")}>
        <ArrowLeft size={16} />Về danh sách bài giảng
      </button>
      <header className="border-b border-slate-200 pb-5">
        <p className="eyebrow">{lesson.chapterTitle}</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950 md:text-3xl">
          Bài {lesson.outlineLessonId}. {lesson.title}
        </h1>
      </header>
      <SteamLessonView content={lesson.content} />
    </div>
  );
}

/** Danh sách bài giảng giáo viên đã xuất bản — route /student/ai-lessons. */
export function StudentAiLessonsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async (signal) => {
    setError(null);
    try {
      setData(await api.getStudentAiLessons(signal));
    } catch (loadError) {
      if (loadError.name !== "AbortError") setError(loadError.message);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    // Giáo viên xuất bản xong -> danh sách tự làm mới, không cần F5.
    const refresh = () => load();
    window.addEventListener("eduone:content-published", refresh);
    return () => {
      controller.abort();
      window.removeEventListener("eduone:content-published", refresh);
    };
  }, [load]);

  return (
    <div className="space-y-5">
      <header className="border-b border-slate-200 pb-5">
        <p className="eyebrow">Lớp của tôi</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950 md:text-3xl">Bài giảng từ giáo viên</h1>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
          Những bài giảng giáo viên đã biên soạn và xuất bản cho lớp bạn đang tham gia.
        </p>
      </header>

      {error && (
        <div className="surface p-6 text-center">
          <RefreshCw className="mx-auto text-rose-500" />
          <p className="mt-3 text-sm font-bold text-slate-600">{error}</p>
          <button type="button" className="secondary-button mt-4" onClick={() => load()}>Tải lại</button>
        </div>
      )}

      {!data && !error ? (
        <div className="grid gap-4 md:grid-cols-2">{[1, 2].map((item) => <div key={item} className="skeleton h-56" />)}</div>
      ) : data && (
        data.classes.length === 0 ? (
          <div className="surface px-6 py-14 text-center">
            <BookOpenCheck className="mx-auto text-slate-300" size={38} />
            <h2 className="mt-4 text-lg font-black">Chưa có bài giảng nào</h2>
            <p className="mt-2 text-sm text-slate-500">
              Bài giảng sẽ xuất hiện tại đây ngay khi giáo viên của bạn xuất bản.
            </p>
          </div>
        ) : (
          data.classes.map((klass) => (
            <section key={klass.id} className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-black text-slate-950">{klass.name}</h2>
                <p className="text-xs font-bold text-slate-500">
                  {klass.teacher?.full_name ? `GV: ${klass.teacher.full_name} · ` : ""}
                  {klass.lessons.length} bài giảng
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {klass.lessons.map((lesson) => (
                  <article key={lesson.id} className="surface flex min-h-56 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-700 text-white">
                        <BookOpenCheck size={20} />
                      </div>
                      {lesson.hasQuest && (
                        <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-[11px] font-black text-indigo-700">
                          <Rocket className="mr-1 inline" size={12} />Có nhiệm vụ
                        </span>
                      )}
                    </div>
                    <p className="mt-4 text-xs font-black uppercase text-slate-400">{lesson.chapterTitle}</p>
                    <h3 className="mt-1 text-base font-black text-slate-950">
                      Bài {lesson.outlineLessonId}. {lesson.title}
                    </h3>
                    {lesson.engageHook && (
                      <p className="mt-2 line-clamp-3 text-sm font-medium leading-6 text-slate-500">{lesson.engageHook}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                        <span className="flex items-center gap-1"><Sparkles size={12} />{lesson.sectionCount} mục</span>
                        <span className="flex items-center gap-1"><ListChecks size={12} />{lesson.quizCount} quiz</span>
                      </span>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 text-sm font-black text-emerald-700 hover:text-emerald-900"
                        onClick={() => navigate(`/student/ai-lessons/${lesson.id}`)}
                      >
                        Học ngay <ArrowRight size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        )
      )}
    </div>
  );
}
