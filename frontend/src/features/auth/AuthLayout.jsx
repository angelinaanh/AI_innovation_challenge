import { BookOpen, Check, Code2, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { Brand } from "../../components/ui/Brand.jsx";

const pathItems = [
  { label: "Làm quen Scratch", state: "Hoàn thành", complete: true },
  { label: "Sự kiện & chuyển động", state: "Hoàn thành", complete: true },
  { label: "Vòng lặp kỳ diệu", state: "Học tiếp", complete: false },
];

export function AuthLayout({ eyebrow, title, description, children }) {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,0.92fr)_minmax(480px,1.08fr)]">
      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-14 xl:px-20">
        <Link to="/" className="w-fit" aria-label="Về trang EduOne">
          <Brand />
        </Link>

        <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center py-10">
          <p className="text-xs font-black uppercase text-emerald-700">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-[38px]">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-md text-sm font-medium leading-6 text-slate-600">
              {description}
            </p>
          )}
          <div className="mt-8">{children}</div>
        </div>

        <p className="text-xs font-semibold text-slate-400">
          EduOne · STEAM for Vietnam
        </p>
      </section>

      <aside className="relative hidden min-h-screen overflow-hidden bg-[#0d5f57] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-16" aria-label="Lộ trình học EduOne">
        <div className="absolute inset-x-0 top-0 grid h-2 grid-cols-4" aria-hidden="true">
          <span className="bg-amber-300" />
          <span className="bg-rose-400" />
          <span className="bg-sky-400" />
          <span className="bg-emerald-400" />
        </div>
        <div className="flex items-center justify-between text-xs font-extrabold">
          <span className="inline-flex items-center gap-2"><ShieldCheck size={17} /> Phiên học được bảo vệ</span>
          <span className="rounded-md bg-white/12 px-3 py-2">2 / 7 Skill Nodes</span>
        </div>

        <div className="mx-auto w-full max-w-[580px] py-10">
          <div className="flex items-center gap-3 text-emerald-100">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-amber-300 text-amber-950">
              <Code2 size={23} />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-emerald-200">Scratch Foundation</p>
              <p className="mt-1 text-sm font-bold">Lộ trình theo năng lực STEAM</p>
            </div>
          </div>

          <h2 className="mt-8 max-w-xl text-[42px] font-black leading-[1.08] xl:text-[52px]">
            Mỗi bước học đều có lý do rõ ràng.
          </h2>

          <div className="mt-10 space-y-3" aria-label="Tiến độ mẫu">
            {pathItems.map((item, index) => (
              <div key={item.label} className="flex min-h-16 items-center gap-4 rounded-lg border border-white/20 bg-white/10 px-4 py-3">
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${item.complete ? "bg-emerald-300 text-emerald-950" : "bg-amber-300 text-amber-950"}`}>
                  {item.complete ? <Check size={18} strokeWidth={3} /> : <BookOpen size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black">{item.label}</p>
                  <p className="mt-1 text-xs font-bold text-emerald-100">{item.state}</p>
                </div>
                <span className="text-sm font-black text-emerald-200">0{index + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2" aria-label="Hồ sơ STEAM mẫu">
          {["S 78", "T 62", "E 55", "A 34", "M 82"].map((score, index) => (
            <div key={score} className={`rounded-md px-2 py-3 text-center text-xs font-black ${index === 3 ? "bg-rose-300 text-rose-950" : "bg-white/12 text-white"}`}>
              {score}
            </div>
          ))}
        </div>
      </aside>
    </main>
  );
}
