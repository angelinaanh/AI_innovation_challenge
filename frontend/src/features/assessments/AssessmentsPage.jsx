import { useMemo, useRef, useState } from "react";
import {
  AlarmClock,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  History,
  Sparkles,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  ASSESSMENTS,
  REMEDIAL_BY_AXIS,
  STEAM_AXES,
  STEAM_ORDER,
  averageByAxis,
  daysLeft,
  dueAssessments,
  isDue,
  overallScore,
  scoreHistory,
  weakAxes,
} from "./assessmentsData.js";

const TABS = [
  { key: "weekly", label: "Theo tuần", icon: CalendarDays },
  { key: "monthly", label: "Theo tháng", icon: ClipboardCheck },
];

function scoreTone(score) {
  if (score >= 80) return { text: "text-emerald-700", bg: "bg-emerald-50" };
  if (score >= 60) return { text: "text-amber-700", bg: "bg-amber-50" };
  return { text: "text-rose-700", bg: "bg-rose-50" };
}

// Thanh điểm 1 trục STEAM; trục yếu (dưới ngưỡng) tô đỏ để nổi bật.
function SkillBar({ axis, score, weak }) {
  const meta = STEAM_AXES[axis];
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-black">
        <span className="flex items-center gap-1.5" style={{ color: weak ? "#e11d48" : meta.color }}>
          <span aria-hidden="true">{meta.emoji}</span> {axis} · {meta.label}
        </span>
        <span className={weak ? "text-rose-600" : "text-slate-500"}>{score}%{weak ? " ⚠️" : ""}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: weak ? "#f43f5e" : meta.color }}
        />
      </div>
    </div>
  );
}

// Thẻ bài học bổ trợ cho một kỹ năng STEAM còn yếu.
function RemedialCard({ axis }) {
  const meta = STEAM_AXES[axis];
  const lesson = REMEDIAL_BY_AXIS[axis];
  if (!lesson) return null;
  return (
    <Link
      to={lesson.to}
      className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg" style={{ background: `${meta.color}1a` }}>
        {meta.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[11px] font-black" style={{ color: meta.color }}>
          <BookOpen size={12} /> Bổ trợ {axis} · {meta.label}
        </span>
        <span className="mt-0.5 block truncate text-sm font-black text-slate-900">{lesson.title}</span>
        <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">{lesson.detail}</span>
      </span>
      <ArrowRight size={16} className="mt-2 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
    </Link>
  );
}

/**
 * Nút nhắc ở đầu trang cho các bài đang trong hạn làm. Bấm vào sẽ chuyển đúng
 * tab (tuần/tháng) rồi cuộn tới thẻ bài đó.
 */
function DueBanner({ due, onGo }) {
  if (due.length === 0) return null;
  return (
    <section
      className="relative overflow-hidden rounded-3xl p-5 text-white md:p-6"
      style={{ background: "linear-gradient(120deg,#f97316,#ef4444 55%,#ec4899)" }}
      aria-label="Bài kiểm tra đến hạn"
    >
      <span className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10" aria-hidden="true" />
      <div className="relative">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-wide backdrop-blur">
          <AlarmClock size={13} /> Đến hạn làm bài
        </p>
        <h2 className="font-display mt-2.5 text-xl font-bold leading-tight md:text-2xl">
          Bạn có {due.length} bài kiểm tra cần hoàn thành
        </h2>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {due.map((entry) => (
            <button
              key={entry.period}
              type="button"
              onClick={() => onGo(entry)}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-rose-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span aria-hidden="true">{entry.icon}</span>
              {entry.label}
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-black text-rose-500">
                {entry.daysLeft === 0 ? "Hạn hôm nay" : `Còn ${entry.daysLeft} ngày`}
              </span>
              <ArrowRight size={15} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Lịch sử điểm các bài đã làm — gộp cả kỳ tuần và tháng, mới nhất trước. */
function ScoreHistory({ history }) {
  if (history.length === 0) {
    return (
      <section className="surface p-5 md:p-6">
        <h2 className="flex items-center gap-2 text-sm font-black text-slate-900">
          <History size={16} className="text-slate-500" /> Lịch sử điểm
        </h2>
        <p className="mt-3 text-sm font-medium text-slate-500">Chưa có bài kiểm tra nào được chấm điểm.</p>
      </section>
    );
  }

  return (
    <section className="surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-5">
        <h2 className="flex items-center gap-2 text-sm font-black text-slate-900">
          <History size={16} className="text-slate-500" /> Lịch sử điểm
        </h2>
        <span className="text-xs font-bold text-slate-400">{history.length} bài đã chấm</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3">Bài kiểm tra</th>
              <th className="px-3 py-3">Kỳ</th>
              <th className="px-3 py-3">Điểm từng trục</th>
              <th className="px-5 py-3 text-right">Điểm chung</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item, index) => {
              const overall = overallScore(item);
              const tone = scoreTone(overall);
              // So với bài liền trước (cũ hơn) để thấy xu hướng tăng/giảm.
              const previous = history[index + 1] ? overallScore(history[index + 1]) : null;
              const delta = previous === null ? null : overall - previous;
              return (
                <tr key={`${item.period}-${item.id}`} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-5 py-3.5">
                    <div className="text-sm font-black text-slate-900">{item.title}</div>
                    <div className="text-[11px] font-bold text-slate-400">{item.periodLabel}</div>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-black ${
                      item.period === "weekly" ? "bg-sky-50 text-sky-700" : "bg-violet-50 text-violet-700"
                    }`}>
                      {item.period === "weekly" ? "Tuần" : "Tháng"}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {STEAM_ORDER.map((axis) => {
                        const value = item.skills[axis];
                        const weak = value < 60;
                        return (
                          <span
                            key={axis}
                            className="rounded-md px-1.5 py-0.5 text-[10px] font-black"
                            style={{
                              background: weak ? "#ffe4e6" : `${STEAM_AXES[axis].color}1a`,
                              color: weak ? "#e11d48" : STEAM_AXES[axis].color,
                            }}
                            title={`${axis} · ${STEAM_AXES[axis].label}: ${value}%`}
                          >
                            {axis} {value}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`inline-block rounded-xl px-3 py-1 text-lg font-black ${tone.bg} ${tone.text}`}>
                      {overall}
                    </span>
                    {delta !== null && delta !== 0 && (
                      <div className={`mt-0.5 flex items-center justify-end gap-0.5 text-[11px] font-black ${
                        delta > 0 ? "text-emerald-600" : "text-rose-500"
                      }`}>
                        {delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {delta > 0 ? "+" : ""}{delta}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AssessmentCard({ assessment, highlight }) {
  const upcoming = assessment.status === "upcoming";
  const due = isDue(assessment);
  const remaining = due ? daysLeft(assessment) : null;
  const overall = overallScore(assessment);
  const weak = weakAxes(assessment);
  const tone = scoreTone(overall);

  return (
    <article
      className="surface overflow-hidden transition"
      style={highlight ? { boxShadow: "0 0 0 3px #fb923c, 0 12px 30px rgba(249,115,22,.22)" } : undefined}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-slate-400">
            {due
              ? <span className="inline-flex items-center gap-1 text-orange-600"><AlarmClock size={13} /> Đang mở · đến hạn làm</span>
              : upcoming
                ? <><Clock3 size={13} /> Sắp diễn ra</>
                : <><CheckCircle2 size={13} className="text-emerald-500" /> Đã hoàn thành</>}
          </div>
          <h3 className="mt-1 text-base font-black text-slate-950">{assessment.title}</h3>
          <p className="text-xs font-bold text-slate-500">{assessment.periodLabel}</p>
        </div>
        {due ? (
          <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-600">
            {remaining === 0 ? "Hạn hôm nay" : `Còn ${remaining} ngày`}
          </span>
        ) : upcoming ? (
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-500">Chưa có điểm</span>
        ) : (
          <div className={`shrink-0 rounded-2xl px-4 py-2 text-center ${tone.bg}`}>
            <div className="text-[10px] font-black uppercase text-slate-400">Điểm chung</div>
            <div className={`text-2xl font-black ${tone.text}`}>{overall}</div>
          </div>
        )}
      </div>

      {due ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm font-medium text-slate-500">
            Bài đang mở. Ôn nhanh ở <Link to="/student/path" className="font-black text-emerald-700 hover:underline">Lộ trình học</Link> rồi vào làm nhé.
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-600"
          >
            Vào làm bài ngay <ArrowRight size={16} />
          </button>
        </div>
      ) : upcoming ? (
        <div className="p-5 text-sm font-medium text-slate-500">
          Bài kiểm tra sẽ mở theo lịch. Ôn tập trước ở <Link to="/student/path" className="font-black text-emerald-700 hover:underline">Lộ trình học</Link>.
        </div>
      ) : (
        <div className="space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {STEAM_ORDER.map((axis) => (
              <SkillBar key={axis} axis={axis} score={assessment.skills[axis]} weak={weak.includes(axis)} />
            ))}
          </div>

          {weak.length > 0 ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
              <div className="flex items-center gap-2 text-xs font-black text-rose-700">
                <TriangleAlert size={15} />
                Phát hiện {weak.length} kỹ năng còn yếu — gợi ý bài học bổ trợ
              </div>
              <div className="mt-3 space-y-2">
                {weak.map((axis) => <RemedialCard key={axis} axis={axis} />)}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-800">
              <Sparkles size={15} /> Tuyệt vời! Cả 5 kỹ năng STEAM đều đạt yêu cầu.
            </div>
          )}
        </div>
      )}
    </article>
  );
}

// Tổng quan năng lực STEAM trung bình qua các bài đã làm của kỳ đang xem.
function SteamOverview({ assessments }) {
  const averages = averageByAxis(assessments);
  return (
    <div className="surface p-5 md:p-6">
      <h2 className="flex items-center gap-2 text-sm font-black text-slate-900">
        <Sparkles size={16} className="text-emerald-600" /> Bản đồ năng lực STEAM
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STEAM_ORDER.map((axis) => {
          const meta = STEAM_AXES[axis];
          const value = averages[axis];
          return (
            <div key={axis} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-center">
              <div className="text-2xl" aria-hidden="true">{meta.emoji}</div>
              <div className="mt-1 text-lg font-black" style={{ color: value < 60 ? "#e11d48" : meta.color }}>{value}%</div>
              <div className="text-[11px] font-bold text-slate-500">{axis} · {meta.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AssessmentsPage() {
  const [tab, setTab] = useState("weekly");
  const [highlightId, setHighlightId] = useState(null);
  const cardRefs = useRef({});
  const list = ASSESSMENTS[tab] ?? [];
  const due = useMemo(() => dueAssessments(), []);
  const history = useMemo(() => scoreHistory(), []);

  // Bấm nút nhắc ở đầu trang -> đổi tab tương ứng rồi cuộn tới đúng thẻ bài.
  const goToDue = (entry) => {
    setTab(entry.period);
    setHighlightId(entry.assessment.id);
    // Chờ tab render xong mới cuộn.
    setTimeout(() => {
      cardRefs.current[entry.assessment.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link to="/student" className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-500 hover:text-slate-950">
          <ArrowLeft size={16} /> Tổng quan
        </Link>
        <h1 className="font-display mt-1.5 text-2xl font-bold text-slate-950 md:text-3xl">Kiểm tra & Đánh giá</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Theo dõi bài kiểm tra theo tuần/tháng. Kỹ năng STEAM nào còn yếu sẽ được gợi ý bài học bổ trợ liên quan.
        </p>
      </div>

      <DueBanner due={due} onGo={goToDue} />

      {/* Tabs Theo tuần / Theo tháng */}
      <div className="inline-flex rounded-full bg-slate-100 p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-black transition ${
              tab === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
            aria-pressed={tab === key}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <SteamOverview assessments={list} />

      <div className="space-y-4">
        {list.map((assessment) => (
          <div key={assessment.id} ref={(el) => { cardRefs.current[assessment.id] = el; }}>
            <AssessmentCard assessment={assessment} highlight={highlightId === assessment.id} />
          </div>
        ))}
      </div>

      <ScoreHistory history={history} />
    </div>
  );
}
