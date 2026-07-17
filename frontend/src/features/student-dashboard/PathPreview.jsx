import { Check, LockKeyhole, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const STATUS = {
  completed: { icon: Check, label: "Đã xong", className: "node-completed" },
  current: { icon: Sparkles, label: "Tiếp theo", className: "node-current" },
  available: { icon: Sparkles, label: "Sẵn sàng", className: "node-available" },
  locked: { icon: LockKeyhole, label: "Đang khóa", className: "node-locked" },
};

export function PathPreview({ nodes, progress }) {
  return (
    <section className="surface p-5 md:p-6" aria-labelledby="path-preview-title">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Scratch Foundation</p>
          <h2 id="path-preview-title" className="section-title">Lộ trình của bạn</h2>
        </div>
        <Link to="/student/path" className="text-link">Xem tất cả</Link>
      </div>
      <div className="mt-5 space-y-1">
        {nodes.map((node, index) => {
          const state = STATUS[node.status] || STATUS.locked;
          const Icon = state.icon;
          return (
            <div key={node.id} className="flex min-h-14 items-center gap-3">
              <div className="relative flex self-stretch items-center">
                {index < nodes.length - 1 && <div className="path-line" />}
                <div className={`path-dot ${state.className}`}><Icon size={15} /></div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-extrabold text-slate-800">{node.name}</div>
                <div className="mt-0.5 text-xs font-semibold text-slate-400">{state.label}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${progress.total ? (progress.completed / progress.total) * 100 : 0}%` }}
          />
        </div>
        <span className="text-xs font-extrabold text-slate-500">
          {progress.completed}/{progress.total}
        </span>
      </div>
    </section>
  );
}
