import {
  AlertTriangle,
  ArrowUpRight,
  BookOpenCheck,
  Bot,
  Check,
  UserRound,
} from "lucide-react";

export function TutorMessage({ message, onEscalate }) {
  const isStudent = message.role === "student";
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
          {message.content || (message.streaming ? "Đang suy nghĩ..." : "")}
        </p>

        {message.citations?.length > 0 && (
          <div className="mt-3 space-y-1.5" aria-label="Nguồn bài học">
            {message.citations.map((citation) => (
              <div key={citation.sourceChunkId} className="tutor-citation">
                <BookOpenCheck size={14} />
                <span>Nguồn: {citation.title}</span>
              </div>
            ))}
          </div>
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
