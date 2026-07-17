import { Award, Flame, Rocket } from "lucide-react";

const ICONS = [Rocket, Flame, Award];
const COLORS = ["badge-amber", "badge-coral", "badge-cyan"];

export function BadgeShelf({ badges }) {
  return (
    <section className="surface p-5 md:p-6" aria-labelledby="badge-title">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Bộ sưu tập</p>
          <h2 id="badge-title" className="section-title">Huy hiệu mới nhất</h2>
        </div>
        <span className="text-sm font-extrabold text-violet-600">{badges.length} huy hiệu</span>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        {badges.slice(0, 3).map((badge, index) => {
          const Icon = ICONS[index % ICONS.length];
          return (
            <div key={badge.id} className="min-w-0 text-center" title={badge.description}>
              <div className={`badge-icon ${COLORS[index % COLORS.length]}`}>
                <Icon size={25} strokeWidth={2.2} aria-hidden="true" />
              </div>
              <div className="mt-2 text-xs font-extrabold leading-4 text-slate-700">
                {badge.name}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
