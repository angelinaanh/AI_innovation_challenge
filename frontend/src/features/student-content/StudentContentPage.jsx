import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Compass,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { STEAM_AXES, STEAM_META } from "../../lib/steam.js";
import { SOFT_SKILL_LESSONS } from "./softSkillLessons.js";

// Trạng thái bài học — tất cả đều mở, không còn khóa theo điều kiện tiên quyết.
const statusMeta = {
  READY: { label: "CÓ THỂ HỌC NGAY", tone: "text-emerald-700 bg-emerald-50" },
  IN_PROGRESS: { label: "NÊN HỌC TIẾP", tone: "text-sky-700 bg-sky-50" },
  COMPLETED: { label: "ĐÃ HOÀN THÀNH", tone: "text-slate-600 bg-slate-100" },
};

function SteamTag({ axis, withLabel = false }) {
  const meta = STEAM_META[axis];
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-black"
      style={{ background: meta.bg, color: meta.text }}
      title={meta.label}
    >
      {axis}{withLabel ? ` · ${meta.label}` : ""}
    </span>
  );
}

export function StudentContentPage() {
  const [axisFilter, setAxisFilter] = useState(null); // null = tất cả

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const lessons = SOFT_SKILL_LESSONS;
  // Số node chạm tới từng trục — dùng cho nhãn đếm trên bộ lọc.
  const axisCounts = useMemo(() => {
    const counts = Object.fromEntries(STEAM_AXES.map((axis) => [axis, 0]));
    lessons.forEach((lesson) => lesson.steam.forEach((axis) => { counts[axis] += 1; }));
    return counts;
  }, [lessons]);

  const visible = axisFilter ? lessons.filter((l) => l.steam.includes(axisFilter)) : lessons;
  const completedCount = lessons.filter((lesson) => lesson.status === "COMPLETED").length;
  const totalXp = lessons.reduce((sum, lesson) => sum + lesson.xpReward, 0);

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes ssFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        .ss-float { animation: ssFloat 4.5s ease-in-out infinite; }
        .ss-card { transition: transform .22s ease, box-shadow .22s ease; }
        .ss-card:hover { transform: translateY(-4px); box-shadow: 0 16px 34px rgba(15,23,42,.11); }
        .ss-card:hover .ss-emoji { transform: scale(1.12) rotate(-6deg); }
        .ss-emoji { transition: transform .25s ease; }
      `}</style>

      {/* Hero nhiều màu — 5 trục STEAM chạy thành dải gradient */}
      <header className="relative overflow-hidden rounded-3xl p-6 text-white md:p-8"
        style={{ background: "linear-gradient(120deg,#22c55e,#3b82f6 32%,#a855f7 62%,#f97316 88%)" }}
      >
        <span className="ss-float pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10" aria-hidden="true" />
        <span className="ss-float pointer-events-none absolute -bottom-14 left-1/3 h-32 w-32 rounded-full bg-white/10" aria-hidden="true" />
        <div className="relative z-10">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-wide backdrop-blur">
            <Sparkles size={13} /> Thư viện kỹ năng mềm STEAM
          </p>
          <h1 className="font-display mt-3 text-2xl font-bold leading-tight md:text-4xl">
            Rèn kỹ năng để làm chủ mọi dự án STEAM 🚀
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/90">
            Mỗi node gắn với các trục STEAM cụ thể. Chọn trục bạn muốn mạnh lên, học theo thứ tự nào cũng được —
            không có điều kiện tiên quyết.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-black">
            <span className="rounded-full bg-white/20 px-3 py-1.5 backdrop-blur">{lessons.length} node kỹ năng</span>
            <span className="rounded-full bg-white/20 px-3 py-1.5 backdrop-blur">🏆 {totalXp} XP có thể nhận</span>
            <span className="rounded-full bg-white/20 px-3 py-1.5 backdrop-blur">✓ Giáo viên đã duyệt</span>
          </div>
        </div>
        <BookOpenCheck className="pointer-events-none absolute -bottom-6 right-4 text-white/10" size={170} aria-hidden="true" />
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Tổng quan nội dung">
        <div className="surface flex min-h-24 items-center gap-4 p-4">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><BookOpenCheck size={21} /></div>
          <div><p className="text-2xl font-black">{lessons.length}</p><p className="mt-1 text-xs font-bold text-slate-500">Node đã xuất bản</p></div>
        </div>
        <div className="surface flex min-h-24 items-center gap-4 p-4">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-sky-100 text-sky-700"><CheckCircle2 size={21} /></div>
          <div><p className="text-2xl font-black">{visible.length}</p><p className="mt-1 text-xs font-bold text-slate-500">{axisFilter ? `Node thuộc trục ${axisFilter}` : "Có thể học ngay"}</p></div>
        </div>
        <div className="surface flex min-h-24 items-center gap-4 p-4">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-700"><Trophy size={21} /></div>
          <div><p className="text-2xl font-black">{completedCount}/{lessons.length}</p><p className="mt-1 text-xs font-bold text-slate-500">Tiến độ rèn luyện</p></div>
        </div>
      </section>

      {/* Bộ lọc theo trục STEAM */}
      <section className="surface p-4 md:p-5" aria-label="Lọc theo trục STEAM">
        <div className="mb-3 flex items-center gap-2">
          <Compass size={16} className="text-slate-500" aria-hidden="true" />
          <p className="text-sm font-black text-slate-900">Lọc theo trục STEAM</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAxisFilter(null)}
            className={`rounded-full px-3.5 py-2 text-xs font-black transition ${
              axisFilter === null ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tất cả · {lessons.length}
          </button>
          {STEAM_AXES.map((axis) => {
            const meta = STEAM_META[axis];
            const active = axisFilter === axis;
            return (
              <button
                key={axis}
                type="button"
                onClick={() => setAxisFilter(active ? null : axis)}
                className="rounded-full px-3.5 py-2 text-xs font-black transition hover:-translate-y-0.5"
                style={active
                  ? { background: meta.solid, color: "#fff", boxShadow: `0 6px 16px ${meta.solid}55` }
                  : { background: meta.bg, color: meta.text }}
              >
                {meta.emoji} {axis} · {meta.label} ({axisCounts[axis]})
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Danh sách bài học">
        {visible.map((lesson) => {
          const meta = statusMeta[lesson.status] ?? statusMeta.READY;
          // Trục đầu tiên là trục chính -> quyết định màu của node.
          const axis = STEAM_META[lesson.steam[0]];
          return (
            <article
              key={lesson.id}
              className="ss-card surface relative flex min-h-64 flex-col overflow-hidden p-5"
              style={{ borderTop: `4px solid ${axis.solid}` }}
            >
              {/* Vệt màu trang trí theo trục chính */}
              <span
                className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-70"
                style={{ background: axis.bg }}
                aria-hidden="true"
              />
              <div className="relative flex items-start justify-between gap-3">
                <div
                  className="ss-emoji grid h-14 w-14 place-items-center rounded-2xl text-3xl shadow-sm"
                  style={{ background: axis.solid }}
                  aria-hidden="true"
                >
                  {lesson.emoji}
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {lesson.steam.map((code) => <SteamTag key={code} axis={code} />)}
                </div>
              </div>

              <p className="relative mt-4 text-xs font-black uppercase text-slate-400">{lesson.nodeCode}</p>
              <div className="relative mt-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-black ${meta.tone}`}>
                  <Sparkles size={12} />{meta.label}
                </span>
                <span className="text-[11px] font-bold text-slate-400">{lesson.category}</span>
              </div>
              <h2 className="relative mt-2 text-lg font-black text-slate-950">{lesson.title}</h2>
              <p className="relative mt-2 line-clamp-3 text-sm font-medium leading-6 text-slate-500">{lesson.description}</p>

              <div className="relative mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                  <span className="inline-flex items-center gap-1"><Clock3 size={13} />{lesson.duration}</span>
                  <span className="inline-flex items-center gap-1 text-amber-600"><Trophy size={13} />{lesson.xpReward} XP</span>
                </div>
                <Link
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-black text-white transition hover:opacity-90"
                  style={{ background: axis.solid }}
                  to={`/student/soft-skills/${lesson.id}`}
                >
                  Học ngay <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
