import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles } from "lucide-react";

import { api } from "../../lib/apiClient.js";
import { RadarProfile } from "../student-dashboard/RadarProfile.jsx";

const AXIS_LABEL = { S: "Khoa học", T: "Công nghệ", E: "Kỹ thuật", A: "Nghệ thuật", M: "Toán học" };
const BRAND_GRADIENT = { background: "var(--gradient-brand)" };

function BotAvatar({ size = 40 }) {
  return (
    <div
      className="grid shrink-0 place-items-center rounded-2xl text-white shadow-sm"
      style={{ ...BRAND_GRADIENT, width: size, height: size }}
    >
      <Bot size={size * 0.55} strokeWidth={2.4} />
    </div>
  );
}

function ChatBubble({ role, content }) {
  const isAssistant = role === "assistant";
  return (
    <div className={`flex items-end gap-2 ${isAssistant ? "justify-start" : "justify-end"}`}>
      {isAssistant && <BotAvatar size={30} />}
      <div
        className={`max-w-[78%] px-4 py-2.5 text-sm leading-6 ${
          isAssistant
            ? "rounded-2xl rounded-bl-md bg-emerald-50 text-emerald-950"
            : "rounded-2xl rounded-br-md bg-emerald-600 font-semibold text-white"
        }`}
      >
        {content}
      </div>
    </div>
  );
}

function ChatPhase({ onComplete }) {
  const [messages, setMessages] = useState([]);
  const [collected, setCollected] = useState({});
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const started = useRef(false);

  const pushAndSend = useCallback(async (history, currentCollected) => {
    setBusy(true);
    setError(null);
    try {
      const result = await api.onboardingChat({ messages: history, collected: currentCollected });
      setCollected(result.collected);
      setMessages([...history, { role: "assistant", content: result.reply }]);
      if (result.complete) {
        await api.completeOnboarding({ collected: result.collected });
        onComplete();
      }
    } catch (sendError) {
      setError(sendError.message || "Mình chưa gửi được, bạn thử lại giúp nhé 😊");
    } finally {
      setBusy(false);
    }
  }, [onComplete]);

  // Lời chào đầu tiên từ trợ lý.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    pushAndSend([], {});
  }, [pushAndSend]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function submit(event) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const history = [...messages, { role: "user", content: text }];
    setMessages(history);
    setInput("");
    await pushAndSend(history, collected);
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="min-h-[320px] flex-1 space-y-3 overflow-y-auto px-1 py-2">
        {messages.map((message, index) => <ChatBubble key={index} {...message} />)}
        {busy && (
          <div className="flex items-center gap-2 pl-1 text-sm text-slate-400">
            <Loader2 size={16} className="animate-spin" /> Trợ lý đang trả lời...
          </div>
        )}
      </div>
      {error && <p className="px-1 pb-2 text-xs font-bold text-rose-500">{error}</p>}
      <form className="mt-2 flex items-center gap-2" onSubmit={submit}>
        <input
          className="auth-input flex-1 px-4"
          placeholder="Nhập câu trả lời của bạn..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={busy}
          autoFocus
        />
        <button
          type="submit"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-700 text-white shadow-md transition hover:bg-emerald-800 disabled:opacity-40"
          disabled={busy || !input.trim()}
          aria-label="Gửi"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

function TestPhase({ onComplete }) {
  const [state, setState] = useState({ loading: true, testId: null, questions: [] });
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await api.generatePlacement();
        if (!active) return;
        if (result.status === "submitted") {
          onComplete(result);
          return;
        }
        setState({ loading: false, testId: result.testId, questions: result.questions });
      } catch (loadError) {
        if (active) setError(loadError.message || "Mình chưa tạo được bài, bạn thử lại nhé 😊");
      }
    })();
    return () => { active = false; };
  }, [onComplete]);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        testId: state.testId,
        answers: Object.entries(answers).map(([questionId, ans]) => ({ 
          questionId, 
          selectedIndex: ans.selectedIndex,
          textAnswer: ans.textAnswer 
        })),
      };
      const result = await api.submitPlacement(payload);
      onComplete(result);
    } catch (submitError) {
      setError(submitError.message || "Mình chưa nộp được bài, bạn thử lại nhé 😊");
      setSubmitting(false);
    }
  }

  if (state.loading) {
    return (
      <div className="grid min-h-[360px] place-items-center text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={30} className="animate-spin text-emerald-600" />
          <p className="text-sm font-bold">Đang chuẩn bị Nhiệm vụ Phân tích Kỹ năng cho bạn...</p>
        </div>
      </div>
    );
  }

  const total = state.questions.length;
  const question = state.questions[index];
  const answeredCount = Object.keys(answers).length;
  const selected = answers[question.id];
  const isLast = index === total - 1;

  function choose(optionIndex) {
    setAnswers({ ...answers, [question.id]: { selectedIndex: optionIndex } });
  }

  function typeText(text) {
    setAnswers({ ...answers, [question.id]: { textAnswer: text } });
  }

  const isAnswered = selected && (selected.selectedIndex !== undefined || (selected.textAnswer && selected.textAnswer.trim().length > 0));

  return (
    <div className="flex min-h-[360px] flex-col">
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs font-extrabold text-slate-500">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
            Câu {index + 1} / {total} · {AXIS_LABEL[question.steamAxis] || question.steamAxis}
          </span>
          <span>Đã trả lời {answeredCount}/{total}</span>
        </div>
        <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-[width] duration-500"
            style={{ width: `${(answeredCount / total) * 100}%` }}
          />
        </div>
      </div>

      {question.imageUrl && (
        <div className="mb-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
          <img src={question.imageUrl} alt="Minh họa" className="max-h-48 w-full object-contain mix-blend-multiply" />
        </div>
      )}
      <p className="font-display mb-4 text-lg font-bold leading-snug text-slate-900">{question.body}</p>
      
      {question.type === "mcq" || !question.type ? (
        <div className="space-y-2.5">
          {question.options.map((option, optionIndex) => {
            const isSelected = selected?.selectedIndex === optionIndex;
            return (
              <button
                key={optionIndex}
                type="button"
                onClick={() => choose(optionIndex)}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm font-semibold transition ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/40"
                }`}
              >
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black ${
                  isSelected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                }`}
                >
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                {option}
              </button>
            );
          })}
        </div>
      ) : (
        <textarea
          className="auth-input min-h-[120px] w-full resize-none p-4"
          placeholder="Nhập câu trả lời của bạn vào đây..."
          value={selected?.textAnswer || ""}
          onChange={(e) => typeText(e.target.value)}
        />
      )}

      {error && <p className="mt-3 text-xs font-bold text-rose-500">{error}</p>}

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <button
          type="button"
          className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 transition hover:text-slate-700 disabled:opacity-40"
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
          disabled={index === 0}
        >
          Quay lại
        </button>
        {isLast ? (
          <button
            type="button"
            className="auth-primary-button max-w-[240px]"
            onClick={submit}
            disabled={submitting || answeredCount < total}
          >
            {submitting ? "Đang chấm..." : `Nộp bài (${answeredCount}/${total})`}
          </button>
        ) : (
          <button
            type="button"
            className="auth-primary-button max-w-[200px]"
            onClick={() => setIndex((value) => Math.min(total - 1, value + 1))}
            disabled={!isAnswered}
          >
            Câu tiếp theo
          </button>
        )}
      </div>
    </div>
  );
}

function ResultPhase({ result, onFinish }) {
  const radar = result.radar || {};
  return (
    <div className="flex min-h-[360px] flex-col">
      <div className="mb-3 flex items-center gap-2 text-sm font-black text-emerald-700">
        <Sparkles size={18} /> Kết quả phân tích kỹ năng
      </div>
      <RadarProfile profile={result.steam} />
      <div className="mt-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-amber-50 p-4">
        <p className="text-sm font-bold leading-6 text-slate-800">{radar.message}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-black">
          <span className="rounded-full bg-white px-3 py-1 text-slate-700 shadow-sm">
            Điểm tổng: {result.scorePercent}% ({result.totalCorrect}/{result.totalQuestions})
          </span>
          <span className={`rounded-full px-3 py-1 text-white ${
            result.track === "advanced" ? "bg-emerald-600" : "bg-sky-500"
          }`}
          >
            Lộ trình {radar.trackLabel || (result.track === "advanced" ? "Nâng cao" : "Cơ bản")}
          </span>
        </div>
      </div>
      {result.feedbacks && result.feedbacks.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Nhận xét từ Giáo viên AI</p>
          {result.feedbacks.map((fb, idx) => (
            <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm leading-6 text-slate-700 shadow-sm">
              <Sparkles size={14} className="mb-1 inline-block text-amber-500" /> {fb}
            </div>
          ))}
        </div>
      )}
      <button className="auth-primary-button mt-5" type="button" onClick={onFinish}>
        Bắt đầu hành trình học của mình 🚀
      </button>
    </div>
  );
}

const TITLES = {
  chat: "Cùng làm quen nhé!",
  test: "Nhiệm vụ Phân tích Kỹ năng",
  result: "Chào mừng bạn đến EduOne!",
};

export function OnboardingGate({ onboarding, onFinished }) {
  const [phase, setPhase] = useState(onboarding?.chatCompleted ? "test" : "chat");
  const [result, setResult] = useState(null);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] border border-[#f1ede4] bg-white shadow-[0_18px_60px_rgba(15,23,42,0.22)]">
        <div className="h-1.5 w-full" style={BRAND_GRADIENT} />
        <div className="flex items-center gap-3 border-b border-slate-100 bg-[#fbf9f5] px-6 py-4">
          <BotAvatar size={44} />
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-600">Trợ lý EduOne</p>
            <h2 className="font-display text-xl font-bold leading-tight text-slate-900">{TITLES[phase]}</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {phase === "chat" && <ChatPhase onComplete={() => setPhase("test")} />}
          {phase === "test" && (
            <TestPhase
              onComplete={(testResult) => { setResult(testResult); setPhase("result"); }}
            />
          )}
          {phase === "result" && result && (
            <ResultPhase result={result} onFinish={onFinished} />
          )}
        </div>
      </div>
    </div>
  );
}
