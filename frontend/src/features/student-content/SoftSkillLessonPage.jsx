import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Lightbulb,
  ListChecks,
  PartyPopper,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getSoftSkillLesson } from "./softSkillLessons.js";

// Tailwind cần chuỗi class tĩnh -> khai báo đầy đủ cho từng tông màu.
const ACCENTS = {
  emerald: { grad: "from-emerald-600 to-teal-500", chip: "bg-emerald-50 text-emerald-700", soft: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500", btn: "bg-emerald-600 hover:bg-emerald-700", ring: "ring-emerald-200" },
  sky: { grad: "from-sky-600 to-cyan-500", chip: "bg-sky-50 text-sky-700", soft: "bg-sky-50 text-sky-700", dot: "bg-sky-500", btn: "bg-sky-600 hover:bg-sky-700", ring: "ring-sky-200" },
  violet: { grad: "from-violet-600 to-purple-500", chip: "bg-violet-50 text-violet-700", soft: "bg-violet-50 text-violet-700", dot: "bg-violet-500", btn: "bg-violet-600 hover:bg-violet-700", ring: "ring-violet-200" },
  amber: { grad: "from-amber-500 to-orange-500", chip: "bg-amber-50 text-amber-700", soft: "bg-amber-50 text-amber-700", dot: "bg-amber-500", btn: "bg-amber-600 hover:bg-amber-700", ring: "ring-amber-200" },
  rose: { grad: "from-rose-600 to-pink-500", chip: "bg-rose-50 text-rose-700", soft: "bg-rose-50 text-rose-700", dot: "bg-rose-500", btn: "bg-rose-600 hover:bg-rose-700", ring: "ring-rose-200" },
  indigo: { grad: "from-indigo-600 to-blue-500", chip: "bg-indigo-50 text-indigo-700", soft: "bg-indigo-50 text-indigo-700", dot: "bg-indigo-500", btn: "bg-indigo-600 hover:bg-indigo-700", ring: "ring-indigo-200" },
  teal: { grad: "from-teal-600 to-emerald-500", chip: "bg-teal-50 text-teal-700", soft: "bg-teal-50 text-teal-700", dot: "bg-teal-500", btn: "bg-teal-600 hover:bg-teal-700", ring: "ring-teal-200" },
  green: { grad: "from-green-600 to-lime-500", chip: "bg-green-50 text-green-700", soft: "bg-green-50 text-green-700", dot: "bg-green-500", btn: "bg-green-600 hover:bg-green-700", ring: "ring-green-200" },
  cyan: { grad: "from-cyan-600 to-sky-500", chip: "bg-cyan-50 text-cyan-700", soft: "bg-cyan-50 text-cyan-700", dot: "bg-cyan-500", btn: "bg-cyan-600 hover:bg-cyan-700", ring: "ring-cyan-200" },
  fuchsia: { grad: "from-fuchsia-600 to-pink-500", chip: "bg-fuchsia-50 text-fuchsia-700", soft: "bg-fuchsia-50 text-fuchsia-700", dot: "bg-fuchsia-500", btn: "bg-fuchsia-600 hover:bg-fuchsia-700", ring: "ring-fuchsia-200" },
};

export function SoftSkillLessonPage() {
  const { id } = useParams();
  const lesson = useMemo(() => getSoftSkillLesson(id), [id]);

  // phases: overview -> từng section -> quiz -> hoàn thành
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    setStep(0);
    setSelected(null);
    setAnswered(false);
  }, [id]);

  if (!lesson) {
    return (
      <div className="surface mx-auto mt-14 max-w-xl p-8 text-center">
        <XCircle className="mx-auto text-rose-500" size={34} />
        <h1 className="mt-4 text-xl font-black">Không tìm thấy bài học</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Bài học bạn tìm không tồn tại hoặc đã được đổi liên kết.</p>
        <Link to="/student/content" className="primary-button mt-5">Về thư viện</Link>
      </div>
    );
  }

  const accent = ACCENTS[lesson.accent] ?? ACCENTS.emerald;
  const phases = ["overview", ...lesson.sections.map((_, i) => `section-${i}`), "quiz", "done"];
  const totalPhases = phases.length;
  const current = phases[step];
  const progress = Math.round((step / (totalPhases - 1)) * 100);

  const goNext = () => setStep((s) => Math.min(totalPhases - 1, s + 1));
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const isCorrect = answered && selected === lesson.quiz.answerIndex;

  return (
    <div className="mx-auto max-w-6xl pb-12">
      <Link to="/student/content" className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-500 hover:text-slate-950">
        <ArrowLeft size={17} /> Thư viện kỹ năng mềm
      </Link>

      {/* Hero */}
      <section className={`relative mt-5 overflow-hidden rounded-2xl bg-gradient-to-br ${accent.grad} p-6 md:p-8`}>
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-black text-white backdrop-blur"><ShieldCheck size={14} /> Giáo viên đã duyệt</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-black text-white backdrop-blur"><Clock3 size={14} /> {lesson.duration}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-black text-white backdrop-blur"><Trophy size={14} /> {lesson.xpReward} XP</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-black text-white backdrop-blur">{lesson.category}</span>
          </div>
          <p className="mt-4 text-xs font-black uppercase tracking-wide text-white/70">{lesson.nodeCode}</p>
          <h1 className="mt-1 text-3xl font-black leading-tight text-white md:text-[40px]">{lesson.title}</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold italic leading-6 text-white/90 md:text-base">“{lesson.hero}”</p>
        </div>
        <BookOpenCheck className="absolute -right-4 -top-4 text-white/10" size={180} aria-hidden="true" />
      </section>

      {/* Progress */}
      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div className={`h-full rounded-full bg-gradient-to-r ${accent.grad} transition-[width] duration-500`} style={{ width: `${progress}%` }} />
        </div>
        <span className="w-24 text-right text-xs font-black tabular-nums text-slate-500">Bước {step + 1}/{totalPhases}</span>
      </div>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* Main content */}
        <div className="surface p-6 md:p-8">
          {current === "overview" && (
            <div>
              <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-black ${accent.chip}`}><Target size={13} /> MỤC TIÊU BÀI HỌC</span>
              <h2 className="mt-3 text-2xl font-black text-slate-950">Bạn sẽ đạt được gì?</h2>
              <ul className="mt-5 space-y-3">
                {lesson.objectives.map((obj) => (
                  <li key={obj} className="flex items-start gap-3">
                    <span className={`mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full ${accent.soft}`}><CheckCircle2 size={15} /></span>
                    <span className="text-sm font-semibold leading-6 text-slate-700">{obj}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                <Sparkles className={`flex-none ${accent.soft.split(" ")[1]}`} size={18} />
                Bài học gồm {lesson.sections.length} phần ngắn và 1 câu hỏi ôn tập. Hãy đi từng bước để ghi nhớ hiệu quả nhất.
              </div>
            </div>
          )}

          {current?.startsWith("section-") && (() => {
            const sIndex = Number(current.split("-")[1]);
            const section = lesson.sections[sIndex];
            return (
              <div>
                <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-black ${accent.chip}`}>PHẦN {sIndex + 1}/{lesson.sections.length}</span>
                <h2 className="mt-3 text-2xl font-black text-slate-950">{section.heading}</h2>
                <p className="mt-4 text-[15px] font-medium leading-7 text-slate-700">{section.body}</p>
                {section.tips?.length > 0 && (
                  <div className={`mt-5 rounded-xl border border-slate-100 p-4 ring-1 ${accent.ring}`}>
                    <p className="flex items-center gap-2 text-xs font-black uppercase text-slate-500"><Lightbulb size={15} /> Mẹo áp dụng ngay</p>
                    <ul className="mt-3 space-y-2">
                      {section.tips.map((tip) => (
                        <li key={tip} className="flex items-start gap-2 text-sm font-semibold leading-6 text-slate-700">
                          <ChevronRight size={16} className={`mt-0.5 flex-none ${accent.soft.split(" ")[1]}`} /> {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })()}

          {current === "quiz" && (
            <div>
              <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-black ${accent.chip}`}><ListChecks size={13} /> KIỂM TRA NHANH</span>
              <h2 className="mt-3 text-xl font-black text-slate-950">{lesson.quiz.question}</h2>
              <div className="mt-5 space-y-3">
                {lesson.quiz.options.map((option, index) => {
                  const isThis = selected === index;
                  const correct = index === lesson.quiz.answerIndex;
                  let cls = "border-slate-200 hover:border-slate-300 bg-white";
                  if (answered && correct) cls = "border-emerald-400 bg-emerald-50";
                  else if (answered && isThis && !correct) cls = "border-rose-400 bg-rose-50";
                  else if (!answered && isThis) cls = `border-slate-400 ${accent.soft}`;
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={answered}
                      onClick={() => setSelected(index)}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-bold text-slate-700 transition ${cls}`}
                    >
                      <span>{option}</span>
                      {answered && correct && <CheckCircle2 className="flex-none text-emerald-600" size={19} />}
                      {answered && isThis && !correct && <XCircle className="flex-none text-rose-500" size={19} />}
                    </button>
                  );
                })}
              </div>
              {!answered ? (
                <button
                  type="button"
                  disabled={selected === null}
                  onClick={() => setAnswered(true)}
                  className={`mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${accent.btn}`}
                >
                  Kiểm tra đáp án
                </button>
              ) : (
                <div className={`mt-5 rounded-xl p-4 text-sm font-semibold leading-6 ${isCorrect ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
                  <p className="flex items-center gap-2 font-black">
                    {isCorrect ? <><CheckCircle2 size={17} /> Chính xác!</> : <><XCircle size={17} /> Chưa đúng, cùng xem lại nhé</>}
                  </p>
                  <p className="mt-2 text-slate-700">{lesson.quiz.explanation}</p>
                </div>
              )}
            </div>
          )}

          {current === "done" && (
            <div className="text-center">
              <span className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${accent.soft}`}><PartyPopper size={30} /></span>
              <h2 className="mt-4 text-2xl font-black text-slate-950">Hoàn thành bài học!</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">Bạn vừa rèn luyện “{lesson.title}”.</p>
              <div className={`mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-black text-white bg-gradient-to-r ${accent.grad}`}>
                <Trophy size={17} /> +{lesson.xpReward} XP
              </div>

              <div className="mt-7 grid gap-4 text-left md:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="flex items-center gap-2 text-xs font-black uppercase text-slate-500"><Sparkles size={14} /> Ghi nhớ cốt lõi</p>
                  <ul className="mt-3 space-y-2">
                    {lesson.keyTakeaways.map((t) => (
                      <li key={t} className="flex items-start gap-2 text-sm font-semibold leading-6 text-slate-700">
                        <span className={`mt-1.5 h-1.5 w-1.5 flex-none rounded-full ${accent.dot}`} /> {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="flex items-center gap-2 text-xs font-black uppercase text-slate-500"><Target size={14} /> {lesson.practice.title}</p>
                  <ul className="mt-3 space-y-2">
                    {lesson.practice.steps.map((s, i) => (
                      <li key={s} className="flex items-start gap-2 text-sm font-semibold leading-6 text-slate-700">
                        <span className={`mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full text-[11px] font-black ${accent.soft}`}>{i + 1}</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={() => { setStep(0); setSelected(null); setAnswered(false); }} className="secondary-button inline-flex items-center gap-2">
                  <RotateCcw size={16} /> Học lại
                </button>
                <Link to="/student/content" className="primary-button inline-flex items-center gap-2">
                  Khám phá bài học khác <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          )}

          {/* Điều hướng (ẩn ở màn hoàn thành) */}
          {current !== "done" && (
            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 0}
                className="inline-flex items-center gap-1.5 text-sm font-black text-slate-500 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft size={16} /> Quay lại
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={current === "quiz" && !answered}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${accent.btn}`}
              >
                {current === "quiz" ? "Hoàn thành" : current === "overview" ? "Bắt đầu học" : "Tiếp tục"} <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Sidebar outline */}
        <aside className="surface p-5 lg:sticky lg:top-4">
          <p className="text-xs font-black uppercase text-slate-400">Nội dung bài học</p>
          <ol className="mt-4 space-y-1">
            {phases.slice(0, -1).map((phase, index) => {
              const done = index < step;
              const active = index === step;
              const label =
                phase === "overview" ? "Mục tiêu bài học"
                  : phase === "quiz" ? "Kiểm tra nhanh"
                    : lesson.sections[Number(phase.split("-")[1])].heading;
              return (
                <li key={phase}>
                  <button
                    type="button"
                    onClick={() => setStep(index)}
                    className={`flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition ${active ? accent.soft + " font-black" : done ? "text-slate-600 hover:bg-slate-50" : "text-slate-400 hover:bg-slate-50"}`}
                  >
                    <span className={`mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full text-[11px] font-black ${done ? "bg-emerald-500 text-white" : active ? accent.dot + " text-white" : "bg-slate-200 text-slate-500"}`}>
                      {done ? <CheckCircle2 size={13} /> : index + 1}
                    </span>
                    <span className="leading-5">{label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>
      </div>
    </div>
  );
}
