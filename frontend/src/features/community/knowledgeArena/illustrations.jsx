/**
 * Vector illustrations for the "Knowledge Arena" (Đấu trường EduOne) section.
 *
 * Each illustration is a self-contained, responsive SVG component with a
 * `viewBox` so it can be lifted out and reused as a standalone thumbnail.
 * Style: modern flat-vector, vibrant, dark-blue "digital arena" ecosystem.
 *
 *   - ArenaPodiumIllustration  → main banner hero (podium + gold cup)
 *   - RoundOneIllustration     → Vòng 1: Thử thách nhanh
 *   - RoundTwoIllustration     → Vòng 2: Giải bài toán phức tạp
 *   - RoundFinalIllustration   → Vòng chung kết: Vinh quang
 */

/* Small helper: a stylised student figure (head + shoulders in uniform). */
function Student({ x, y, scale = 1, skin, hair, shirt = "#f8fafc", tie = "#1e3a8a", arms = "down" }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* body / uniform shirt */}
      <path d="M-26 60 Q-26 18 0 18 Q26 18 26 60 Z" fill={shirt} />
      {/* collar + tie */}
      <path d="M-8 20 L0 34 L8 20 Z" fill="#e2e8f0" />
      <path d="M0 24 L5 40 L0 52 L-5 40 Z" fill={tie} />
      {/* neck */}
      <rect x="-6" y="8" width="12" height="14" rx="5" fill={skin} />
      {/* head */}
      <circle cx="0" cy="-6" r="17" fill={skin} />
      {/* hair */}
      <path d="M-17 -6 Q-19 -26 0 -26 Q19 -26 17 -6 Q10 -18 0 -18 Q-10 -18 -17 -6 Z" fill={hair} />
      {/* raised arms when celebrating */}
      {arms === "up" && (
        <>
          <path d="M-22 30 Q-40 6 -34 -14" stroke={skin} strokeWidth="8" strokeLinecap="round" fill="none" />
          <path d="M22 30 Q40 6 34 -14" stroke={skin} strokeWidth="8" strokeLinecap="round" fill="none" />
        </>
      )}
    </g>
  );
}

/* Reusable faint "digital network" backdrop (nodes + links). */
function NetworkBackdrop({ id }) {
  return (
    <g opacity="0.5">
      <g stroke="#38bdf8" strokeWidth="1" opacity="0.35">
        <line x1="40" y1="40" x2="120" y2="90" />
        <line x1="120" y1="90" x2="70" y2="150" />
        <line x1="120" y1="90" x2="210" y2="60" />
        <line x1="210" y1="60" x2="300" y2="110" />
        <line x1="300" y1="110" x2="360" y2="50" />
        <line x1="300" y1="110" x2="330" y2="180" />
      </g>
      <g fill="#7dd3fc">
        {[[40, 40], [120, 90], [70, 150], [210, 60], [300, 110], [360, 50], [330, 180]].map(([cx, cy], i) => (
          <circle key={`${id}-${i}`} cx={cx} cy={cy} r={i % 2 ? 3 : 4.5} opacity="0.75" />
        ))}
      </g>
    </g>
  );
}

/* ───────────────────────── Main banner hero ───────────────────────── */
export function ArenaPodiumIllustration({ className = "" }) {
  return (
    <svg viewBox="0 0 420 300" className={className} role="img" aria-label="Học sinh ăn mừng trên bục vinh quang với cúp vàng">
      <defs>
        <radialGradient id="ka-glow" cx="50%" cy="38%" r="55%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.9" />
          <stop offset="45%" stopColor="#f59e0b" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ka-cup" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="ka-podium1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
      </defs>

      <NetworkBackdrop id="hero" />

      {/* glow behind the champion */}
      <ellipse cx="210" cy="120" rx="120" ry="110" fill="url(#ka-glow)" />

      {/* confetti */}
      {[["#f472b6", 60, 40], ["#34d399", 350, 60], ["#fbbf24", 300, 30], ["#60a5fa", 100, 70], ["#f472b6", 320, 130], ["#34d399", 90, 130]].map(
        ([c, x, y], i) => (
          <rect key={i} x={x} y={y} width="9" height="9" rx="2" fill={c} transform={`rotate(${i * 35} ${x} ${y})`} opacity="0.9" />
        )
      )}

      {/* runner-up left (silver, 2nd) */}
      <Student x={118} y={150} scale={0.85} skin="#8d5524" hair="#1f2937" shirt="#eef2ff" tie="#0f766e" arms="up" />
      {/* runner-up right (bronze, 3rd) */}
      <Student x={302} y={162} scale={0.8} skin="#f2c9a0" hair="#78350f" shirt="#eef2ff" tie="#7c3aed" arms="up" />

      {/* champion centre */}
      <Student x={210} y={112} scale={1} skin="#c68642" hair="#111827" shirt="#ffffff" tie="#1d4ed8" arms="up" />

      {/* gold trophy held aloft */}
      <g transform="translate(210 46)">
        <path d="M-26 0 Q-40 4 -34 22 Q-30 34 -18 30" fill="none" stroke="url(#ka-cup)" strokeWidth="6" />
        <path d="M26 0 Q40 4 34 22 Q30 34 18 30" fill="none" stroke="url(#ka-cup)" strokeWidth="6" />
        <path d="M-24 -12 H24 L20 26 Q12 40 0 40 Q-12 40 -20 26 Z" fill="url(#ka-cup)" />
        <rect x="-7" y="40" width="14" height="14" fill="#b45309" />
        <rect x="-18" y="54" width="36" height="8" rx="3" fill="#92400e" />
        {/* glowing 'E' emblem */}
        <circle cx="0" cy="10" r="13" fill="#0b2a5b" opacity="0.85" />
        <text x="0" y="16" textAnchor="middle" fontSize="17" fontWeight="900" fill="#fde68a" fontFamily="'Baloo 2', sans-serif">E</text>
        {/* sparkle */}
        <path d="M-30 -10 l3 6 l6 3 l-6 3 l-3 6 l-3 -6 l-6 -3 l6 -3 z" fill="#fef08a" opacity="0.95" />
      </g>

      {/* podiums */}
      <g>
        <rect x="150" y="210" width="120" height="72" rx="6" fill="url(#ka-podium1)" />
        <rect x="72" y="238" width="86" height="44" rx="6" fill="#1e40af" />
        <rect x="262" y="250" width="86" height="32" rx="6" fill="#1e3a8a" />
        <text x="210" y="258" textAnchor="middle" fontSize="30" fontWeight="900" fill="#dbeafe" fontFamily="'Baloo 2', sans-serif">1</text>
        <text x="115" y="272" textAnchor="middle" fontSize="20" fontWeight="900" fill="#bfdbfe" fontFamily="'Baloo 2', sans-serif">2</text>
        <text x="305" y="272" textAnchor="middle" fontSize="18" fontWeight="900" fill="#bfdbfe" fontFamily="'Baloo 2', sans-serif">3</text>
      </g>
    </svg>
  );
}

/* ───────────── Vòng 1: Thử thách nhanh (quick challenge) ───────────── */
export function RoundOneIllustration({ className = "" }) {
  return (
    <svg viewBox="0 0 220 160" className={className} role="img" aria-label="Học sinh giải bài toán nhanh trên màn hình">
      <defs>
        <linearGradient id="r1-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0c1e42" />
        </linearGradient>
      </defs>
      {/* screen / question board */}
      <rect x="96" y="24" width="104" height="76" rx="10" fill="url(#r1-screen)" stroke="#38bdf8" strokeWidth="2" />
      <rect x="120" y="100" width="56" height="7" rx="3" fill="#1e3a8a" />
      <rect x="132" y="107" width="32" height="14" rx="3" fill="#1e3a8a" />
      {/* question mark */}
      <text x="148" y="76" textAnchor="middle" fontSize="46" fontWeight="900" fill="#38bdf8" fontFamily="'Baloo 2', sans-serif">?</text>
      {/* quick math bits */}
      <text x="112" y="44" fontSize="12" fontWeight="900" fill="#fbbf24" fontFamily="monospace">7×8</text>
      {/* lightning = speed */}
      <path d="M60 18 l-14 26 h12 l-8 22 22 -30 h-12 z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
      {/* student */}
      <Student x={44} y={92} scale={0.9} skin="#c68642" hair="#111827" shirt="#e0f2fe" tie="#0ea5e9" />
      {/* raised hand pointing to screen */}
      <path d="M64 118 Q88 104 96 84" stroke="#c68642" strokeWidth="7" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ───────── Vòng 2: Giải bài toán phức tạp (collaboration) ─────────── */
export function RoundTwoIllustration({ className = "" }) {
  return (
    <svg viewBox="0 0 220 160" className={className} role="img" aria-label="Nhóm học sinh cộng tác với màn hình dữ liệu">
      <defs>
        <linearGradient id="r2-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e7490" />
          <stop offset="100%" stopColor="#0c1e42" />
        </linearGradient>
      </defs>
      {/* data screen */}
      <rect x="70" y="14" width="132" height="86" rx="10" fill="url(#r2-screen)" stroke="#38bdf8" strokeWidth="2" />
      {/* bar chart */}
      <g>
        <rect x="86" y="66" width="12" height="22" rx="2" fill="#34d399" />
        <rect x="104" y="52" width="12" height="36" rx="2" fill="#38bdf8" />
        <rect x="122" y="40" width="12" height="48" rx="2" fill="#fbbf24" />
        <rect x="140" y="58" width="12" height="30" rx="2" fill="#f472b6" />
      </g>
      {/* trend line */}
      <path d="M162 74 L172 60 L182 66 L192 44" fill="none" stroke="#7dd3fc" strokeWidth="2.5" strokeLinecap="round" />
      {/* two collaborating students */}
      <Student x={44} y={104} scale={0.82} skin="#8d5524" hair="#1f2937" shirt="#ede9fe" tie="#7c3aed" />
      <Student x={150} y={110} scale={0.78} skin="#f2c9a0" hair="#78350f" shirt="#dcfce7" tie="#059669" />
      {/* connecting collaboration arc */}
      <path d="M64 120 Q108 96 138 120" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 5" opacity="0.8" />
    </svg>
  );
}

/* ───────── Vòng chung kết: Vinh quang (glory / final) ────────────── */
export function RoundFinalIllustration({ className = "" }) {
  return (
    <svg viewBox="0 0 220 160" className={className} role="img" aria-label="Cúp vàng với vòng nguyệt quế trên nền vũ trụ số">
      <defs>
        <radialGradient id="rf-glow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rf-cup" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      {/* cosmic dust / stars */}
      {[[24, 30], [40, 96], [186, 40], [200, 110], [150, 22], [70, 20], [160, 130]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y} l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 l4 -2 z`} fill="#7dd3fc" opacity="0.8" />
      ))}
      <ellipse cx="110" cy="76" rx="86" ry="76" fill="url(#rf-glow)" />

      {/* laurel wreath */}
      <g stroke="#34d399" strokeWidth="4" fill="none" strokeLinecap="round">
        <path d="M70 118 Q40 92 52 52" />
        <path d="M150 118 Q180 92 168 52" />
      </g>
      {[[56, 60], [50, 74], [50, 90], [56, 104], [164, 60], [170, 74], [170, 90], [164, 104]].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="7" ry="4" fill="#34d399" transform={`rotate(${x < 110 ? -35 : 35} ${x} ${y})`} />
      ))}

      {/* big trophy */}
      <g transform="translate(110 70)">
        <path d="M-34 -30 Q-52 -24 -44 0 Q-38 16 -22 12" fill="none" stroke="url(#rf-cup)" strokeWidth="8" />
        <path d="M34 -30 Q52 -24 44 0 Q38 16 22 12" fill="none" stroke="url(#rf-cup)" strokeWidth="8" />
        <path d="M-32 -44 H32 L26 8 Q16 26 0 26 Q-16 26 -26 8 Z" fill="url(#rf-cup)" />
        <rect x="-9" y="26" width="18" height="18" fill="#b45309" />
        <rect x="-24" y="44" width="48" height="10" rx="4" fill="#92400e" />
        <circle cx="0" cy="-14" r="16" fill="#0b2a5b" opacity="0.85" />
        <text x="0" y="-8" textAnchor="middle" fontSize="21" fontWeight="900" fill="#fde68a" fontFamily="'Baloo 2', sans-serif">E</text>
      </g>
    </svg>
  );
}
