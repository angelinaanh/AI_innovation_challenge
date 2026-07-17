import { Check, Flame } from "lucide-react";

export function WeekActivity({ days }) {
  return (
    <section className="surface p-5 md:p-6" aria-labelledby="week-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Nhịp học</p>
          <h2 id="week-title" className="section-title">7 ngày gần nhất</h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
          {days.filter((day) => day.active).length}/7 ngày
        </span>
      </div>
      <div className="mt-5 grid grid-cols-7 gap-2">
        {days.map((day) => (
          <div key={day.date} className="text-center">
            <div className={`day-dot ${day.active ? "day-dot-active" : "day-dot-idle"}`}>
              {day.active ? <Flame size={17} fill="currentColor" /> : <Check size={15} />}
            </div>
            <div className="mt-2 text-[11px] font-extrabold uppercase text-slate-500">
              {day.day.replace("Th ", "T")}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
