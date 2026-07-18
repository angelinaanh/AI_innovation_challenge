import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  LockKeyhole,
  RefreshCw,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

import { api } from "../../lib/apiClient.js";

const STATUS = {
  completed: { label: "Đã hoàn thành", icon: Check, className: "path-card-completed" },
  current: { label: "Nên học tiếp", icon: Sparkles, className: "path-card-current" },
  available: { label: "Có thể học", icon: Compass, className: "path-card-available" },
  locked: { label: "Chưa mở khóa", icon: LockKeyhole, className: "path-card-locked" },
};

function PathCard({ node, index }) {
  const state = STATUS[node.status] || STATUS.locked;
  const Icon = state.icon;
  const canOpen = node.hasPublishedLesson && node.status !== "locked";
  const ActionIcon = node.status === "completed" ? RotateCcw : ArrowRight;
  return (
    <article className={`learning-node ${state.className}`}>
      <div className="node-index">{String(index + 1).padStart(2, "0")}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="node-status"><Icon size={14} /> {state.label}</span>
          {node.hasPublishedLesson && <span className="approved-chip">Giáo viên đã duyệt</span>}
        </div>
        <h2 className="mt-3 text-xl font-black text-slate-900">{node.name}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{node.description}</p>
        {node.unlockReason && (
          <p className="mt-4 rounded-md bg-white/75 px-3 py-2 text-sm font-bold leading-5 text-emerald-800">
            {node.unlockReason}
          </p>
        )}
        {node.lockedReason && (
          <p className="mt-4 text-sm font-bold leading-5 text-slate-600">{node.lockedReason}</p>
        )}
      </div>
      {canOpen && (
        <Link
          className="node-action"
          to={`/student/lessons/${node.id}`}
          aria-label={`${node.status === "completed" ? "Học lại" : "Bắt đầu"} ${node.name}`}
          title={node.status === "completed" ? "Học lại" : "Bắt đầu bài học"}
        >
          <ActionIcon size={19} />
        </Link>
      )}
    </article>
  );
}

export function LearningPathPage() {
  const [path, setPath] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback((signal) => {
    setError(null);
    return api.getPath(signal).then(setPath).catch((loadError) => {
      if (loadError.name !== "AbortError") setError(loadError.message);
    });
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

  if (error) {
    return (
      <div className="surface p-7 text-center">
        <RefreshCw className="mx-auto text-rose-500" />
        <p className="mt-3 font-bold text-slate-700">{error}</p>
      </div>
    );
  }

  if (!path) {
    return <div className="skeleton h-[620px]" aria-label="Đang tải lộ trình" />;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/student" className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-500 hover:text-slate-950">
        <ArrowLeft size={17} /> Tổng quan
      </Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Scratch Foundation · 7 Skill Nodes</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 md:text-[38px]">Lộ trình học của bạn</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
            Mỗi bước được mở bằng năng lực STEAM và kỹ năng tiên quyết. EXP không khóa kiến thức.
          </p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="text-xs font-extrabold uppercase text-emerald-700">Tiến độ cá nhân</div>
          <div className="mt-1 text-2xl font-black text-emerald-950">{path.completedCount}/{path.totalCount} node</div>
        </div>
      </div>

      <div className="relative mt-8 space-y-4 pb-10">
        <div className="absolute bottom-12 left-[29px] top-8 hidden w-0.5 bg-slate-200 sm:block" aria-hidden="true" />
        {path.nodes.map((node, index) => <PathCard key={node.id} node={node} index={index} />)}
      </div>
    </div>
  );
}
