export function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-3" aria-label="EduOne">
      <div className="brand-mark" aria-hidden="true">
        <span>E</span>
        <i />
      </div>
      {!compact && (
        <div className="min-w-0">
          <div className="text-[19px] font-black leading-none text-slate-950">
            Edu<span className="text-emerald-600">One</span>
          </div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Grow your way
          </div>
        </div>
      )}
    </div>
  );
}
