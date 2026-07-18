import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../../lib/apiClient.js";

const statusLabel = {
  completed: "Đã hoàn thành",
  current: "Nên học tiếp",
  available: "Có thể học",
  locked: "Chưa mở khóa",
};

export function StudentContentPage() {
  const [path, setPath] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async (signal) => {
    setError(null);
    try {
      setPath(await api.getPath(signal));
    } catch (loadError) {
      if (loadError.name !== "AbortError") setError(loadError.message);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    load(controller.signal);
    const refresh = () => load();
    window.addEventListener("eduone:content-published", refresh);
    return () => {
      controller.abort();
      window.removeEventListener("eduone:content-published", refresh);
    };
  }, [load]);

  const published = useMemo(
    () => path?.nodes?.filter((node) => node.hasPublishedLesson) || [],
    [path],
  );
  const availableCount = published.filter((node) => node.status !== "locked").length;

  return (
    <div className="space-y-5">
      <header className="border-b border-slate-200 pb-5">
        <p className="eyebrow">Thư viện học tập</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950 md:text-3xl">Nội dung đã được giáo viên duyệt</h1>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-500">
          Bài học mới xuất bản xuất hiện tại đây ngay lập tức. Điều kiện năng lực và kỹ năng tiên quyết vẫn được giữ nguyên.
        </p>
      </header>

      {error && (
        <div className="surface p-6 text-center">
          <RefreshCw className="mx-auto text-rose-500" />
          <p className="mt-3 text-sm font-bold text-slate-600">{error}</p>
          <button type="button" className="secondary-button mt-4" onClick={() => load()}>Tải lại</button>
        </div>
      )}

      {!path && !error ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => <div key={item} className="skeleton h-64" />)}
        </div>
      ) : path && (
        <>
          <section className="grid gap-3 sm:grid-cols-3" aria-label="Tổng quan nội dung">
            <div className="surface flex min-h-24 items-center gap-4 p-4"><div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><BookOpenCheck size={21} /></div><div><p className="text-2xl font-black">{published.length}</p><p className="mt-1 text-xs font-bold text-slate-500">Bài đã xuất bản</p></div></div>
            <div className="surface flex min-h-24 items-center gap-4 p-4"><div className="grid h-11 w-11 place-items-center rounded-lg bg-sky-50 text-sky-700"><CheckCircle2 size={21} /></div><div><p className="text-2xl font-black">{availableCount}</p><p className="mt-1 text-xs font-bold text-slate-500">Có thể học ngay</p></div></div>
            <div className="surface flex min-h-24 items-center gap-4 p-4"><div className="grid h-11 w-11 place-items-center rounded-lg bg-amber-50 text-amber-700"><Clock3 size={21} /></div><div><p className="text-2xl font-black">{path.completedCount}/{path.totalCount}</p><p className="mt-1 text-xs font-bold text-slate-500">Tiến độ Skill Node</p></div></div>
          </section>

          {published.length === 0 ? (
            <div className="surface px-6 py-14 text-center">
              <BookOpenCheck className="mx-auto text-slate-300" size={38} />
              <h2 className="mt-4 text-lg font-black">Chưa có nội dung được xuất bản</h2>
              <p className="mt-2 text-sm text-slate-500">Bài học sẽ xuất hiện khi giáo viên hoàn tất bước duyệt và xuất bản.</p>
            </div>
          ) : (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Danh sách bài học">
              {published.map((node, index) => {
                const locked = node.status === "locked";
                return (
                  <article key={node.id} className="surface flex min-h-64 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`grid h-11 w-11 place-items-center rounded-lg ${locked ? "bg-slate-100 text-slate-500" : "bg-emerald-700 text-white"}`}>
                        {locked ? <LockKeyhole size={20} /> : <BookOpenCheck size={20} />}
                      </div>
                      <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700"><ShieldCheck className="mr-1 inline" size={13} />Đã duyệt</span>
                    </div>
                    <p className="mt-5 text-xs font-black uppercase text-slate-400">Node {String(index + 1).padStart(2, "0")} · {statusLabel[node.status]}</p>
                    <h2 className="mt-2 text-lg font-black text-slate-950">{node.name}</h2>
                    <p className="mt-2 line-clamp-3 text-sm font-medium leading-6 text-slate-500">{node.description}</p>
                    <div className="mt-auto border-t border-slate-100 pt-4">
                      {locked ? (
                        <p className="text-xs font-bold leading-5 text-slate-500">{node.lockedReason}</p>
                      ) : (
                        <Link className="inline-flex items-center gap-2 text-sm font-black text-emerald-700 hover:text-emerald-900" to={`/student/lessons/${node.id}`}>Mở bài học <ArrowRight size={17} /></Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </>
      )}
    </div>
  );
}
