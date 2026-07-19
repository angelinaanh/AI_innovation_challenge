/**
 * Dữ liệu mẫu cho trang "Kiểm tra & Đánh giá".
 * Mỗi bài kiểm tra chấm điểm theo 5 trục STEAM; trục nào dưới ngưỡng WEAK_THRESHOLD
 * được coi là kỹ năng yếu và hệ thống gợi ý bài học bổ trợ tương ứng (REMEDIAL_BY_AXIS).
 *
 * Đây là dữ liệu demo phía client (giống lộ trình học). Khi có hệ thống chấm bài
 * thật, thay ASSESSMENTS bằng dữ liệu từ API là dùng lại được toàn bộ giao diện.
 */
export const STEAM_AXES = {
  S: { label: "Khoa học", color: "#22c55e", emoji: "🔬" },
  T: { label: "Công nghệ", color: "#3b82f6", emoji: "💻" },
  E: { label: "Kỹ thuật", color: "#f97316", emoji: "🛠️" },
  A: { label: "Nghệ thuật", color: "#a855f7", emoji: "🎨" },
  M: { label: "Toán học", color: "#ef4444", emoji: "➗" },
};
export const STEAM_ORDER = ["S", "T", "E", "A", "M"];

// Dưới ngưỡng này coi là kỹ năng yếu -> hiện bài học bổ trợ.
export const WEAK_THRESHOLD = 60;

// Bài học bổ trợ gợi ý theo trục STEAM còn yếu. `to` trỏ về Lộ trình học của môn.
export const REMEDIAL_BY_AXIS = {
  M: {
    title: "Ôn tập nền tảng: Biến đổi & rút gọn biểu thức",
    detail: "Luyện lại căn thức, hằng đẳng thức và các bước rút gọn thường sai.",
    subject: "Toán học",
    to: "/student/path",
  },
  S: {
    title: "Bổ trợ: Phương pháp thực nghiệm & suy luận khoa học",
    detail: "Cách đặt giả thuyết, làm thí nghiệm và rút ra kết luận có căn cứ.",
    subject: "Khoa học Tự nhiên",
    to: "/student/path",
  },
  T: {
    title: "Bổ trợ: Tư duy thuật toán cơ bản",
    detail: "Sơ đồ khối, cấu trúc rẽ nhánh – lặp và cách chia nhỏ bài toán.",
    subject: "Tin học",
    to: "/student/path",
  },
  E: {
    title: "Bổ trợ: Quy trình thiết kế kỹ thuật (Design Process)",
    detail: "Xác định vấn đề → lên ý tưởng → dựng mẫu → thử nghiệm → cải tiến.",
    subject: "Công nghệ",
    to: "/student/path",
  },
  A: {
    title: "Bổ trợ: Bố cục, màu sắc & tư duy thẩm mỹ",
    detail: "Nguyên tắc bố cục cân đối và phối màu khi thể hiện sản phẩm.",
    subject: "Nghệ thuật",
    to: "/student/path",
  },
};

// ---------------------------------------------------------------------------
// Lịch kiểm tra — sinh theo ngày hiện tại để dữ liệu demo không bị cũ đi.
// Bài kiểm tra TUẦN mở suốt tuần hiện tại (T2 → hết CN).
// Bài kiểm tra THÁNG mở từ ngày 15 đến hết tháng.
// ---------------------------------------------------------------------------
const MONTHLY_OPEN_DAY = 15;

function atMidnight(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
/** Thứ Hai của tuần chứa `date` (tuần bắt đầu từ T2, theo lịch học VN). */
function startOfWeek(date) {
  const d = atMidnight(date);
  const weekday = (d.getDay() + 6) % 7; // CN(0) -> 6
  return addDays(d, -weekday);
}
/** Cuối ngày Chủ nhật của tuần chứa `date` — hạn nộp bài tuần. */
function endOfWeek(date) {
  const d = addDays(startOfWeek(date), 6);
  d.setHours(23, 59, 59, 999);
  return d;
}
function endOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}
function dm(date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}
function isoWeekId(monday) {
  return `w-${monday.getFullYear()}-${dm(monday).replace("/", "-")}`;
}

const NOW = new Date();
const THIS_MONDAY = startOfWeek(NOW);

/** Nhãn khoảng thời gian của tuần bắt đầu từ `monday`. */
function weekLabel(monday, offset) {
  const prefix = offset === 0 ? "Tuần này" : offset === -1 ? "Tuần trước" : `${-offset} tuần trước`;
  return `${prefix} · ${dm(monday)}–${dm(addDays(monday, 6))}`;
}

// Điểm mẫu của các tuần đã làm, gần nhất xếp trước.
const PAST_WEEK_SKILLS = [
  { title: "Đại số & Quan sát khoa học", skills: { S: 78, T: 65, E: 70, A: 82, M: 52 } },
  { title: "Hình học & Kỹ thuật", skills: { S: 66, T: 58, E: 54, A: 74, M: 63 } },
  { title: "Hàm số & Tư duy thuật toán", skills: { S: 71, T: 62, E: 66, A: 70, M: 58 } },
  { title: "Thống kê & Thiết kế sản phẩm", skills: { S: 64, T: 55, E: 61, A: 68, M: 60 } },
];

const PAST_MONTH_SKILLS = [
  { S: 75, T: 59, E: 68, A: 72, M: 63 },
  { S: 70, T: 64, E: 62, A: 69, M: 57 },
  { S: 68, T: 60, E: 59, A: 66, M: 55 },
];

function buildWeekly() {
  // Tuần hiện tại: chưa làm, đang trong hạn -> hiện nút "Vào làm bài ngay".
  const current = {
    id: isoWeekId(THIS_MONDAY),
    title: "Kiểm tra tuần — Tổng hợp kiến thức tuần này",
    periodLabel: weekLabel(THIS_MONDAY, 0),
    status: "upcoming",
    skills: null,
    openAt: THIS_MONDAY.toISOString(),
    dueAt: endOfWeek(NOW).toISOString(),
  };
  const past = PAST_WEEK_SKILLS.map((entry, index) => {
    const monday = addDays(THIS_MONDAY, -7 * (index + 1));
    return {
      id: isoWeekId(monday),
      title: `Kiểm tra tuần — ${entry.title}`,
      periodLabel: weekLabel(monday, -(index + 1)),
      status: "completed",
      skills: entry.skills,
      completedAt: addDays(monday, 6).toISOString(),
    };
  });
  return [current, ...past];
}

function buildMonthly() {
  const monthLabel = (date) => `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
  const monthId = (date) => `m-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const opensAt = new Date(NOW.getFullYear(), NOW.getMonth(), MONTHLY_OPEN_DAY);

  const current = {
    id: monthId(NOW),
    title: `Kiểm tra tháng — Tổng hợp STEAM ${monthLabel(NOW).toLowerCase()}`,
    periodLabel: monthLabel(NOW),
    status: "upcoming",
    skills: null,
    openAt: opensAt.toISOString(),
    dueAt: endOfMonth(NOW).toISOString(),
  };
  const past = PAST_MONTH_SKILLS.map((skills, index) => {
    const month = new Date(NOW.getFullYear(), NOW.getMonth() - (index + 1), 1);
    return {
      id: monthId(month),
      title: `Kiểm tra tháng — Tổng hợp STEAM ${monthLabel(month).toLowerCase()}`,
      periodLabel: monthLabel(month),
      status: "completed",
      skills,
      completedAt: endOfMonth(month).toISOString(),
    };
  });
  return [current, ...past];
}

export const ASSESSMENTS = {
  weekly: buildWeekly(),
  monthly: buildMonthly(),
};

export const PERIOD_LABELS = {
  weekly: { noun: "tuần", label: "Bài kiểm tra tuần", icon: "🗓️" },
  monthly: { noun: "tháng", label: "Bài kiểm tra tháng", icon: "📋" },
};

/** Bài đang trong hạn làm: chưa có điểm và thời điểm hiện tại nằm giữa openAt - dueAt. */
export function isDue(assessment, now = new Date()) {
  if (!assessment || assessment.status !== "upcoming" || !assessment.openAt) return false;
  const opens = new Date(assessment.openAt);
  const due = new Date(assessment.dueAt);
  return now >= opens && now <= due;
}

/** Số ngày còn lại tới hạn (0 = hết hôm nay). */
export function daysLeft(assessment, now = new Date()) {
  if (!assessment?.dueAt) return null;
  const diff = atMidnight(new Date(assessment.dueAt)) - atMidnight(now);
  return Math.max(0, Math.round(diff / 86400000));
}

/**
 * Các bài đến hạn làm ngay, kèm loại kỳ (weekly/monthly) — dùng cho nút nhắc
 * ở đầu trang Kiểm tra & Đánh giá và ở trang Tổng quan.
 */
export function dueAssessments(now = new Date()) {
  return ["weekly", "monthly"]
    .map((period) => ({ period, assessment: ASSESSMENTS[period].find((item) => isDue(item, now)) }))
    .filter((entry) => entry.assessment)
    .map((entry) => ({ ...entry, ...PERIOD_LABELS[entry.period], daysLeft: daysLeft(entry.assessment, now) }));
}

/** Lịch sử điểm: mọi bài đã có điểm của cả hai kỳ, mới nhất xếp trước. */
export function scoreHistory() {
  return ["weekly", "monthly"]
    .flatMap((period) => ASSESSMENTS[period]
      .filter((item) => item.skills)
      .map((item) => ({ ...item, period })))
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
}

/** Điểm trung bình của một bài (0 nếu chưa có điểm). */
export function overallScore(assessment) {
  if (!assessment.skills) return 0;
  const values = STEAM_ORDER.map((axis) => assessment.skills[axis] ?? 0);
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

/** Các trục STEAM dưới ngưỡng -> kỹ năng yếu cần bổ trợ. */
export function weakAxes(assessment) {
  if (!assessment.skills) return [];
  return STEAM_ORDER.filter((axis) => (assessment.skills[axis] ?? 100) < WEAK_THRESHOLD);
}

/** Trung bình từng trục qua các bài đã hoàn thành (cho tổng quan năng lực). */
export function averageByAxis(assessments) {
  const done = assessments.filter((item) => item.skills);
  return STEAM_ORDER.reduce((acc, axis) => {
    if (done.length === 0) { acc[axis] = 0; return acc; }
    const sum = done.reduce((total, item) => total + (item.skills[axis] ?? 0), 0);
    acc[axis] = Math.round(sum / done.length);
    return acc;
  }, {});
}
