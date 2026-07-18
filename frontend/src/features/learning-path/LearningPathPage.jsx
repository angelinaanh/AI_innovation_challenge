import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Compass,
  Gift,
  GraduationCap,
  ListTree,
  LockKeyhole,
  PackageOpen,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Rocket,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useStudentData } from "../../app/StudentDataProvider.jsx";
import { gradeLabel } from "../../lib/academicCatalog.js";
import { api } from "../../lib/apiClient.js";
import { GRADE9_SYLLABUS } from "./grade9Syllabus.js";

// Lớp -> cấp học (khối), để lọc đúng danh mục môn theo lớp của học sinh.
function bandOfGrade(grade) {
  if (grade <= 5) return "primary";
  if (grade <= 9) return "secondary";
  return "high_school";
}

// Canonical STEAM axis palette — see docs/design/design-style.md
const STEAM_META = {
  S: { label: "Khoa học", solid: "#22c55e", bg: "#dcfce7", text: "#15803d" },
  T: { label: "Công nghệ", solid: "#3b82f6", bg: "#dbeafe", text: "#1d4ed8" },
  E: { label: "Kỹ thuật", solid: "#f97316", bg: "#ffedd5", text: "#c2410c" },
  A: { label: "Nghệ thuật", solid: "#a855f7", bg: "#f3e8ff", text: "#7e22ce" },
  M: { label: "Toán học", solid: "#ef4444", bg: "#fee2e2", text: "#b91c1c" },
};

const SUBJECT_ICONS = {
  math: "➕",
  natural_society: "🌱",
  science: "🔬",
  technology: "🛠️",
  scratch: "💻",
  arts: "🎨",
  natural_science: "🧪",
  physics: "⚛️",
  chemistry: "⚗️",
  biology: "🧬",
};

const CURRICULUM = {
  primary: [
    { key: "math", name: "Toán học", steam: ["S", "A", "M"], grades: [1, 2, 3, 4, 5] },
    { key: "natural_society", name: "Tự nhiên & Xã hội", steam: ["S", "M"], grades: [1, 2, 3] },
    { key: "science", name: "Khoa học", steam: ["S", "M"], grades: [4, 5] },
    { key: "technology", name: "Công Nghệ", steam: ["S", "E"], grades: [3, 4, 5] },
    { key: "scratch", name: "Tin học", steam: ["T", "M"], grades: [3, 4, 5] },
    { key: "arts", name: "Nghệ thuật (Mỹ thuật, Âm nhạc)", steam: ["A", "E", "M"], grades: [1, 2, 3, 4, 5] },
  ],
  secondary: [
    { key: "math", name: "Toán học", steam: ["M", "T", "E"], grades: [6, 7, 8, 9] },
    { key: "natural_science", name: "Khoa học Tự nhiên", steam: ["S", "M", "E"], grades: [6, 7, 8, 9] },
    { key: "technology", name: "Công nghệ", steam: ["E", "S", "M"], grades: [6, 7, 8, 9] },
    { key: "scratch", name: "Tin học", steam: ["T", "M", "E"], grades: [6, 7, 8, 9] },
    { key: "arts", name: "Nghệ thuật (Mỹ thuật, Âm nhạc)", steam: ["A", "T", "E"], grades: [6, 7, 8, 9] },
  ],
  high_school: [
    { key: "math", name: "Toán học", steam: ["M", "T", "E"], grades: [10, 11, 12] },
    { key: "physics", name: "Vật lí", steam: ["S", "M", "E"], grades: [10, 11, 12] },
    { key: "chemistry", name: "Hóa học", steam: ["S", "M", "E"], grades: [10, 11, 12] },
    { key: "biology", name: "Sinh học", steam: ["S", "M", "E"], grades: [10, 11, 12] },
    { key: "technology", name: "Công nghệ", steam: ["E", "T", "S", "M"], grades: [10, 11, 12] },
    { key: "scratch", name: "Tin học", steam: ["T", "M", "E"], grades: [10, 11, 12] },
    { key: "arts", name: "Nghệ thuật (Mỹ thuật, Âm nhạc)", steam: ["A", "T", "E"], grades: [10, 11, 12] },
  ],
};

const NODE_STATUS = {
  completed: { label: "Hoàn thành", icon: Check },
  current: { label: "Đang học", icon: Sparkles },
  available: { label: "Sẵn sàng", icon: Compass },
  locked: { label: "Chưa mở", icon: LockKeyhole },
};

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

function ProgressRing({ pct, size = 60, stroke = 6, color, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, pct)) / 100);
  return (
    <div className="progress-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1ede4" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset .5s ease" }}
        />
      </svg>
      <div className="progress-ring-value" style={{ fontSize: size < 70 ? 13 : 16 }}>{children}</div>
    </div>
  );
}

function SteamBadge({ axis, withLabel = false }) {
  const meta = STEAM_META[axis];
  return (
    <span className="steam-badge" style={{ background: meta.bg, color: meta.text }}>
      {axis}{withLabel ? ` · ${meta.label}` : ""}
    </span>
  );
}

function SubjectCard({ subject, pct, onClick }) {
  const axisColor = STEAM_META[subject.steam[0]].solid;
  return (
    <button type="button" className="subject-card w-full" onClick={onClick}>
      <div className="subject-card-badges">
        {subject.steam.map((axis) => <SteamBadge key={axis} axis={axis} />)}
      </div>
      <div className="subject-card-icon" aria-hidden="true">{SUBJECT_ICONS[subject.key] || "📘"}</div>
      <div className="flex items-center justify-between gap-3">
        <div className="subject-card-name" style={{ maxWidth: "60%" }}>{subject.name}</div>
        <ProgressRing pct={pct} size={60} stroke={6} color={axisColor}>{pct}%</ProgressRing>
      </div>
    </button>
  );
}

function LessonPill({ node, axisColor }) {
  const state = NODE_STATUS[node.status] || NODE_STATUS.locked;
  const Icon = state.icon;
  const canOpen = node.hasPublishedLesson && node.status !== "locked";
  const variant = node.status === "completed" ? "completed" : node.status === "locked" ? "locked" : "current";
  const ActionIcon = node.status === "completed" ? RotateCcw : ArrowRight;

  return (
    <div className={`lesson-pill lesson-pill-${variant}`} style={{ "--lesson-accent": axisColor }}>
      <div className={`lesson-pill-icon${node.status === "current" ? " lesson-pill-icon-bob" : ""}`}>
        <Icon size={19} />
      </div>
      <div className="lesson-pill-title">{node.name}</div>
      {node.hasPublishedLesson && node.status !== "locked" && (
        <span className="approved-chip">✓ Duyệt</span>
      )}
      {canOpen ? (
        <Link
          className="lesson-pill-link"
          to={`/student/lessons/${node.id}`}
          aria-label={`${node.status === "completed" ? "Học lại" : "Bắt đầu"} ${node.name}`}
        >
          <ActionIcon size={15} />
        </Link>
      ) : (
        <div className="lesson-pill-link" style={{ background: "rgba(15,23,42,0.05)", color: "#cbd5e1" }} aria-hidden="true">
          <LockKeyhole size={14} />
        </div>
      )}
    </div>
  );
}

function PracticalCard({ locked, subjectName }) {
  return (
    <div className={`practical-card${locked ? " practical-card-locked" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="practical-label">🚀 Dự án thực hành (Không bắt buộc)</div>
          <div className="practical-title">Dự án: {subjectName}</div>
        </div>
        <button type="button" className="practical-btn" disabled title="Tính năng sắp ra mắt">
          Sắp ra mắt
        </button>
      </div>
    </div>
  );
}

function ChapterBlock({ index, nodes, axisColor, subjectName }) {
  const displayStates = nodes.map((n) => (n.status === "completed" ? "completed" : n.status === "locked" ? "locked" : "active"));
  const chapterState = displayStates.every((s) => s === "completed")
    ? "completed"
    : displayStates.some((s) => s !== "locked")
      ? "active"
      : "locked";
  const nodeStyle = chapterState === "completed"
    ? { background: "#22c55e", color: "white" }
    : chapterState === "active"
      ? { background: axisColor, color: "white" }
      : { background: "#e5e7eb", color: "#9ca3af" };

  return (
    <div className="mb-9">
      <div className="mb-4 flex items-center gap-4">
        <div className="chapter-node" style={nodeStyle}>
          {chapterState === "completed" ? <Check size={24} /> : chapterState === "locked" ? <LockKeyhole size={20} /> : index + 1}
        </div>
        <div className="font-display text-xl font-bold">Chương {index + 1}</div>
      </div>
      <div className="chapter-line">
        {nodes.map((node) => <LessonPill key={node.id} node={node} axisColor={axisColor} />)}
        <PracticalCard locked={chapterState === "locked"} subjectName={subjectName} />
      </div>
    </div>
  );
}

function SubjectDetail({ entry, syllabus, grade, onBack, onStudy }) {
  const { subject, matching, pct } = entry;
  const axisColor = STEAM_META[subject.steam[0]].solid;
  const chapters = chunk(matching, 3);
  const hasPath = syllabus?.parts?.length > 0;

  return (
    <div style={{ animation: "popIn .3s ease" }}>
      <button type="button" className="subject-back-btn mb-5" onClick={onBack}>
        <ArrowLeft size={16} /> Quay lại Môn học
      </button>

      <div className="surface mb-4 flex items-center gap-5 p-6">
        <div className="text-5xl" aria-hidden="true">{SUBJECT_ICONS[subject.key] || "📘"}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="font-display text-2xl font-bold">{subject.name}</div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-black text-emerald-700">Lớp {grade}</span>
            {subject.steam.map((axis) => <SteamBadge key={axis} axis={axis} withLabel />)}
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-500">{pct}% hoàn thành · Tiếp tục cố lên!</div>
        </div>
        <ProgressRing pct={pct} size={80} stroke={8} color={axisColor}>{pct}%</ProgressRing>
      </div>

      {/* CTA chính: bắt đầu lộ trình học chi tiết của môn */}
      {hasPath && (
        <button
          type="button"
          onClick={onStudy}
          className="lp-study-cta mb-6 flex w-full items-center justify-center gap-2.5 rounded-2xl px-6 py-4 text-base font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          style={{ background: `linear-gradient(135deg, ${axisColor}, ${axisColor}cc)` }}
        >
          <Rocket size={20} /> Học ngay <ArrowRight size={18} />
        </button>
      )}

      {/* Tóm tắt — Mục tiêu — Mục lục môn học (Lớp 9) */}
      {syllabus ? (
        <div className="mb-8 space-y-4">
          {syllabus.summary && (
            <section className="surface p-5 md:p-6">
              <h2 className="flex items-center gap-2 text-sm font-black text-slate-900">
                <BookOpen size={17} style={{ color: axisColor }} /> Tóm tắt môn học
              </h2>
              <p className="mt-2.5 text-sm font-medium leading-7 text-slate-600">{syllabus.summary}</p>
            </section>
          )}

          {syllabus.objectives?.length > 0 && (
            <section className="surface p-5 md:p-6">
              <h2 className="flex items-center gap-2 text-sm font-black text-slate-900">
                <Target size={17} style={{ color: axisColor }} /> Mục tiêu môn học
              </h2>
              <div className="mt-3 space-y-3">
                {syllabus.objectives.map((objective) => (
                  <div key={objective.title} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
                    <p className="text-sm font-black text-slate-800">{objective.title}</p>
                    <p className="mt-1 text-sm font-medium leading-6 text-slate-600">{objective.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {syllabus.parts?.length > 0 && (
            <section className="surface p-5 md:p-6">
              <h2 className="flex items-center gap-2 text-sm font-black text-slate-900">
                <ListTree size={17} style={{ color: axisColor }} /> Mục lục môn học
              </h2>
              <div className="mt-3 space-y-5">
                {syllabus.parts.map((part) => (
                  <div key={part.title}>
                    <p className="text-sm font-black text-slate-800">{part.title}</p>
                    <ol className="mt-2 space-y-1.5">
                      {part.chapters.map((chapter) => (
                        <li key={chapter.id} className="flex items-start gap-2.5 text-sm font-medium leading-6 text-slate-600">
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: axisColor }}
                            aria-hidden="true"
                          />
                          <span>{chapter.title}{chapter.lessons?.length ? ` · ${chapter.lessons.length} bài` : ""}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        matching.length === 0 && (
          <div className="subject-empty">
            <PackageOpen size={20} aria-hidden="true" />
            Nội dung đang được chuẩn bị
          </div>
        )
      )}

      {/* Lộ trình bài học đã xuất bản (nếu giáo viên đã đăng bài) */}
      {matching.length > 0 && (
        <>
          <h2 className="font-display mb-4 mt-2 text-lg font-bold text-slate-900">Lộ trình bài học</h2>
          {chapters.map((chapterNodes, index) => (
            <ChapterBlock
              key={index}
              index={index}
              nodes={chapterNodes}
              axisColor={axisColor}
              subjectName={subject.name}
            />
          ))}
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------------------
// Lộ trình học chi tiết (gamification): Hero mục lớn + accordion chương/bài.
// Tiến độ lưu client-side (localStorage) để demo mở khóa tuần tự & tự chuyển mục.
// ------------------------------------------------------------------------
function loadProgress(key) {
  try { return new Set(JSON.parse(localStorage.getItem(key) || "[]")); }
  catch { return new Set(); }
}
function saveProgress(key, set) {
  try { localStorage.setItem(key, JSON.stringify([...set])); } catch { /* bỏ qua */ }
}

// Một "trạm" trên đường đi: node tròn + đường nối dọc + thẻ bài học vui mắt.
function LessonRow({ row, state, justCompleted, axisColor, isLast, onStart }) {
  const locked = state === "locked";
  const completed = state === "completed";
  const current = state === "current";
  const nodeBg = completed ? "#22c55e" : current ? axisColor : "#e5eaf1";
  return (
    <div className="relative flex gap-4 pb-3">
      {/* Cột trạm + đường nối dọc */}
      <div className="flex flex-col items-center">
        <span
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-sm transition ${justCompleted ? "lp-pop" : ""} ${current ? "lp-wiggle" : ""}`}
          style={{ background: nodeBg, color: locked ? "#94a3b8" : "#fff" }}
        >
          {completed ? <Check size={24} /> : current ? <PlayCircle size={24} /> : <LockKeyhole size={18} />}
        </span>
        {!isLast && (
          <span className="mt-1.5 w-1.5 flex-1 rounded-full" style={{ background: completed ? "#bbf7d0" : "#e9edf3" }} />
        )}
      </div>

      {/* Thẻ bài học */}
      <button
        type="button"
        disabled={locked}
        onClick={current ? onStart : undefined}
        className={`group flex flex-1 items-center gap-3 rounded-3xl border-2 p-4 text-left transition ${
          completed ? "border-emerald-100 bg-emerald-50/70"
            : current ? "border-transparent bg-white hover:-translate-y-0.5"
              : "border-dashed border-slate-200 bg-slate-50/60"
        }`}
        style={current ? { boxShadow: `0 10px 26px ${axisColor}26, 0 0 0 2px ${axisColor}` } : undefined}
      >
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-[15px] font-black ${locked ? "text-slate-400" : "text-slate-900"}`}>
            {row.lesson.title}
          </span>
          {row.lesson.subtitle && (
            <span className={`mt-0.5 block truncate text-xs font-semibold ${locked ? "text-slate-300" : "text-slate-500"}`}>
              {row.lesson.subtitle}
            </span>
          )}
        </span>
        {completed && <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-700">✓ Xong</span>}
        {current && (
          <span className="shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-black text-white shadow-sm" style={{ background: axisColor }}>
            Học ngay →
          </span>
        )}
        {locked && <LockKeyhole size={16} className="shrink-0 text-slate-300" />}
      </button>
    </div>
  );
}

// Pháo giấy ăn mừng khi hoàn thành phần Bonus.
function Confetti() {
  const colors = ["#f59e0b", "#ec4899", "#8b5cf6", "#22c55e", "#3b82f6", "#ef4444"];
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true">
      {Array.from({ length: 22 }).map((_, i) => (
        <span
          key={i}
          className="lp-confetti"
          style={{
            left: `${(i * 47) % 100}%`,
            background: colors[i % colors.length],
            animationDelay: `${(i % 7) * 0.05}s`,
            transform: `rotate(${(i * 57) % 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}

// Thẻ Bonus nổi bật cuối mỗi chương: thử thách thực hành / sáng tạo, thưởng lớn.
function BonusCard({ meta, bonus, state, justCompleted, axisColor, onStart }) {
  const completed = state === "completed";
  const available = state === "available";
  const locked = state === "locked";
  const background = completed
    ? "linear-gradient(135deg,#16a34a,#22c55e)"
    : available
      ? "linear-gradient(120deg,#f59e0b,#ec4899,#8b5cf6)"
      : "#f1f5f9";
  return (
    <button
      type="button"
      disabled={!available}
      onClick={available ? onStart : undefined}
      className={`relative w-full overflow-hidden rounded-2xl p-4 text-left transition ${available ? "hover:-translate-y-0.5 hover:shadow-xl" : ""} ${justCompleted ? "lp-pop" : ""}`}
      style={{ background, color: locked ? "#64748b" : "#fff" }}
    >
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${locked ? "bg-slate-200 text-slate-500" : "bg-white/25 text-white"}`}>
          <Star size={11} /> Bonus
        </span>
        <span className={`text-[11px] font-black ${locked ? "text-slate-500" : "text-white/90"}`}>
          {meta?.emoji} {meta?.label || "Thử thách"}
        </span>
        {!locked && !completed && <span className="lp-pulse ml-auto grid h-7 w-7 place-items-center rounded-full bg-white/25"><Gift size={15} /></span>}
      </div>
      <p className={`mt-2 text-sm font-black ${locked ? "text-slate-600" : "text-white"}`}>{bonus.title}</p>
      {bonus.subtitle && (
        <p className={`mt-0.5 text-xs font-semibold ${locked ? "text-slate-400" : "text-white/85"}`}>{bonus.subtitle}</p>
      )}
      <div className="mt-3 flex items-center gap-2">
        {completed ? (
          <span className="inline-flex items-center gap-1 rounded-lg bg-white/20 px-2.5 py-1 text-[11px] font-black"><Check size={13} /> Đã chinh phục · +{meta?.xp} XP</span>
        ) : available ? (
          <span className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1 text-[11px] font-black" style={{ color: axisColor }}><Sparkles size={13} /> Chinh phục ngay · +{meta?.xp} XP</span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-200 px-2.5 py-1 text-[11px] font-black text-slate-500"><LockKeyhole size={12} /> Hoàn thành các bài học để mở khóa</span>
        )}
      </div>
      <Star size={110} className="pointer-events-none absolute -bottom-6 -right-4 opacity-15" aria-hidden="true" />
    </button>
  );
}

function LearningPathDetail({ subject, syllabus, grade, onBack }) {
  const axisColor = STEAM_META[subject.steam[0]].solid;
  const storageKey = `eduone:lp:${grade}:${subject.key}`;
  const bonusMeta = syllabus.bonusMeta;
  const bonusXp = bonusMeta?.xp || 30;
  const [completed, setCompleted] = useState(() => loadProgress(storageKey));
  const [openChapterId, setOpenChapterId] = useState(null);
  const [justCompletedId, setJustCompletedId] = useState(null);
  const [toast, setToast] = useState(null);
  const [celebrate, setCelebrate] = useState(false); // pháo giấy khi hoàn thành bonus

  // Làm phẳng bài học theo thứ tự Mục -> Chương -> Bài (mở khóa tuần tự).
  const flat = useMemo(() => {
    const rows = [];
    syllabus.parts.forEach((part, pi) => {
      part.chapters.forEach((chapter, ci) => {
        const lessons = chapter.lessons?.length
          ? chapter.lessons
          : [{ title: "Nội dung chương", subtitle: chapter.title }];
        lessons.forEach((lesson, li) => rows.push({ id: `${chapter.id}#${li}`, pi, ci, part, chapter, lesson }));
      });
    });
    return rows;
  }, [syllabus]);

  const currentIndex = useMemo(() => {
    const idx = flat.findIndex((row) => !completed.has(row.id));
    return idx === -1 ? flat.length : idx;
  }, [flat, completed]);
  const allDone = currentIndex >= flat.length;
  const currentPartIdx = allDone ? syllabus.parts.length - 1 : flat[currentIndex].pi;
  const currentChapterId = allDone ? null : flat[currentIndex].chapter.id;

  const [viewPartIdx, setViewPartIdx] = useState(currentPartIdx);
  // Tự chuyển Hero + mở accordion sang Mục hiện tại khi Mục trước hoàn thành.
  useEffect(() => { setViewPartIdx(currentPartIdx); setOpenChapterId(null); }, [currentPartIdx]);
  // Toast tự ẩn.
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);
  // Pháo giấy tự tắt.
  useEffect(() => {
    if (!celebrate) return undefined;
    const timer = setTimeout(() => setCelebrate(false), 1500);
    return () => clearTimeout(timer);
  }, [celebrate]);
  // Đồng bộ tiến độ từ server (hợp nhất với localStorage — hoàn thành luôn cộng dồn).
  useEffect(() => {
    let alive = true;
    api.getLearningProgress(subject.key, grade)
      .then((data) => {
        if (!alive || !Array.isArray(data?.completed) || data.completed.length === 0) return;
        setCompleted((current) => {
          const merged = new Set([...current, ...data.completed]);
          saveProgress(storageKey, merged);
          return merged;
        });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [subject.key, grade, storageKey]);

  // Lưu tiến độ lên server (không chặn UI; localStorage vẫn là bản dự phòng).
  const pushServer = (set, replace = false) => {
    api.saveLearningProgress(subject.key, grade, [...set], replace).catch(() => {});
  };

  const stateOf = (row) => {
    if (completed.has(row.id)) return "completed";
    if (!allDone && row.id === flat[currentIndex].id) return "current";
    return "locked";
  };
  const chapterStateOf = (chapter) => {
    const rows = flat.filter((row) => row.chapter.id === chapter.id);
    if (rows.every((row) => completed.has(row.id))) return "completed";
    if (rows.some((row) => stateOf(row) === "current" || completed.has(row.id))) return "current";
    return "locked";
  };
  // Bonus mở khóa khi HOÀN THÀNH hết bài học của chương (phần thưởng cuối chương).
  const bonusIdOf = (chapter) => `${chapter.id}#bonus`;
  const bonusStateOf = (chapter) => {
    if (!chapter.bonus) return null;
    if (completed.has(bonusIdOf(chapter))) return "completed";
    const rows = flat.filter((row) => row.chapter.id === chapter.id);
    return rows.every((row) => completed.has(row.id)) ? "available" : "locked";
  };

  function completeBonus(chapter) {
    const id = bonusIdOf(chapter);
    const next = new Set(completed);
    next.add(id);
    saveProgress(storageKey, next);
    setCompleted(next);
    pushServer(next);
    setJustCompletedId(id);
    setTimeout(() => setJustCompletedId((cur) => (cur === id ? null : cur)), 700);
    setCelebrate(true);
    setToast({ tone: "part", msg: `${bonusMeta?.emoji || "⭐"} +${bonusXp} XP · Chinh phục Bonus "${bonusMeta?.label || "Thử thách"}"!` });
  }

  function completeLesson(row) {
    const next = new Set(completed);
    next.add(row.id);
    saveProgress(storageKey, next);
    setCompleted(next);
    setJustCompletedId(row.id);
    setTimeout(() => setJustCompletedId((cur) => (cur === row.id ? null : cur)), 700);
    pushServer(next);
    const partDone = flat.filter((r) => r.pi === row.pi).every((r) => next.has(r.id));
    if (partDone && row.pi < syllabus.parts.length - 1) {
      setToast({ tone: "part", msg: `🏆 Hoàn thành ${row.part.title.split(":")[0]} — mở khóa mục tiếp theo!` });
    } else if (partDone) {
      setToast({ tone: "part", msg: "🏆 Hoàn thành toàn bộ môn học. Xuất sắc!" });
    } else {
      setToast({ tone: "xp", msg: "🎉 +10 XP · Hoàn thành bài học" });
    }
  }

  function resetProgress() {
    const empty = new Set();
    saveProgress(storageKey, empty);
    setCompleted(empty);
    pushServer(empty, true); // replace = xoá hẳn trên server
    setToast({ tone: "xp", msg: "Đã đặt lại tiến độ" });
  }

  const viewedPart = syllabus.parts[viewPartIdx];
  const partRows = flat.filter((row) => row.pi === viewPartIdx);
  const partDoneCount = partRows.filter((row) => completed.has(row.id)).length;
  const partPct = partRows.length ? Math.round((partDoneCount / partRows.length) * 100) : 0;
  // Bài học +10 XP, Bonus +bonusXp XP.
  const xp = [...completed].reduce((sum, id) => sum + (id.endsWith("#bonus") ? bonusXp : 10), 0);
  const effectiveOpen = openChapterId ?? (viewPartIdx === currentPartIdx ? currentChapterId : viewedPart.chapters[0]?.id);

  return (
    <div style={{ animation: "popIn .3s ease" }}>
      <style>{`
        @keyframes lpPop { 0%{transform:scale(1)} 40%{transform:scale(1.35)} 100%{transform:scale(1)} }
        .lp-pop { animation: lpPop .5s ease; }
        @keyframes lpPulse { 0%,100%{box-shadow:0 0 0 0 rgba(0,0,0,0)} 50%{box-shadow:0 0 0 6px rgba(148,163,184,.18)} }
        .lp-pulse { animation: lpPulse 1.8s ease-in-out infinite; }
        @keyframes lpToast { 0%{opacity:0;transform:translateY(12px) scale(.96)} 12%,80%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:translateY(-6px)} }
        .lp-toast { animation: lpToast 2s ease forwards; }
        @keyframes lpConfetti { 0%{transform:translateY(-10vh) rotate(0);opacity:1} 100%{transform:translateY(105vh) rotate(540deg);opacity:.9} }
        .lp-confetti { position:absolute; top:0; width:9px; height:14px; border-radius:2px; animation: lpConfetti 1.4s cubic-bezier(.3,.7,.5,1) forwards; }
        @keyframes lpWiggle { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-7deg)} 75%{transform:rotate(7deg)} }
        .lp-wiggle { animation: lpWiggle 1.6s ease-in-out infinite; }
        @keyframes lpFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
        .lp-float { animation: lpFloat 4.5s ease-in-out infinite; }
        @keyframes lpFloat2 { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(10px) rotate(8deg)} }
        .lp-float2 { animation: lpFloat2 5.5s ease-in-out infinite; }
      `}</style>
      {celebrate && <Confetti />}

      <button type="button" className="subject-back-btn mb-5" onClick={onBack}>
        <ArrowLeft size={16} /> Quay lại
      </button>

      {/* Thanh trạng thái: môn + XP + đặt lại */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-3xl" aria-hidden="true">{SUBJECT_ICONS[subject.key] || "📘"}</span>
          <div>
            <div className="font-display text-xl font-bold text-slate-950">{subject.name}</div>
            <div className="text-xs font-black text-slate-500">Lớp {grade} · Lộ trình học</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-black text-amber-700">
            <Zap size={15} /> {xp} XP
          </span>
          <button type="button" className="icon-button inline-grid" title="Đặt lại tiến độ" aria-label="Đặt lại tiến độ" onClick={resetProgress}>
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Chọn Mục lớn (I / II ...) — tự nhảy theo tiến độ, vẫn cho ôn lại mục cũ */}
      {syllabus.parts.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {syllabus.parts.map((part, index) => {
            const done = flat.filter((r) => r.pi === index).every((r) => completed.has(r.id));
            const active = index === viewPartIdx;
            return (
              <button
                key={part.id}
                type="button"
                onClick={() => { setViewPartIdx(index); setOpenChapterId(null); }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black transition ${
                  active ? "text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
                style={active ? { background: axisColor } : undefined}
              >
                {done && <Check size={13} />}
                {part.title.split(":")[0]}
              </button>
            );
          })}
        </div>
      )}

      {/* Hero Card — Mục lớn đang học */}
      <div
        className="relative mb-7 overflow-hidden rounded-[36px] p-6 text-white shadow-xl sm:p-8"
        style={{ background: `linear-gradient(135deg, ${axisColor}, ${axisColor}cc 55%, ${axisColor}99)` }}
      >
        {/* Bong bóng trang trí bay lơ lửng */}
        <span className="lp-float pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" aria-hidden="true" />
        <span className="lp-float2 pointer-events-none absolute right-16 top-6 h-14 w-14 rounded-full bg-white/10" aria-hidden="true" />
        <span className="lp-float pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10" aria-hidden="true" />

        <div className="relative flex items-start gap-4">
          {/* Mascot môn học */}
          <div className="lp-float grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-white/20 text-4xl shadow-inner backdrop-blur-sm sm:h-20 sm:w-20 sm:text-5xl" aria-hidden="true">
            {SUBJECT_ICONS[subject.key] || "📘"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide">
              {viewPartIdx === currentPartIdx ? <><Sparkles size={13} /> Mục lớn đang học</> : <><BookOpen size={13} /> Ôn tập mục đã học</>}
            </div>
            <h2 className="font-display mt-2 text-2xl font-bold leading-tight sm:text-[28px]">{viewedPart.title}</h2>
            <p className="mt-1 text-sm font-bold text-white/80">Cùng chinh phục từng trạm nhé! 🚀</p>
          </div>
        </div>

        <div className="relative mt-5 flex items-center gap-3">
          <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-white/25 shadow-inner">
            <div
              className="flex h-full items-center justify-end rounded-full bg-white pr-2 text-[10px] font-black transition-all duration-500"
              style={{ width: `${Math.max(partPct, 8)}%`, color: axisColor }}
            >
              {partPct > 0 ? `${partPct}%` : ""}
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-sm font-black">{partDoneCount}/{partRows.length} bài</span>
        </div>
        {allDone && (
          <div className="relative mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/25 px-3.5 py-1.5 text-xs font-black">
            <Trophy size={15} /> Tuyệt vời! Đã hoàn thành toàn bộ môn học 🎉
          </div>
        )}
      </div>

      {/* Course Body — accordion Chương thuộc Mục lớn */}
      <div className="space-y-4">
        {viewedPart.chapters.map((chapter, index) => {
          const cState = chapterStateOf(chapter);
          const bState = bonusStateOf(chapter);
          const open = effectiveOpen === chapter.id;
          const rows = flat.filter((row) => row.chapter.id === chapter.id);
          const doneCount = rows.filter((row) => completed.has(row.id)).length;
          const nodeStyle = cState === "completed"
            ? { background: "#22c55e", color: "#fff" }
            : cState === "current"
              ? { background: axisColor, color: "#fff" }
              : { background: "#e5e7eb", color: "#9ca3af" };
          return (
            <div
              key={chapter.id}
              className="surface overflow-hidden rounded-3xl transition"
              style={open ? { boxShadow: `0 10px 30px ${axisColor}14` } : undefined}
            >
              <button
                type="button"
                className="flex w-full items-center gap-3.5 px-5 py-4 text-left transition hover:bg-slate-50/70"
                onClick={() => setOpenChapterId(open ? "__none__" : chapter.id)}
                aria-expanded={open}
              >
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-base font-black shadow-sm ${cState === "current" ? "lp-wiggle" : ""}`} style={nodeStyle}>
                  {cState === "completed" ? <Check size={20} /> : cState === "locked" ? <LockKeyhole size={17} /> : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-black text-slate-900">{chapter.title}</span>
                  <span className="block text-xs font-bold text-slate-400">{doneCount}/{rows.length} bài học</span>
                </span>
                {bState && (
                  <span
                    className={`hidden shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black sm:inline-flex ${
                      bState === "completed" ? "bg-emerald-100 text-emerald-700"
                        : bState === "available" ? "lp-pulse bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-400"
                    }`}
                    title="Phần thưởng Bonus"
                  >
                    {bState === "completed" ? <Check size={11} /> : <Star size={11} />} Bonus
                  </span>
                )}
                {open ? <ChevronDown size={18} className="shrink-0 text-slate-400" /> : <ChevronRight size={18} className="shrink-0 text-slate-400" />}
              </button>
              {open && (
                <div className="border-t border-slate-100 p-4">
                  {rows.map((row, rowIndex) => (
                    <LessonRow
                      key={row.id}
                      row={row}
                      state={stateOf(row)}
                      justCompleted={justCompletedId === row.id}
                      axisColor={axisColor}
                      isLast={rowIndex === rows.length - 1}
                      onStart={() => completeLesson(row)}
                    />
                  ))}
                  {chapter.bonus && (
                    <BonusCard
                      meta={bonusMeta}
                      bonus={chapter.bonus}
                      state={bonusStateOf(chapter)}
                      justCompleted={justCompletedId === bonusIdOf(chapter)}
                      axisColor={axisColor}
                      onStart={() => completeBonus(chapter)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Toast phần thưởng */}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className={`lp-toast rounded-full px-5 py-2.5 text-sm font-black text-white shadow-xl ${toast.tone === "part" ? "bg-amber-500" : "bg-slate-900"}`}>
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}

function ClassCard({ cls }) {
  // Ưu tiên danh sách nhiều môn (class_subjects); `subject` chỉ là môn đầu tiên
  // và tồn tại để tương thích ngược.
  const subjects = cls.subjects?.length ? cls.subjects : cls.subject ? [cls.subject] : [];
  return (
    <div className="class-card !items-start">
      <div className="class-card-icon">
        <Users size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="class-card-name">{cls.name}</span>
          {cls.gradeLevel && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-600">
              {gradeLabel(cls.gradeLevel)}
            </span>
          )}
        </div>
        {cls.teacher?.full_name && (
          <div className="class-card-sub">GV: {cls.teacher.full_name}</div>
        )}
        {subjects.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {subjects.map((subject) => {
              const meta = STEAM_META[subject.steam_axis];
              return (
                <span
                  key={subject.id}
                  className="rounded-md px-2 py-0.5 text-[11px] font-black"
                  style={meta ? { background: meta.bg, color: meta.text } : undefined}
                >
                  {subject.name}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Khối "Lớp học của tôi" đặt ngay đầu trang: học sinh cần thấy mình đang ở lớp
 * nào trước khi duyệt lộ trình theo khối (Tiểu học / THCS / THPT), vì hai khái
 * niệm này khác nhau và dễ nhầm.
 */
function MyClassesPanel({ classes, gradeLevel }) {
  return (
    <section className="surface p-5 md:p-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <GraduationCap size={17} className="text-emerald-600" aria-hidden="true" />
        <h2 className="text-sm font-black text-slate-900">Lớp học của tôi</h2>
        {gradeLevel && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-black text-emerald-700">
            {gradeLabel(gradeLevel)}
          </span>
        )}
        {classes.length > 0 && <span className="count-badge">{classes.length}</span>}
      </div>

      {classes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center">
          <p className="text-sm font-bold text-slate-600">Bạn chưa tham gia lớp nào.</p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Vào lớp để nhận bài giảng giáo viên biên soạn cho lớp bạn.
          </p>
          <Link to="/student/classes" className="secondary-button mt-3 inline-flex">
            Tham gia lớp <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            {classes.map((cls) => <ClassCard key={cls.id} cls={cls} />)}
          </div>
          <Link
            to="/student/ai-lessons"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-black text-emerald-700 hover:text-emerald-900"
          >
            Xem bài giảng của lớp <ArrowRight size={16} />
          </Link>
        </>
      )}
    </section>
  );
}

export function LearningPathPage() {
  const { dashboard } = useStudentData();
  const [path, setPath] = useState(null);
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [studying, setStudying] = useState(false); // đang ở trang lộ trình chi tiết?
  const [syllabusCache, setSyllabusCache] = useState({}); // syllabus lấy từ backend theo subjectKey

  const loadAll = useCallback((signal) => {
    setError(null);
    Promise.all([
      api.getPath(signal).then(setPath),
      api.getStudentClasses(signal).then(setClasses).catch(() => {}),
    ]).catch((e) => {
      if (e.name !== "AbortError") setError(e.message);
    });
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    document.documentElement.scrollTop = 0;
    loadAll(ctrl.signal);
    const onPublish = () => loadAll();
    window.addEventListener("eduone:content-published", onPublish);
    return () => {
      ctrl.abort();
      window.removeEventListener("eduone:content-published", onPublish);
    };
  }, [loadAll]);

  // DEMO: cố định Lớp 9 cho mọi tài khoản để trình diễn lộ trình lớp 9.
  // Khi chạy thật, đổi lại thành: Number(dashboard?.student?.gradeLevel) || 9
  const studentGrade = 9;
  const band = bandOfGrade(studentGrade);
  const allNodes = path?.nodes ?? [];
  // Chỉ hiện môn học đúng lớp của học sinh (VD lớp 9 -> các môn có grade 9).
  const subjects = (CURRICULUM[band] ?? []).filter((subject) => subject.grades.includes(studentGrade));

  const subjectsWithProgress = subjects.map((subject) => {
    const matching = allNodes.filter((n) => n.subject === subject.key);
    const completed = matching.filter((n) => n.status === "completed").length;
    const total = matching.length;
    return { subject, matching, pct: total ? Math.round((completed / total) * 100) : 0 };
  });

  const overallPct = subjectsWithProgress.length
    ? Math.round(subjectsWithProgress.reduce((sum, s) => sum + s.pct, 0) / subjectsWithProgress.length)
    : 0;

  const selected = subjectsWithProgress.find((s) => s.subject.key === selectedKey) || null;

  // Nội dung lộ trình lấy từ backend (DB); fallback dữ liệu bundled nếu lỗi/chưa seed.
  useEffect(() => {
    if (!selectedKey || syllabusCache[selectedKey]) return undefined;
    let alive = true;
    api.getLearningPath(selectedKey, studentGrade)
      .then((data) => {
        if (alive && data?.syllabus) setSyllabusCache((cache) => ({ ...cache, [selectedKey]: data.syllabus }));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [selectedKey, studentGrade, syllabusCache]);

  const resolvedSyllabus = selectedKey
    ? (syllabusCache[selectedKey] || GRADE9_SYLLABUS[selectedKey] || null)
    : null;

  if (error) {
    return (
      <div className="surface p-7 text-center">
        <RefreshCw className="mx-auto mb-3 text-rose-500" />
        <p className="font-bold text-slate-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/student"
            className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-500 hover:text-slate-950"
          >
            <ArrowLeft size={16} /> Tổng quan
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-slate-950 md:text-3xl">Lộ trình học</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white">
              <GraduationCap size={14} /> Lớp {studentGrade}
            </span>
          </div>
        </div>
        {path && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-center">
            <div className="text-[10px] font-extrabold uppercase text-emerald-700">Tiến độ</div>
            <div className="text-xl font-black text-emerald-950">
              {path.completedCount}/{path.totalCount} node
            </div>
          </div>
        )}
      </div>

      {!selected && (
        <MyClassesPanel classes={classes} gradeLevel={studentGrade} />
      )}

      {!path ? (
        <div className="space-y-4">
          <div className="skeleton h-12 w-72 rounded-full" />
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton h-40 rounded-[24px]" />)}
          </div>
        </div>
      ) : selected && studying ? (
        <LearningPathDetail
          subject={selected.subject}
          syllabus={resolvedSyllabus}
          grade={studentGrade}
          onBack={() => setStudying(false)}
        />
      ) : selected ? (
        <SubjectDetail
          entry={selected}
          syllabus={resolvedSyllabus}
          grade={studentGrade}
          onBack={() => { setSelectedKey(null); setStudying(false); }}
          onStudy={() => setStudying(true)}
        />
      ) : (
        <div style={{ animation: "popIn .35s ease" }}>
          <p className="mb-3 text-sm font-black text-slate-700">
            Các môn học lớp {studentGrade}
          </p>

          {/* Overall progress */}
          <div className="surface mb-7 p-5 md:p-6">
            <div className="mb-2.5 flex items-center justify-between">
              <div className="font-display text-base font-bold">Tiến độ tổng quan</div>
              <div className="text-base font-black text-rose-500">{overallPct}%</div>
            </div>
            <div className="overall-progress-bar">
              <div className="overall-progress-fill" style={{ width: `${overallPct}%` }} />
            </div>
          </div>

          {/* Subject grid */}
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))" }}>
            {subjectsWithProgress.map(({ subject, pct }) => (
              <SubjectCard
                key={subject.key}
                subject={subject}
                pct={pct}
                onClick={() => { setSelectedKey(subject.key); setStudying(false); }}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
