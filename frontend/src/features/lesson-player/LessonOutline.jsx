import { Check, Circle, ClipboardCheck, ShieldCheck } from "lucide-react";

export function LessonOutline({ checkpoints, activeStep, onSelect }) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-[100px]">
      <section className="surface p-5" aria-labelledby="lesson-outline-title">
        <p className="eyebrow">Nội dung bài học</p>
        <h2 id="lesson-outline-title" className="section-title">Hành trình 4 bước</h2>
        <div className="mt-5 space-y-2">
          {checkpoints.map((checkpoint, index) => {
            const isActive = activeStep === index;
            const isDone = activeStep > index;
            return (
              <button
                key={checkpoint.id}
                className={`lesson-step-button ${isActive ? "lesson-step-active" : ""}`}
                onClick={() => onSelect(index)}
                aria-current={isActive ? "step" : undefined}
              >
                <span className={`lesson-step-icon ${isDone ? "lesson-step-done" : ""}`}>
                  {isDone ? <Check size={14} /> : <Circle size={12} fill={isActive ? "currentColor" : "none"} />}
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-[11px] font-black uppercase text-slate-400">Bước {index + 1}</span>
                  <span className="mt-0.5 block truncate text-sm font-extrabold text-slate-700">{checkpoint.title}</span>
                </span>
              </button>
            );
          })}
          <button
            className={`lesson-step-button ${activeStep === checkpoints.length ? "lesson-step-active" : ""}`}
            onClick={() => onSelect(checkpoints.length)}
            aria-current={activeStep === checkpoints.length ? "step" : undefined}
          >
            <span className="lesson-step-icon"><ClipboardCheck size={15} /></span>
            <span className="min-w-0 text-left">
              <span className="block text-[11px] font-black uppercase text-slate-400">Bước cuối</span>
              <span className="mt-0.5 block text-sm font-extrabold text-slate-700">Kiểm tra nhanh</span>
            </span>
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase text-emerald-800">
          <ShieldCheck size={16} /> Nội dung đã duyệt
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-emerald-700">
          Bài học được giáo viên kiểm tra trước khi xuất bản cho học sinh.
        </p>
      </section>
    </aside>
  );
}
