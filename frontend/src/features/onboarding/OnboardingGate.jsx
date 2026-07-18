import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, X, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

import { api } from "../../lib/apiClient.js";
import { RadarProfile } from "../student-dashboard/RadarProfile.jsx";

const AXIS_LABEL = { S: "Khoa học", T: "Công nghệ", E: "Kỹ thuật", A: "Nghệ thuật", M: "Toán học" };
const BRAND_GRADIENT = { background: "var(--gradient-brand)" };

function BotAvatar({ type = "header", size = 40 }) {
  if (type === "chat") {
    return (
      <div
        className="grid shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700"
        style={{ width: size, height: size }}
      >
        <Bot size={size * 0.55} strokeWidth={2.4} />
      </div>
    );
  }
  
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#004e92] to-[#000428] text-white shadow-sm"
      style={{ width: size, height: size }}
    >
      <Bot size={size * 0.55} strokeWidth={2.4} />
    </div>
  );
}

function ChatBubble({ role, content }) {
  const isAssistant = role === "assistant";
  return (
    <div className={`flex items-end gap-3 w-full ${isAssistant ? "justify-start" : "justify-end"}`}>
      {isAssistant && <BotAvatar type="chat" size={32} />}
      <div
        className={`px-5 py-3 text-[15px] leading-relaxed shadow-sm ${
          isAssistant
            ? "rounded-2xl rounded-bl-sm bg-white text-slate-700 border border-slate-100 max-w-[85%]"
            : "rounded-2xl rounded-br-sm bg-emerald-600 font-semibold text-white max-w-[78%]"
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
    <div className="flex h-full flex-col bg-slate-50 rounded-b-[30px] p-2 md:p-6">
      <div ref={scrollRef} className="min-h-[320px] flex-1 space-y-4 overflow-y-auto px-2 py-4">
        {messages.map((message, index) => <ChatBubble key={index} {...message} />)}
        {busy && (
          <div className="flex items-center gap-2 pl-1 text-sm text-slate-400">
            <Loader2 size={16} className="animate-spin" /> Trợ lý đang trả lời...
          </div>
        )}
      </div>
      {error && <p className="px-2 pb-2 text-xs font-bold text-rose-500">{error}</p>}
      <form className="mt-4 flex flex-col items-center gap-3 relative" onSubmit={submit}>
        <div className="relative w-full">
          <input
            className="w-full h-14 rounded-full border-none bg-white pl-6 pr-14 text-[15px] shadow-sm outline-none ring-1 ring-slate-200 transition focus:ring-2 focus:ring-emerald-500"
            placeholder="Nhập câu trả lời của bạn..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={busy}
            autoFocus
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40"
            disabled={busy || !input.trim()}
            aria-label="Gửi"
          >
            <Send size={18} className="mr-0.5" />
          </button>
        </div>
        <p className="text-[11px] font-semibold text-slate-400">Sử dụng phím Enter để gửi nhanh</p>
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
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Nhận xét tổng quan từ Giáo viên AI</p>
          {result.feedbacks.map((fb, idx) => (
            <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm leading-6 text-slate-700 shadow-sm">
              <Sparkles size={14} className="mb-1 inline-block text-amber-500" /> {fb}
            </div>
          ))}
        </div>
      )}

      {result.questionDetails && result.questionDetails.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 text-[15px] font-black text-slate-800">Chi tiết Bài kiểm tra</h3>
          <div className="space-y-4">
            {result.questionDetails.map((q, idx) => (
              <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {q.isCorrect ? (
                      <CheckCircle2 className="text-emerald-500" size={22} />
                    ) : (
                      <XCircle className="text-rose-500" size={22} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm leading-relaxed">
                      <span className="text-slate-500 mr-1">Câu {idx + 1}:</span> {q.body}
                    </p>
                    
                    <div className="mt-2.5 text-sm">
                      <span className="font-semibold text-slate-600">Đã trả lời: </span>
                      {q.type === "mcq" || !q.type ? (
                        q.options?.[q.selectedIndex] ? (
                          <span className={q.isCorrect ? "text-emerald-700 font-medium" : "text-rose-600 font-medium"}>
                            {q.options[q.selectedIndex]}
                          </span>
                        ) : (
                          <span className="italic text-slate-400">Không chọn</span>
                        )
                      ) : (
                        q.textAnswer ? (
                          <span className="text-slate-700 font-medium">"{q.textAnswer}"</span>
                        ) : (
                          <span className="italic text-slate-400">Bỏ trống</span>
                        )
                      )}
                    </div>

                    {(q.explanation || q.formativeFeedback) && (
                      <div className="mt-3.5 rounded-xl bg-[#f8fafc] border border-slate-100 p-3.5 text-sm leading-relaxed text-slate-700">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-600 mb-1.5">
                          <AlertCircle size={16} />
                          Giải thích
                        </div>
                        {q.formativeFeedback ? (
                          <div className="mb-2"><span className="font-semibold text-slate-600">Giáo viên AI: </span>{q.formativeFeedback}</div>
                        ) : null}
                        {q.explanation && (
                          <div>{q.explanation}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="auth-primary-button mt-8" type="button" onClick={onFinish}>
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
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-[32px] bg-gradient-to-br from-[#e0f2fe] via-white to-[#fef3c7] p-[2px] shadow-2xl">
        <div className="flex h-full flex-col overflow-hidden rounded-[30px] bg-white">
          <div className="flex items-center justify-between px-6 py-5 md:px-8">
            <div className="flex items-center gap-4">
              <BotAvatar type="header" size={48} />
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-emerald-700 mb-0.5">Trợ lý EduOne</p>
                <h2 className="font-display text-[22px] font-bold leading-tight text-slate-900">{TITLES[phase]}</h2>
              </div>
            </div>
            <button 
              onClick={() => onFinished && onFinished()} 
              className="text-slate-400 hover:text-slate-700 transition"
              aria-label="Đóng"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-50">
            {phase === "chat" && <ChatPhase onComplete={() => setPhase("test")} />}
            {phase === "test" && (
              <div className="p-6 md:p-8">
                <TestPhase
                  onComplete={(testResult) => { setResult(testResult); setPhase("result"); }}
                />
              </div>
            )}
            {phase === "result" && result && (
              <div className="p-6 md:p-8">
                <ResultPhase result={result} onFinish={onFinished} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
