import { useEffect, useRef, useState } from "react";
import {
  Bot,
  LoaderCircle,
  MessageCircleQuestion,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import { api } from "../../lib/apiClient.js";
import { exerciseApi } from "../../lib/exerciseApi.js";
import { ExerciseCard } from "./exercises/ExerciseCard.jsx";
import { TutorMessage } from "./TutorMessage.jsx";

const EXERCISE_TYPES = [
  { type: "mcq", label: "Trắc nghiệm" },
  { type: "matching", label: "Nối cột" },
  { type: "ordering", label: "Sắp thứ tự" },
  { type: "cloze", label: "Điền khuyết" },
];

const SUGGESTIONS = [
  "Repeat khác forever thế nào?",
  "Làm sao nhận ra một mẫu lặp?",
  "Cho mình đáp án đúng về khối repeat",
];

function normalizeStoredMessage(message) {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    citations: message.citations || [],
    studentMessageId: message.studentMessageId,
    escalationRecommended: message.escalationRecommended,
    escalated: message.escalated,
  };
}

export function TutorDrawer({ skillNodeId, skillNodeName }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [genType, setGenType] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    if (!open || session) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    api.createTutorSession(skillNodeId, controller.signal)
      .then((data) => {
        setSession(data.session);
        setMessages(data.messages.map(normalizeStoredMessage));
      })
      .catch((loadError) => {
        if (loadError.name !== "AbortError") setError(loadError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [open, session, skillNodeId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streaming]);

  function updateAssistant(tempId, updater) {
    setMessages((current) => current.map((message) => (
      message.id === tempId ? updater(message) : message
    )));
  }

  async function sendMessage(value = draft) {
    const question = value.trim();
    if (!question || !session || streaming) return;
    const studentTempId = `student-${Date.now()}`;
    const assistantTempId = `assistant-${Date.now()}`;
    setDraft("");
    setError(null);
    setStreaming(true);
    setMessages((current) => [
      ...current,
      { id: studentTempId, role: "student", content: question, citations: [] },
      {
        id: assistantTempId,
        role: "assistant",
        content: "",
        citations: [],
        streaming: true,
      },
    ]);

    try {
      await api.streamTutorMessage(session.id, question, {
        onEvent(event, data) {
          if (event === "token") {
            updateAssistant(assistantTempId, (message) => ({
              ...message,
              content: message.content + data.delta,
            }));
          }
          if (event === "citation") {
            updateAssistant(assistantTempId, (message) => ({
              ...message,
              citations: [...message.citations, data],
            }));
          }
          if (event === "refusal") {
            updateAssistant(assistantTempId, (message) => ({
              ...message,
              content: data.content,
              mode: data.mode,
              studentMessageId: data.studentMessageId,
              escalationRecommended: data.escalationRecommended,
              escalated: Boolean(data.escalationId),
            }));
          }
          if (event === "done") {
            updateAssistant(assistantTempId, (message) => ({
              ...message,
              serverId: data.messageId,
              studentMessageId: data.studentMessageId,
              mode: data.mode,
              confidence: data.confidence,
              escalationRecommended: data.escalationRecommended,
              escalated: message.escalated || Boolean(data.escalationId),
              streaming: false,
            }));
          }
          if (event === "error") {
            setError(data.message);
            updateAssistant(assistantTempId, (message) => ({
              ...message,
              content: data.message,
              mode: "error",
              streaming: false,
            }));
          }
        },
      });
    } catch (sendError) {
      setError(sendError.message);
      updateAssistant(assistantTempId, (message) => ({
        ...message,
        content: "Mất kết nối với AI Tutor. Hãy thử lại sau.",
        mode: "error",
        streaming: false,
      }));
    } finally {
      setStreaming(false);
    }
  }

  async function escalate(message) {
    if (!message.studentMessageId || message.escalating) return;
    updateAssistant(message.id, (current) => ({ ...current, escalating: true }));
    try {
      await api.escalateTutorMessage(message.studentMessageId);
      updateAssistant(message.id, (current) => ({
        ...current,
        escalating: false,
        escalated: true,
      }));
    } catch (escalateError) {
      setError(escalateError.message);
      updateAssistant(message.id, (current) => ({ ...current, escalating: false }));
    }
  }

  async function generateExercise(type) {
    if (!session || genType || streaming) return;
    setGenType(type);
    setError(null);
    try {
      const exercise = await exerciseApi.generate(session.id, type);
      setMessages((current) => [
        ...current,
        { id: `exercise-${exercise.id}`, kind: "exercise", exercise },
      ]);
    } catch (genError) {
      setError(genError.message);
    } finally {
      setGenType(null);
    }
  }

  function submit(event) {
    event.preventDefault();
    sendMessage();
  }

  return (
    <>
      <button className="tutor-launcher" onClick={() => setOpen(true)} aria-label="Mở AI Tutor">
        <MessageCircleQuestion size={22} />
        <span>Hỏi AI Tutor</span>
      </button>

      {open && (
        <div className="tutor-layer" role="dialog" aria-modal="true" aria-label="AI Tutor">
          <button className="tutor-backdrop" onClick={() => setOpen(false)} aria-label="Đóng AI Tutor" />
          <aside className="tutor-drawer">
            <header className="tutor-header">
              <div className="tutor-brand-icon"><Bot size={22} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-950">EduOne AI Tutor</h2>
                  <span className="tutor-online-dot" title="Sẵn sàng" />
                </div>
                <p className="truncate text-xs font-bold text-slate-500">{skillNodeName}</p>
              </div>
              <button className="icon-button inline-grid" onClick={() => setOpen(false)} aria-label="Đóng AI Tutor" title="Đóng">
                <X size={20} />
              </button>
            </header>

            <div className="tutor-trust">
              <ShieldCheck size={17} />
              <p><strong>Nội dung có kiểm soát.</strong> Tutor chỉ dùng bài học giáo viên đã duyệt và luôn hiển thị nguồn.</p>
            </div>

            <div className="tutor-conversation" aria-live="polite">
              {loading && (
                <div className="flex h-full items-center justify-center text-sm font-bold text-slate-500">
                  <LoaderCircle className="mr-2 animate-spin" size={18} /> Đang mở phiên Tutor
                </div>
              )}
              {!loading && messages.length === 0 && (
                <div className="tutor-welcome">
                  <div className="tutor-welcome-icon"><Sparkles size={25} /></div>
                  <h3 className="mt-4 text-lg font-black text-slate-900">Bạn đang vướng ở đâu?</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    Mình sẽ gợi mở từng bước bằng chính nội dung trong bài {skillNodeName}.
                  </p>
                  <div className="mt-5 space-y-2">
                    {SUGGESTIONS.map((suggestion) => (
                      <button key={suggestion} className="tutor-suggestion" onClick={() => sendMessage(suggestion)} disabled={!session || streaming}>
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((message) => (
                message.kind === "exercise"
                  ? <ExerciseCard key={message.id} exercise={message.exercise} />
                  : <TutorMessage key={message.id} message={message} onEscalate={escalate} />
              ))}
              <div ref={endRef} />
            </div>

            {error && <p className="tutor-error" role="alert">{error}</p>}

            <div className="tutor-practice-bar" aria-label="Tạo bài luyện tương tác">
              <span className="tutor-practice-label"><Sparkles size={13} /> Luyện tập</span>
              {EXERCISE_TYPES.map(({ type, label }) => (
                <button
                  key={type}
                  type="button"
                  className="tutor-practice-chip"
                  onClick={() => generateExercise(type)}
                  disabled={!session || Boolean(genType) || streaming}
                >
                  {genType === type ? <LoaderCircle className="animate-spin" size={13} /> : null}
                  {label}
                </button>
              ))}
            </div>

            <form className="tutor-composer" onSubmit={submit}>
              <label htmlFor="tutor-question" className="sr-only">Câu hỏi cho AI Tutor</label>
              <textarea
                id="tutor-question"
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, 600))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Hỏi về bài học này..."
                rows={2}
                disabled={!session || streaming}
              />
              <button type="submit" className="tutor-send" disabled={!draft.trim() || !session || streaming} aria-label="Gửi câu hỏi" title="Gửi">
                {streaming ? <LoaderCircle className="animate-spin" size={18} /> : <Send size={18} />}
              </button>
            </form>
            <p className="tutor-disclaimer">AI có thể sai. Hãy kiểm tra nguồn hoặc hỏi giáo viên khi chưa chắc chắn.</p>
          </aside>
        </div>
      )}
    </>
  );
}
