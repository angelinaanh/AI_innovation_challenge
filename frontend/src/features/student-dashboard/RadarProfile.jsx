import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

const AXES = [
  { key: "S", label: "Khoa học" },
  { key: "T", label: "Công nghệ" },
  { key: "E", label: "Kỹ thuật" },
  { key: "A", label: "Nghệ thuật" },
  { key: "M", label: "Toán học" },
];

export function RadarProfile({ profile }) {
  const data = AXES.map((axis) => ({
    ...axis,
    score: Number(profile?.[axis.key] || 0),
  }));

  return (
    <section className="surface min-h-[390px] p-5 md:p-6" aria-labelledby="steam-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Hồ sơ năng lực</p>
          <h2 id="steam-title" className="section-title">La bàn STEAM của bạn</h2>
          <p className="mt-1 text-sm text-slate-500">Cập nhật từ bài kiểm tra và hoạt động học.</p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Điểm STEAM">
          {data.map((axis) => (
            <span key={axis.key} className="score-chip">
              {axis.key} · {axis.score}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-2 h-[285px] w-full" aria-label="Biểu đồ radar năng lực STEAM">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="69%">
            <PolarGrid stroke="#cbd5e1" />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fill: "#334155", fontSize: 12, fontWeight: 800 }}
            />
            <Radar
              name="Điểm"
              dataKey="score"
              stroke="#7c3aed"
              fill="#8b5cf6"
              fillOpacity={0.34}
              strokeWidth={3}
              dot={{ fill: "#7c3aed", r: 3 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
