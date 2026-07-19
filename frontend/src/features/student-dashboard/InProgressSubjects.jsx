import { ArrowRight, BookMarked, Compass } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { STEAM_META } from "../../lib/steam.js";
import { SUBJECT_ICONS, inProgressSubjects } from "../learning-path/curriculum.js";

/**
 * "Môn học đang học dở" — thay cho khối Lộ trình của bạn ở trang Tổng quan.
 * Tiến độ lấy từ localStorage (nguồn LearningPathDetail đang ghi), nên chỉ hiện
 * những môn học sinh đã thực sự bắt đầu.
 */
export function InProgressSubjects({ grade }) {
  const entries = useMemo(() => inProgressSubjects(grade), [grade]);

  return (
    <section className="surface p-5 md:p-6" aria-labelledby="in-progress-title">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Tiếp tục từ chỗ đang dở</p>
          <h2 id="in-progress-title" className="section-title">Môn đang học</h2>
        </div>
        <Link to="/student/path" className="text-link">Xem tất cả</Link>
      </div>

      {entries.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center">
          <Compass size={22} className="mx-auto text-slate-400" aria-hidden="true" />
          <p className="mt-2 text-sm font-bold text-slate-600">Bạn chưa bắt đầu môn nào.</p>
          <p className="mt-1 text-xs font-medium text-slate-500">Chọn một môn trong lộ trình để bắt đầu hành trình học.</p>
          <Link to="/student/path" className="secondary-button mt-3 inline-flex">
            Khám phá lộ trình <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {entries.map(({ subject, done, total, pct }) => {
            const color = STEAM_META[subject.steam[0]].solid;
            return (
              <Link
                key={subject.key}
                to="/student/path"
                className="group flex items-center gap-3.5 rounded-2xl border border-slate-200 p-3.5 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl"
                  style={{ background: `${color}1a` }}
                  aria-hidden="true"
                >
                  {SUBJECT_ICONS[subject.key] || "📘"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-black text-slate-900">{subject.name}</span>
                    <span className="shrink-0 text-xs font-black" style={{ color }}>
                      {total ? `${pct}%` : `${done} bài`}
                    </span>
                  </span>
                  <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-slate-100">
                    <span
                      className="block h-full rounded-full transition-all duration-500"
                      style={{ width: `${total ? Math.max(pct, 4) : 100}%`, background: color }}
                    />
                  </span>
                  <span className="mt-1 flex items-center gap-1 text-[11px] font-bold text-slate-400">
                    <BookMarked size={11} />
                    {total ? `${done}/${total} bài đã xong` : `${done} bài đã xong`}
                  </span>
                </span>
                <ArrowRight size={16} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
