import { ArrowRight, Lightbulb, Target } from "lucide-react";

const BLOCK_COLORS = ["scratch-block-amber", "scratch-block-blue", "scratch-block-violet", "scratch-block-coral"];

export function CheckpointLesson({ checkpoint, objectives, onNext }) {
  return (
    <section className="surface overflow-hidden" aria-labelledby={`checkpoint-${checkpoint.id}`}>
      <div className="border-b border-slate-100 px-5 py-5 md:px-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{checkpoint.eyebrow || "Checkpoint"}</p>
            <h2 id={`checkpoint-${checkpoint.id}`} className="mt-2 text-2xl font-black text-slate-950 md:text-3xl">
              {checkpoint.title}
            </h2>
          </div>
          <span className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-black text-sky-700">
            {checkpoint.durationMinutes || 6} phút
          </span>
        </div>
      </div>

      <div className="px-5 py-6 md:px-7 md:py-7">
        <p className="max-w-3xl text-base font-semibold leading-7 text-slate-600">{checkpoint.body}</p>

        {Array.isArray(checkpoint.blocks) && checkpoint.blocks.length > 0 && (
          <div className="mt-7 rounded-lg border border-slate-200 bg-[#f7fafc] p-4 md:p-6" aria-label="Minh họa khối lệnh Scratch">
            <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase text-slate-500">
              <Target size={16} /> Kịch bản Scratch
            </div>
            <div className="max-w-xl space-y-2">
              {checkpoint.blocks.map((block, index) => (
                <div
                  key={`${block}-${index}`}
                  className={`scratch-block ${BLOCK_COLORS[index % BLOCK_COLORS.length]}`}
                  style={{ marginLeft: `${Math.min(index, 2) * 18}px` }}
                >
                  {block}
                </div>
              ))}
            </div>
          </div>
        )}

        {checkpoint.takeaway && (
          <div className="mt-6 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
            <Lightbulb className="mt-0.5 shrink-0 text-amber-500" size={20} />
            <div>
              <p className="text-xs font-black uppercase text-amber-700">Ghi nhớ</p>
              <p className="mt-1 text-sm font-extrabold leading-6">{checkpoint.takeaway}</p>
            </div>
          </div>
        )}

        {objectives?.length > 0 && (
          <div className="mt-7">
            <p className="text-xs font-black uppercase text-slate-400">Bạn đang luyện</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {objectives.map((objective) => (
                <span key={objective} className="rounded-full bg-violet-50 px-3 py-2 text-xs font-extrabold text-violet-700">
                  {objective}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end border-t border-slate-100 pt-5">
          <button className="primary-button" onClick={onNext}>
            Tiếp tục <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}
