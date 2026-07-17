import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpenCheck,
  Clock3,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { useStudentData } from "../../app/StudentDataProvider.jsx";
import { api } from "../../lib/apiClient.js";
import { CheckpointLesson } from "./CheckpointLesson.jsx";
import { LessonOutline } from "./LessonOutline.jsx";
import { QuizPanel } from "./QuizPanel.jsx";

export function LessonPlayerPage() {
  const { skillNodeId } = useParams();
  const { retry: refreshDashboard } = useStudentData();
  const [data, setData] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError(null);
    api.getLesson(skillNodeId, controller.signal).then(setData).catch((loadError) => {
      if (loadError.name !== "AbortError") setError(loadError.message);
    });
    return () => controller.abort();
  }, [skillNodeId]);

  const content = data?.lesson?.content;
  const checkpoints = useMemo(() => content?.checkpoints || [], [content]);
  const progress = checkpoints.length
    ? Math.round(((activeStep + 1) / (checkpoints.length + 1)) * 100)
    : 0;

  if (error) {
    return (
      <div className="surface mx-auto mt-14 max-w-xl p-8 text-center">
        <RefreshCw className="mx-auto text-rose-500" />
        <h1 className="mt-4 text-xl font-black">Chưa mở được bài học</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{error}</p>
        <Link to="/student/path" className="primary-button mt-5">Về lộ trình</Link>
      </div>
    );
  }

  if (!data) {
    return <div className="skeleton h-[720px]" aria-label="Đang tải bài học" />;
  }

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <Link to="/student/path" className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-500 hover:text-slate-950">
        <ArrowLeft size={17} /> Lộ trình học
      </Link>

      <section className="lesson-header mt-5" aria-labelledby="lesson-title">
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="lesson-approved"><ShieldCheck size={15} /> Giáo viên đã duyệt</span>
            <span className="lesson-meta"><Clock3 size={15} /> {content.estimatedMinutes} phút</span>
            <span className="lesson-meta">Mức {data.lesson.difficulty === "basic" ? "cơ bản" : "nâng cao"}</span>
          </div>
          <h1 id="lesson-title" className="mt-4 text-3xl font-black leading-tight text-white md:text-[42px]">
            {content.title || data.skillNode.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/85 md:text-base">
            {content.summary || data.skillNode.description}
          </p>
        </div>
        <div className="lesson-header-icon" aria-hidden="true"><BookOpenCheck size={50} /></div>
      </section>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-[width]" style={{ width: `${progress}%` }} />
        </div>
        <span className="w-10 text-right text-xs font-black tabular-nums text-slate-500">{progress}%</span>
      </div>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          {activeStep < checkpoints.length ? (
            <CheckpointLesson
              checkpoint={checkpoints[activeStep]}
              objectives={content.learningObjectives}
              onNext={() => setActiveStep((step) => Math.min(checkpoints.length, step + 1))}
            />
          ) : (
            <QuizPanel
              question={data.questions[0]}
              hints={content.quizHints}
              onProgressUpdated={() => refreshDashboard()}
            />
          )}
        </div>
        <LessonOutline checkpoints={checkpoints} activeStep={activeStep} onSelect={setActiveStep} />
      </div>
    </div>
  );
}
