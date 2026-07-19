import { useEffect, useMemo, useState } from "react";
import { Clock, ChevronRight } from "lucide-react";
import {
  ArenaPodiumIllustration,
  RoundOneIllustration,
  RoundTwoIllustration,
  RoundFinalIllustration,
} from "./illustrations.jsx";

/* ── Live countdown ─────────────────────────────────────────────────
 * Ticks every second toward `deadline` and returns padded D/H/M/S.    */
function useCountdown(deadline) {
  const target = useMemo(() => new Date(deadline).getTime(), [deadline]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, target - now);
  const pad = (n) => String(n).padStart(2, "0");
  return {
    ended: diff === 0,
    days: pad(Math.floor(diff / 86400000)),
    hours: pad(Math.floor((diff / 3600000) % 24)),
    minutes: pad(Math.floor((diff / 60000) % 60)),
    seconds: pad(Math.floor((diff / 1000) % 60)),
  };
}

function CountdownUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <span className="rounded-lg bg-emerald-500/90 px-2.5 py-1 font-mono text-lg font-black tabular-nums text-white shadow-sm">
        {value}
      </span>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-blue-200/80">{label}</span>
    </div>
  );
}

/* Top-3 mini leaderboard rows. */
const LEADERBOARD = [
  { rank: 1, name: "Trần Thị A", xp: 1250, tint: "bg-rose-400" },
  { rank: 2, name: "Phạm Minh T", xp: 1200, tint: "bg-sky-400" },
  { rank: 3, name: "Lê Hoàng D", xp: 1180, tint: "bg-violet-400" },
];

const ROUNDS = [
  {
    id: "round-1",
    kicker: "Vòng 1",
    title: "Thử thách nhanh",
    Illustration: RoundOneIllustration,
    from: "from-sky-900",
    to: "to-blue-950",
  },
  {
    id: "round-2",
    kicker: "Vòng 2",
    title: "Giải bài toán phức tạp",
    Illustration: RoundTwoIllustration,
    from: "from-cyan-900",
    to: "to-blue-950",
  },
  {
    id: "round-final",
    kicker: "Vòng chung kết",
    title: "Vinh quang",
    Illustration: RoundFinalIllustration,
    from: "from-indigo-900",
    to: "to-slate-950",
  },
];

export function KnowledgeArenaSection({
  registrationDeadline,
  onRegister,
  onViewRules,
}) {
  // Default: ~3 days 14h 52m out, matching the reference mock.
  const deadline = useMemo(
    () => registrationDeadline || new Date(Date.now() + (3 * 86400 + 14 * 3600 + 52 * 60) * 1000).toISOString(),
    [registrationDeadline]
  );
  const { days, hours, minutes, seconds, ended } = useCountdown(deadline);

  return (
    <section className="mb-8">
      {/* ── Main competition banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b2a5b] via-[#123a7a] to-[#0a1f45] shadow-[0_10px_40px_rgba(11,42,91,0.35)]">
        {/* soft glow accents */}
        <div className="pointer-events-none absolute -left-16 top-0 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:gap-4 lg:p-8">
          {/* Left: title + hero illustration */}
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-300 ring-1 ring-inset ring-white/15">
              🏆 Knowledge Arena • Mùa 1
            </span>
            <h2 className="mt-3 font-display text-2xl font-black leading-tight text-white sm:text-3xl lg:text-[2.1rem]">
              CHINH PHỤC ĐỈNH CAO TRI THỨC
              <span className="mt-1 block bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">
                Đấu trường EduOne Mùa 1
              </span>
            </h2>
            <p className="mt-2 max-w-md text-sm font-semibold text-blue-100/80">
              Tranh tài qua 3 vòng thi, leo bảng xếp hạng và giành lấy chiếc cúp vinh quang.
            </p>
            <ArenaPodiumIllustration className="mt-4 h-48 w-full max-w-lg sm:h-56" />
          </div>

          {/* Right: registration info card */}
          <div className="w-full shrink-0 rounded-2xl bg-white p-5 shadow-xl lg:w-80">
            {/* Countdown */}
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-slate-500">
              <Clock size={14} className="text-emerald-500" />
              Thời gian đăng ký còn lại
            </div>
            {ended ? (
              <div className="mt-3 rounded-xl bg-rose-50 py-3 text-center text-sm font-black text-rose-600">
                Đã kết thúc đăng ký
              </div>
            ) : (
              <div className="mt-3 flex items-start justify-center gap-2">
                <CountdownUnit value={days} label="Ngày" />
                <span className="pt-1 text-lg font-black text-slate-300">:</span>
                <CountdownUnit value={hours} label="Giờ" />
                <span className="pt-1 text-lg font-black text-slate-300">:</span>
                <CountdownUnit value={minutes} label="Phút" />
                <span className="pt-1 text-lg font-black text-slate-300">:</span>
                <CountdownUnit value={seconds} label="Giây" />
              </div>
            )}

            {/* Mini leaderboard */}
            <div className="mt-5">
              <div className="mb-2 text-xs font-black text-slate-700">Top 3 Thí sinh dẫn đầu:</div>
              <div className="space-y-2">
                {LEADERBOARD.map((p) => (
                  <div key={p.rank} className="flex items-center gap-2.5">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black text-white ${p.tint}`}>
                      {p.name.charAt(0)}
                    </div>
                    <span className="flex-1 truncate text-sm font-bold text-slate-800">{p.name}</span>
                    <span className="text-sm font-black text-emerald-600">{p.xp.toLocaleString("vi-VN")} XP</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={onRegister}
              className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 py-3 text-sm font-black text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-600 hover:to-green-600 active:scale-[0.98]"
            >
              Đăng ký ngay
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={onViewRules}
              className="mt-2.5 w-full text-center text-xs font-bold text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-emerald-600"
            >
              Xem thể lệ chi tiết.
            </button>
          </div>
        </div>
      </div>

      {/* ── Round thumbnail cards ── */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {ROUNDS.map(({ id, kicker, title, Illustration, from, to }) => (
          <button
            key={id}
            type="button"
            className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br ${from} ${to} p-4 text-left shadow-lg ring-1 ring-inset ring-white/10 transition hover:-translate-y-0.5 hover:shadow-xl`}
          >
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-black uppercase tracking-widest text-sky-300/90">{kicker}</div>
              <div className="mt-0.5 font-display text-base font-black uppercase leading-snug text-white">{title}</div>
            </div>
            <Illustration className="h-20 w-28 shrink-0 transition-transform duration-300 group-hover:scale-105" />
          </button>
        ))}
      </div>
    </section>
  );
}
