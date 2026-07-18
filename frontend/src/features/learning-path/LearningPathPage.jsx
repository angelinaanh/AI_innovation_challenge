import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  GraduationCap,
  LockKeyhole,
  PackageOpen,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useStudentData } from "../../app/StudentDataProvider.jsx";
import { gradeLabel } from "../../lib/academicCatalog.js";
import { api } from "../../lib/apiClient.js";

const GRADE_BANDS = [
  { key: "primary", label: "Tiểu học", grades: "Lớp 1–5" },
  { key: "secondary", label: "THCS", grades: "Lớp 6–9" },
  { key: "high_school", label: "THPT", grades: "Lớp 10–12" },
];

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

function SubjectDetail({ entry, onBack }) {
  const { subject, matching, pct } = entry;
  const axisColor = STEAM_META[subject.steam[0]].solid;
  const chapters = chunk(matching, 3);

  return (
    <div style={{ animation: "popIn .3s ease" }}>
      <button type="button" className="subject-back-btn mb-5" onClick={onBack}>
        <ArrowLeft size={16} /> Quay lại Môn học
      </button>

      <div className="surface mb-9 flex items-center gap-5 p-6">
        <div className="text-5xl" aria-hidden="true">{SUBJECT_ICONS[subject.key] || "📘"}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="font-display text-2xl font-bold">{subject.name}</div>
            {subject.steam.map((axis) => <SteamBadge key={axis} axis={axis} withLabel />)}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {subject.grades.map((g) => <span key={g} className="grade-tag">Lớp {g}</span>)}
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-500">{pct}% hoàn thành · Tiếp tục cố lên!</div>
        </div>
        <ProgressRing pct={pct} size={80} stroke={8} color={axisColor}>{pct}%</ProgressRing>
      </div>

      {matching.length === 0 ? (
        <div className="subject-empty">
          <PackageOpen size={20} aria-hidden="true" />
          Nội dung đang được chuẩn bị
        </div>
      ) : (
        chapters.map((chapterNodes, index) => (
          <ChapterBlock
            key={index}
            index={index}
            nodes={chapterNodes}
            axisColor={axisColor}
            subjectName={subject.name}
          />
        ))
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
  const [activeBand, setActiveBand] = useState("primary");
  const [selectedKey, setSelectedKey] = useState(null);
  const [bounceTab, setBounceTab] = useState(null);

  useEffect(() => {
    if (dashboard?.student?.gradeBand) {
      setActiveBand(dashboard.student.gradeBand);
    }
  }, [dashboard]);

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

  const studentBand = dashboard?.student?.gradeBand ?? "primary";
  const allNodes = path?.nodes ?? [];
  const subjects = CURRICULUM[activeBand] ?? [];

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

  const handleBandChange = (key) => {
    setActiveBand(key);
    setSelectedKey(null);
    setBounceTab(key);
    setTimeout(() => setBounceTab(null), 400);
  };

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
          <h1 className="font-display mt-1.5 text-2xl font-bold text-slate-950 md:text-3xl">Lộ trình học</h1>
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
        <MyClassesPanel classes={classes} gradeLevel={dashboard?.student?.gradeLevel} />
      )}

      {!path ? (
        <div className="space-y-4">
          <div className="skeleton h-12 w-72 rounded-full" />
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))" }}>
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton h-40 rounded-[24px]" />)}
          </div>
        </div>
      ) : selected ? (
        <SubjectDetail entry={selected} onBack={() => setSelectedKey(null)} />
      ) : (
        <div style={{ animation: "popIn .35s ease" }}>
          {/* Grade band tabs — "khối" khác với "lớp" ở panel phía trên: khối là
              cấp học (Tiểu học/THCS/THPT), lớp là lớp cụ thể của học sinh. */}
          <p className="mb-2 text-xs font-bold text-slate-500">
            Lộ trình theo cấp học — chấm xanh là cấp bạn đang theo
          </p>
          <div className="tab-pill-row mb-6">
            {GRADE_BANDS.map((band) => (
              <button
                key={band.key}
                type="button"
                onClick={() => handleBandChange(band.key)}
                className={`tab-pill${activeBand === band.key ? " tab-pill-active" : ""}${bounceTab === band.key ? " tab-pill-bounce" : ""}`}
                aria-pressed={activeBand === band.key}
              >
                {band.key === studentBand && (
                  <span className="tab-pill-you-dot" aria-label="Cấp hiện tại" />
                )}
                <span>{band.label}</span>
                <span className="tab-pill-range">{band.grades}</span>
              </button>
            ))}
          </div>

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
                onClick={() => setSelectedKey(subject.key)}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
