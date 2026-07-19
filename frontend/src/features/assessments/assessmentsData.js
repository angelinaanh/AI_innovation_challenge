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

export const ASSESSMENTS = {
  weekly: [
    {
      id: "w-2025-07-15",
      title: "Kiểm tra tuần — Đại số & Quan sát khoa học",
      periodLabel: "Tuần này · 15–21/07",
      status: "completed",
      skills: { S: 78, T: 65, E: 70, A: 82, M: 52 },
    },
    {
      id: "w-2025-07-08",
      title: "Kiểm tra tuần — Hình học & Kỹ thuật",
      periodLabel: "Tuần trước · 08–14/07",
      status: "completed",
      skills: { S: 66, T: 58, E: 54, A: 74, M: 63 },
    },
    {
      id: "w-2025-07-22",
      title: "Kiểm tra tuần — Hàm số & Ứng dụng",
      periodLabel: "Tuần tới · 22–28/07",
      status: "upcoming",
      skills: null,
    },
  ],
  monthly: [
    {
      id: "m-2025-07",
      title: "Kiểm tra tháng — Tổng hợp STEAM tháng 7",
      periodLabel: "Tháng 7/2025",
      status: "completed",
      skills: { S: 75, T: 59, E: 68, A: 72, M: 63 },
    },
    {
      id: "m-2025-06",
      title: "Kiểm tra tháng — Tổng hợp STEAM tháng 6",
      periodLabel: "Tháng 6/2025",
      status: "completed",
      skills: { S: 70, T: 64, E: 62, A: 69, M: 57 },
    },
  ],
};

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
