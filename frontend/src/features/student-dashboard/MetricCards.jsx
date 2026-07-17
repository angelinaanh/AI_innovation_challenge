import { Bolt, CalendarDays, Flame } from "lucide-react";

export function MetricCards({ dashboard }) {
  const activeDays = dashboard.weekActivity.filter((day) => day.active).length;

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <section className="surface metric-card">
        <div className="metric-icon bg-[#ff5b45] text-white"><Flame size={22} /></div>
        <div>
          <p className="metric-label">Chuỗi học tập</p>
          <p className="metric-value">{dashboard.gamification.streak.current_streak} ngày</p>
          <p className="metric-note">Kỷ lục {dashboard.gamification.streak.longest_streak} ngày</p>
        </div>
      </section>
      <section className="surface metric-card">
        <div className="metric-icon bg-emerald-500 text-white"><CalendarDays size={22} /></div>
        <div>
          <p className="metric-label">7 ngày gần nhất</p>
          <p className="metric-value">{activeDays} ngày học</p>
          <p className="metric-note">Nhịp học đều đặn</p>
        </div>
      </section>
      <section className="surface metric-card">
        <div className="metric-icon bg-amber-400 text-slate-950"><Bolt size={22} /></div>
        <div>
          <p className="metric-label">Tổng XP</p>
          <p className="metric-value">{dashboard.gamification.totalExp.toLocaleString("vi-VN")}</p>
          <p className="metric-note">+{dashboard.weekExp} XP tuần này</p>
        </div>
      </section>
    </div>
  );
}
