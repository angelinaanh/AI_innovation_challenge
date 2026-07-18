import { useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpenCheck,
  Bot,
  Check,
  ChevronDown,
  Sparkles,
  UserRound,
} from "lucide-react";

const OFFER_LABEL = {
  mcq: "Trắc nghiệm",
  matching: "Nối cột",
  ordering: "Sắp thứ tự",
  cloze: "Điền khuyết",
};

// Lightweight inline markdown: **bold** and `code` (e.g. Scratch block names),
// rendered as React nodes so there is no HTML injection.
function InlineText({ text }) {
  const parts = String(text || "").split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (/^`[^`]+`$/.test(part)) return <code key={index} className="tutor-code">{part.slice(1, -1)}</code>;
    return <span key={index}>{part}</span>;
  });
}

export function TutorMessage({ message, onEscalate, onPractice }) {
  const isStudent = message.role === "student";
  const [openCitation, setOpenCitation] = useState(null);

  return (
    <article className={`tutor-message ${isStudent ? "tutor-message-student" : "tutor-message-assistant"}`}>
      <div className="tutor-message-avatar" aria-hidden="true">
        {isStudent ? <UserRound size={15} /> : <Bot size={16} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-400">
          {isStudent ? "Bạn" : "EduOne Tutor"}
          {message.mode === "socratic" && <span className="tutor-mode">Gợi mở</span>}
        </div>
        <p className="mt-1.5 whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
          {message.content
            ? <InlineText text={message.content} />
            : (message.streaming ? "Đang suy nghĩ..." : "")}
        </p>

        {message.citations?.length > 0 && (
          <div className="mt-3 space-y-1.5" aria-label="Nguồn bài học">
            {message.citations.map((citation, index) => {
              const open = openCitation === index;
              return (
                <div key={citation.sourceChunkId || index}>
                  <button
                    className="tutor-citation w-full"
                    onClick={() => citation.snippet && setOpenCitation(open ? null : index)}
                    aria-expanded={open}
                  >
                    <BookOpenCheck size={14} />
                    <span className="flex-1 text-left">Nguồn: {citation.title}</span>
                    {citation.snippet && (
                      <ChevronDown size={13} className={open ? "rotate-180 transition" : "transition"} />
                    )}
                  </button>
                  {open && citation.snippet && (
                    <p className="tutor-citation-snippet">{citation.snippet}…</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {message.offer && onPractice && (
          <button className="tutor-offer" onClick={() => onPractice(message.offer.type)}>
            <Sparkles size={14} />
            <span className="flex-1 text-left">{message.offer.reason}</span>
            <span className="tutor-offer-tag">{OFFER_LABEL[message.offer.type] || "Luyện tập"}</span>
          </button>
        )}

        {message.escalationRecommended && !message.escalated && (
          <button
            className="tutor-escalate-button mt-3"
            onClick={() => onEscalate(message)}
            disabled={message.escalating}
          >
            <AlertTriangle size={15} />
            {message.escalating ? "Đang gửi..." : "Gửi câu hỏi cho giáo viên"}
            <ArrowUpRight size={14} />
          </button>
        )}
        {message.escalated && (
          <div className="mt-3 flex items-center gap-2 text-xs font-black text-emerald-700">
            <Check size={15} /> Đã chuyển tới giáo viên
          </div>
        )}
      </div>
    </article>
  );
}
