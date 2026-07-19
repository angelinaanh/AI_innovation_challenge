// Bảng màu / nhãn chuẩn cho 5 trục STEAM — xem docs/design/design-style.md.
// Dùng chung cho Lộ trình học và Thư viện kỹ năng mềm để hai nơi không lệch màu.
export const STEAM_META = {
  S: { label: "Khoa học", solid: "#22c55e", bg: "#dcfce7", text: "#15803d", emoji: "🔬" },
  T: { label: "Công nghệ", solid: "#3b82f6", bg: "#dbeafe", text: "#1d4ed8", emoji: "💻" },
  E: { label: "Kỹ thuật", solid: "#f97316", bg: "#ffedd5", text: "#c2410c", emoji: "⚙️" },
  A: { label: "Nghệ thuật", solid: "#a855f7", bg: "#f3e8ff", text: "#7e22ce", emoji: "🎨" },
  M: { label: "Toán học", solid: "#ef4444", bg: "#fee2e2", text: "#b91c1c", emoji: "📐" },
};

export const STEAM_AXES = ["S", "T", "E", "A", "M"];
