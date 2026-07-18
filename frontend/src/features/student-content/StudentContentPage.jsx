import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";

import { SOFT_SKILL_LESSONS } from "./softSkillLessons.js";

// Trạng thái bài học — tất cả đều mở, không còn khóa theo điều kiện tiên quyết.
const statusMeta = {
  READY: { label: "CÓ THỂ HỌC NGAY", tone: "text-emerald-700 bg-emerald-50" },
  IN_PROGRESS: { label: "NÊN HỌC TIẾP", tone: "text-sky-700 bg-sky-50" },
  COMPLETED: { label: "ĐÃ HOÀN THÀNH", tone: "text-slate-600 bg-slate-100" },
};

export function StudentContentPage() {
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const lessons = SOFT_SKILL_LESSONS;
  const publishedCount = lessons.length;
  // Không còn bài nào bị khóa — tất cả đều có thể học ngay.
  const availableCount = lessons.length;
  const completedCount = lessons.filter((lesson) => lesson.status === "COMPLETED").length;

  return (
    <div className="space-y-5">
      <header className="border-b border-slate-200 pb-5">
        <p className="eyebrow">Thư viện kỹ năng mềm</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950 md:text-3xl">Nội dung đã được giáo viên duyệt</h1>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
          Khám phá và rèn luyện các kỹ năng thiết yếu. Bạn có thể tự do lựa chọn và bắt đầu học bất kỳ bài học nào mà không cần điều kiện tiên quyết.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Tổng quan nội dung">
        <div className="surface flex min-h-24 items-center gap-4 p-4"><div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><BookOpenCheck size={21} /></div><div><p className="text-2xl font-black">{publishedCount}</p><p className="mt-1 text-xs font-bold text-slate-500">Bài đã xuất bản</p></div></div>
        <div className="surface flex min-h-24 items-center gap-4 p-4"><div className="grid h-11 w-11 place-items-center rounded-lg bg-sky-50 text-sky-700"><CheckCircle2 size={21} /></div><div><p className="text-2xl font-black">{availableCount}</p><p className="mt-1 text-xs font-bold text-slate-500">Có thể học ngay</p></div></div>
        <div className="surface flex min-h-24 items-center gap-4 p-4"><div className="grid h-11 w-11 place-items-center rounded-lg bg-amber-50 text-amber-700"><Clock3 size={21} /></div><div><p className="text-2xl font-black">{completedCount}/{lessons.length}</p><p className="mt-1 text-xs font-bold text-slate-500">Tiến độ rèn luyện</p></div></div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Danh sách bài học">
        {lessons.map((lesson) => {
          const meta = statusMeta[lesson.status] ?? statusMeta.READY;
          return (
            <article key={lesson.id} className="surface flex min-h-64 flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-700 text-white">
                  <BookOpenCheck size={20} />
                </div>
                <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700"><CheckCircle2 className="mr-1 inline" size={13} />Đã duyệt</span>
              </div>
              <p className="mt-5 text-xs font-black uppercase text-slate-400">{lesson.nodeCode}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-black ${meta.tone}`}><Sparkles size={12} />{meta.label}</span>
                <span className="text-[11px] font-bold text-slate-400">{lesson.category}</span>
              </div>
              <h2 className="mt-2 text-lg font-black text-slate-950">{lesson.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm font-medium leading-6 text-slate-500">{lesson.description}</p>
              <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                  <span className="inline-flex items-center gap-1"><Clock3 size={13} />{lesson.duration}</span>
                  <span className="inline-flex items-center gap-1 text-amber-600"><Trophy size={13} />{lesson.xpReward} XP</span>
                </div>
                <Link className="inline-flex items-center gap-2 text-sm font-black text-emerald-700 hover:text-emerald-900" to={`/student/soft-skills/${lesson.id}`}>Mở bài học <ArrowRight size={17} /></Link>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
