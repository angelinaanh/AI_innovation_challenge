import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  ASSESSMENTS,
  REMEDIAL_BY_AXIS,
  STEAM_AXES,
  STEAM_ORDER,
  averageByAxis,
  overallScore,
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

function AssessmentCard({ assessment }) {
  const upcoming = assessment.status === "upcoming";
  const overall = overallScore(assessment);
  const weak = weakAxes(assessment);
  const tone = scoreTone(overall);

  return (
    <article className="surface overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide text-slate-400">
            {upcoming ? <><Clock3 size={13} /> Sắp diễn ra</> : <><CheckCircle2 size={13} className="text-emerald-500" /> Đã hoàn thành</>}
          </div>
          <h3 className="mt-1 text-base font-black text-slate-950">{assessment.title}</h3>
          <p className="text-xs font-bold text-slate-500">{assessment.periodLabel}</p>
        </div>
        {upcoming ? (
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-500">Chưa có điểm</span>
        ) : (
          <div className={`shrink-0 rounded-2xl px-4 py-2 text-center ${tone.bg}`}>
            <div className="text-[10px] font-black uppercase text-slate-400">Điểm chung</div>
            <div className={`text-2xl font-black ${tone.text}`}>{overall}</div>
          </div>
        )}
      </div>

      {upcoming ? (
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
  const list = ASSESSMENTS[tab] ?? [];

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
        {list.map((assessment) => <AssessmentCard key={assessment.id} assessment={assessment} />)}
      </div>
    </div>
  );
}
