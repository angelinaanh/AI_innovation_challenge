import {
  Calculator,
  CheckCircle2,
  Image as ImageIcon,
  Lightbulb,
  ListChecks,
  Rocket,
  Sparkles,
  Target,
  XCircle,
} from "lucide-react";
import { useState } from "react";

/**
 * Render bài giảng shape `steam_lesson` (ai/prompts/create_leacturer.md).
 * Dùng chung cho học sinh và cho giáo viên xem trước, nên không chứa bất kỳ
 * hành động sửa/xuất bản nào — chỉ hiển thị.
 */

// Markdown tối giản: **đậm**, "- " gạch đầu dòng, "### " tiêu đề phụ.
function MarkdownLite({ text }) {
  const lines = String(text || "").split("\n");
  return (
    <div className="space-y-2 text-sm leading-7 text-slate-700">
      {lines.map((line, index) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, partIndex) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={partIndex} className="font-black text-slate-900">{part.slice(2, -2)}</strong>
            : part);
        if (/^###\s/.test(line)) {
          return <h4 key={index} className="pt-2 text-base font-black text-slate-900">{line.replace(/^###\s*/, "")}</h4>;
        }
        if (/^[-*]\s/.test(line)) {
          return (
            <p key={index} className="pl-4">
              • {parts.map((part) => (typeof part === "string" ? part.replace(/^[-*]\s*/, "") : part))}
            </p>
          );
        }
        if (!line.trim()) return <div key={index} className="h-1" />;
        return <p key={index}>{parts}</p>;
      })}
    </div>
  );
}

function QuickPractice({ block }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
      <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-emerald-700">
        <Target size={14} />Luyện nhanh
      </p>
      <div className="mt-2"><MarkdownLite text={block.question} /></div>
      {revealed ? (
        <div className="mt-3 rounded-md border border-emerald-300 bg-white p-3">
          <p className="text-[11px] font-black uppercase text-emerald-700">Đáp án</p>
          <div className="mt-1"><MarkdownLite text={block.answer} /></div>
        </div>
      ) : (
        <button type="button" className="secondary-button mt-3 !min-h-9 !px-3 !text-xs" onClick={() => setRevealed(true)}>
          Xem đáp án
        </button>
      )}
    </div>
  );
}

function Block({ block }) {
  if (block.type === "text") return <MarkdownLite text={block.content} />;

  if (block.type === "formula") {
    // Chưa render LaTeX thành ký hiệu toán — hiển thị nguyên chuỗi trong khối
    // nổi bật để giáo viên/học sinh vẫn đọc được công thức.
    return (
      <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-4">
        <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-violet-700">
          <Calculator size={14} />Công thức
        </p>
        <p className="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-sm text-slate-800">
          {block.content}
        </p>
      </div>
    );
  }

  if (block.type === "image") {
    if (!block.url) return null;
    return (
      <figure className="space-y-1.5">
        <img
          src={block.url}
          alt={block.alt_text || "Ảnh minh họa"}
          className="max-h-[28rem] w-full rounded-lg border border-slate-200 bg-slate-50 object-contain"
        />
        {block.alt_text && (
          <figcaption className="text-center text-xs font-medium italic text-slate-500">{block.alt_text}</figcaption>
        )}
      </figure>
    );
  }

  if (block.type === "image_suggestion") {
    return (
      <div className="rounded-lg border border-dashed border-sky-300 bg-sky-50/50 p-4">
        <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-sky-700">
          <ImageIcon size={14} />Hình minh họa gợi ý
        </p>
        <p className="mt-1.5 text-sm font-medium italic leading-6 text-slate-600">{block.alt_text}</p>
      </div>
    );
  }

  if (block.type === "quick_practice") return <QuickPractice block={block} />;

  if (block.type === "tip") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4">
        <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-amber-700">
          <Lightbulb size={14} />Mẹo ghi nhớ
        </p>
        <div className="mt-2"><MarkdownLite text={block.content} /></div>
      </div>
    );
  }
  return null;
}

function QuizItem({ quiz, index }) {
  const [picked, setPicked] = useState(null);
  const answered = picked !== null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm font-extrabold text-slate-900">Câu {index + 1}. {quiz.question}</p>
      <ul className="mt-3 space-y-2">
        {quiz.options.map((option, optionIndex) => {
          const chosen = picked === optionIndex;
          // Sau khi trả lời: tô xanh đáp án đúng, tô đỏ lựa chọn sai đã chọn.
          let tone = "border-slate-200 bg-slate-50 hover:border-emerald-300";
          if (answered && option.is_correct) tone = "border-emerald-300 bg-emerald-50";
          else if (answered && chosen) tone = "border-rose-300 bg-rose-50";
          return (
            <li key={optionIndex}>
              <button
                type="button"
                className={`flex w-full items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm font-bold transition ${tone}`}
                onClick={() => setPicked(optionIndex)}
                disabled={answered}
              >
                <span className="mt-0.5 shrink-0 text-xs font-black text-slate-400">
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                <span className="min-w-0 flex-1 text-slate-800">{option.text}</span>
                {answered && option.is_correct && <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" />}
                {answered && chosen && !option.is_correct && <XCircle size={17} className="mt-0.5 shrink-0 text-rose-500" />}
              </button>
              {answered && (chosen || option.is_correct) && option.feedback && (
                <p className="mt-1.5 pl-3 text-xs font-medium leading-5 text-slate-500">{option.feedback}</p>
              )}
            </li>
          );
        })}
      </ul>
      {answered && (
        <button type="button" className="secondary-button mt-3 !min-h-8 !px-2.5 !text-[11px]" onClick={() => setPicked(null)}>
          Làm lại câu này
        </button>
      )}
    </div>
  );
}

export function SteamLessonView({ content }) {
  if (!content) return null;
  const quizzes = content.evaluation?.quizzes || [];
  const quest = content.practical_quest;

  return (
    <article className="space-y-5">
      {content.engage_hook && (
        <div className="rounded-lg border border-rose-200 bg-rose-50/60 p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-rose-700">
            <Sparkles size={14} />Cùng nghĩ xem
          </p>
          <p className="mt-1.5 text-sm font-bold leading-6 text-slate-800">{content.engage_hook}</p>
        </div>
      )}

      {(content.sections || []).map((section, sectionIndex) => (
        <section key={`${section.section_id}-${sectionIndex}`} className="surface p-5 sm:p-6">
          <h2 className="text-lg font-black text-slate-950">{section.section_title}</h2>
          <div className="mt-4 space-y-4">
            {(section.content_blocks || []).map((block, blockIndex) => (
              <Block key={blockIndex} block={block} />
            ))}
          </div>
        </section>
      ))}

      {(content.lesson_highlights || []).length > 0 && (
        <section className="surface p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-black text-slate-950">
            <Sparkles size={17} className="text-emerald-600" />Tổng kết bài học
          </h2>
          <ul className="mt-3 space-y-2">
            {content.lesson_highlights.map((highlight, index) => (
              <li key={index} className="flex items-start gap-2 text-sm font-medium leading-6 text-slate-700">
                <CheckCircle2 size={16} className="mt-1 shrink-0 text-emerald-600" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {quizzes.length > 0 && (
        <section className="surface p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-black text-slate-950">
            <ListChecks size={17} className="text-sky-600" />Kiểm tra & Đánh giá ({quizzes.length} câu)
          </h2>
          <div className="mt-4 space-y-3">
            {quizzes.map((quiz, index) => <QuizItem key={index} quiz={quiz} index={index} />)}
          </div>
        </section>
      )}

      {quest && (
        <section className="surface border-indigo-200 bg-indigo-50/40 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-black text-indigo-900">
            <Rocket size={17} />Nhiệm vụ thực hành
          </h2>
          <p className="mt-2 text-sm font-extrabold text-slate-900">{quest.quest_title}</p>
          {quest.scenario && (
            <div className="mt-3">
              <p className="text-[11px] font-black uppercase tracking-wide text-indigo-700">Bối cảnh</p>
              <div className="mt-1"><MarkdownLite text={quest.scenario} /></div>
            </div>
          )}
          {quest.task && (
            <div className="mt-3">
              <p className="text-[11px] font-black uppercase tracking-wide text-indigo-700">Yêu cầu</p>
              <div className="mt-1"><MarkdownLite text={quest.task} /></div>
            </div>
          )}
          {quest.deliverable && (
            <div className="mt-3">
              <p className="text-[11px] font-black uppercase tracking-wide text-indigo-700">Sản phẩm cần nộp</p>
              <div className="mt-1"><MarkdownLite text={quest.deliverable} /></div>
            </div>
          )}
        </section>
      )}
    </article>
  );
}
