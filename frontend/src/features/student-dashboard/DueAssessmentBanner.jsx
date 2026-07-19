import { AlarmClock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { dueAssessments } from "../assessments/assessmentsData.js";

/**
 * Nhắc bài kiểm tra tuần/tháng đang đến hạn ngay ở trang Tổng quan.
 * Không render gì khi không có bài nào trong hạn.
 */
export function DueAssessmentBanner() {
  const due = dueAssessments();
  if (due.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden rounded-3xl p-5 text-white md:p-6"
      style={{ background: "linear-gradient(120deg,#f97316,#ef4444 60%,#ec4899)" }}
      aria-label="Bài kiểm tra đến hạn"
    >
      <span className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" aria-hidden="true" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-wide backdrop-blur">
            <AlarmClock size={13} /> Đến hạn làm bài
          </p>
          <h2 className="font-display mt-2 text-xl font-bold leading-tight md:text-2xl">
            {due.map((entry) => entry.label).join(" · ")} đang mở
          </h2>
          <p className="mt-1 text-sm font-semibold text-white/90">
            {due.length > 1
              ? `Bạn có ${due.length} bài cần hoàn thành trước hạn.`
              : due[0].daysLeft === 0
                ? "Hạn nộp là hôm nay — đừng bỏ lỡ nhé!"
                : `Còn ${due[0].daysLeft} ngày để hoàn thành.`}
          </p>
        </div>
        <Link
          to="/student/assessments"
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-rose-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          Vào làm bài ngay <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}
