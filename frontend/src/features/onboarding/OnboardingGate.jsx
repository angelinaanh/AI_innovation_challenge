import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, X, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";

import { api } from "../../lib/apiClient.js";
import { RadarProfile } from "../student-dashboard/RadarProfile.jsx";
import {
  MultipleSelectQuestion,
  OrderingQuestion,
  DragDropQuestion,
  HotspotQuestion,
  NumericInputQuestion,
} from "./InteractiveQuestions.jsx";

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
  const [state, setState] = useState({ loading: true, testId: null, questions: [], gradeLevel: null, limitMinutes: 0 });
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Auto-save logic
  useEffect(() => {
    if (state.testId && Object.keys(answers).length > 0) {
      localStorage.setItem(`placement_${state.testId}`, JSON.stringify(answers));
    }
  }, [answers, state.testId]);

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
        setState({ 
          loading: false, 
          testId: result.testId, 
          questions: result.questions, 
          gradeLevel: result.gradeLevel, 
          limitMinutes: result.limitMinutes || 45 
        });
        setTimeLeft((result.limitMinutes || 45) * 60);

        // Load saved answers
        const saved = localStorage.getItem(`placement_${result.testId}`);
        if (saved) {
          try { setAnswers(JSON.parse(saved)); } catch(e) {}
        }
      } catch (loadError) {
        if (active) setError(loadError.message || "Mình chưa tạo được bài, bạn thử lại nhé 😊");
      }
    })();
    return () => { active = false; };
  }, [onComplete]);

  useEffect(() => {
    if (state.loading || timeLeft <= 0 || submitting) return;
    if (state.gradeLevel <= 2 && !surveyCompleted) return; // Không đếm giờ khi đang làm khảo sát

    const timerId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerId);
          submit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerId);
  }, [state.loading, timeLeft, submitting, state.gradeLevel, surveyCompleted]);

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
      localStorage.removeItem(`placement_${state.testId}`);
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

  if (state.gradeLevel <= 2 && !surveyCompleted) {
    return (
      <div className="flex min-h-[360px] flex-col justify-center">
        <h3 className="mb-4 text-xl font-bold text-slate-800 text-center">Khảo sát dành cho Phụ huynh</h3>
        <p className="text-sm text-slate-600 mb-6 text-center">Để bài đánh giá chính xác hơn, EduOne cần tìm hiểu thói quen của bé.</p>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Bé nhà mình thích chơi trò chơi nào nhất?</label>
            <input type="text" className="auth-input w-full p-3" placeholder="Ví dụ: Xếp hình, vẽ tranh..." />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Bé có thể tập trung tối đa bao lâu?</label>
            <select className="auth-input w-full p-3">
              <option>Dưới 10 phút</option>
              <option>10 - 20 phút</option>
              <option>Hơn 20 phút</option>
            </select>
          </div>
        </div>
        <button className="auth-primary-button" onClick={() => setSurveyCompleted(true)}>Hoàn thành & Bắt đầu Test</button>
      </div>
    );
  }

  const total = state.questions.length;
  const question = state.questions[index];
  if (!question) {
    return (
      <div className="grid min-h-[360px] place-items-center text-slate-500">
        <p className="text-sm font-bold text-rose-500">Lỗi: Không tìm thấy dữ liệu câu hỏi. Vui lòng thử lại.</p>
      </div>
    );
  }
  const answeredCount = Object.keys(answers).length;
  const selected = answers[question.id];
  const isLast = index === total - 1;

  function choose(optionIndex) {
    setAnswers({ ...answers, [question.id]: { selectedIndex: optionIndex } });
  }

  function toggleTrueFalse(clauseIndex, value) {
    const currentValues = selected?.textAnswer ? selected.textAnswer.split(',') : ["","","",""];
    currentValues[clauseIndex] = value.toString();
    setAnswers({ ...answers, [question.id]: { textAnswer: currentValues.join(',') } });
  }

  function typeText(text) {
    setAnswers({ ...answers, [question.id]: { textAnswer: text } });
  }

  const isAnswered = (() => {
    if (!selected) return false;
    if (question.type === "true_false_cluster") {
      const vals = selected.textAnswer ? selected.textAnswer.split(',') : [];
      return vals.filter(v => v === "true" || v === "false").length === (question.options?.length || 4);
    }
    return selected.selectedIndex !== undefined || (selected.textAnswer && selected.textAnswer.trim().length > 0);
  })();

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Determine Eco-School stages if 50 questions
  const isEcoSchool = total === 50 && state.gradeLevel >= 6 && state.gradeLevel <= 9;
  const ecoStageNames = [
    "Nhiệm vụ 1: Khảo sát",
    "Nhiệm vụ 2: Thiết kế Hệ thống",
    "Nhiệm vụ 3: Cảnh quan & Trực quan",
    "Nhiệm vụ 4: Vận hành & Xử lý"
  ];

  // Determine High School stages if 70 questions
  const isHighSchool = total === 70 && state.gradeLevel >= 10;
  const highStageNames = [
    "Phần 1: Nền tảng Học thuật",
    "Phần 2: Phân tích Đa chiều",
    "Phần 3: Vận dụng Định lượng"
  ];

  let currentStageName = "";
  if (isEcoSchool) {
    if (index < 15) currentStageName = ecoStageNames[0];
    else if (index < 30) currentStageName = ecoStageNames[1];
    else if (index < 40) currentStageName = ecoStageNames[2];
    else currentStageName = ecoStageNames[3];
  } else if (isHighSchool) {
    if (index < 35) currentStageName = highStageNames[0];
    else if (index < 55) currentStageName = highStageNames[1];
    else currentStageName = highStageNames[2];
  }

  return (
    <div className="flex min-h-[360px] flex-col">
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 mb-2">
          <div className="flex flex-col gap-1">
            {(isEcoSchool || isHighSchool) && (
              <span className="text-emerald-600 font-black uppercase">{currentStageName}</span>
            )}
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                Câu {index + 1} / {total} · {AXIS_LABEL[question.steamAxis] || question.steamAxis}
              </span>
              {state.limitMinutes > 0 && (
                <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 ${timeLeft < 300 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                  <Clock size={14} /> {formatTime(timeLeft)}
                </span>
              )}
            </div>
          </div>
          <span>Đã trả lời {answeredCount}/{total}</span>
        </div>
        <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-[width] duration-500"
            style={{ width: `${(answeredCount / total) * 100}%` }}
          />
        </div>
      </div>

      {question.type === "interactive_visual" && question.imageUrl ? (
        <div className="mb-4 overflow-hidden rounded-xl border border-slate-200">
          <iframe src={question.imageUrl} className="w-full h-[400px] border-none" title="Mô phỏng PhET" />
        </div>
      ) : question.imageUrl ? (
        <div className="mb-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
          <img src={question.imageUrl} alt="Minh họa" className="max-h-48 w-full object-contain mix-blend-multiply" />
        </div>
      ) : null}
      
      <p className="font-display mb-4 text-[17px] font-bold leading-snug text-slate-900 whitespace-pre-wrap">{question.body}</p>
      
      {question.type === "true_false_cluster" ? (
        <div className="space-y-3">
          {question.options.map((clause, clauseIndex) => {
            const currentVals = selected?.textAnswer ? selected.textAnswer.split(',') : [];
            const val = currentVals[clauseIndex];
            return (
              <div key={clauseIndex} className="p-3 border-2 border-slate-200 rounded-xl bg-white shadow-sm flex flex-col gap-2">
                <p className="text-sm font-semibold text-slate-700">{clause}</p>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => toggleTrueFalse(clauseIndex, true)} className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition ${val === "true" ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-500" : "bg-slate-50 text-slate-500 border-2 border-transparent hover:bg-slate-100"}`}>Đúng</button>
                  <button type="button" onClick={() => toggleTrueFalse(clauseIndex, false)} className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition ${val === "false" ? "bg-rose-100 text-rose-700 border-2 border-rose-500" : "bg-slate-50 text-slate-500 border-2 border-transparent hover:bg-slate-100"}`}>Sai</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : question.type === "multiple_select" ? (
        <MultipleSelectQuestion question={question} selectedAnswer={selected?.textAnswer} onChange={typeText} />
      ) : question.type === "ordering" ? (
        <OrderingQuestion question={question} selectedAnswer={selected?.textAnswer} onChange={typeText} />
      ) : question.type === "drag_drop" ? (
        <DragDropQuestion question={question} selectedAnswer={selected?.textAnswer} onChange={typeText} />
      ) : question.type === "hotspot" ? (
        <HotspotQuestion question={question} selectedAnswer={selected?.textAnswer} onChange={typeText} />
      ) : question.type === "fill_blank" && isHighSchool ? (
        <NumericInputQuestion question={question} selectedAnswer={selected?.textAnswer} onChange={typeText} />
      ) : question.type === "mcq" || question.type === "interactive_visual" || !question.type ? (
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
  const [showReview, setShowReview] = useState(false);
  const radar = result.radar || {};
  const insights = radar.insights || [];
  const adaptivePaths = radar.adaptivePaths || [];

  return (
    <div className="flex min-h-[360px] flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[15px] font-black text-emerald-700">
          <Sparkles size={18} /> Phân tích Năng lực STEAM
        </div>
        <div className="flex items-center gap-2 text-xs font-black">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            Tỷ lệ đúng: {result.scorePercent}% ({result.totalCorrect}/{result.totalQuestions})
          </span>
          {result.steam_result?.gpa_10_scale !== undefined && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800 border border-emerald-200">
              GPA Năng lực: {result.steam_result.gpa_10_scale}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-2">
        <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm flex items-center justify-center">
          <RadarProfile profile={result.steam} proficiency={result.proficiency} />
        </div>
        
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Nhận xét tự động (Insights Engine)</p>
          {insights.map((insight, idx) => (
            <div key={idx} className={`rounded-xl border p-3 text-sm leading-relaxed shadow-sm ${
              insight.type === "Điểm mạnh" ? "bg-emerald-50 border-emerald-100 text-emerald-800" :
              insight.type === "Đạt chuẩn" ? "bg-blue-50 border-blue-100 text-blue-800" :
              "bg-rose-50 border-rose-100 text-rose-800"
            }`}>
              <div className="font-bold flex items-center gap-1.5 mb-1">
                {insight.domain} ({insight.axis}) - {insight.score}% 
                <span className="text-[11px] px-2 py-0.5 rounded bg-white/50">{insight.type}</span>
              </div>
              <p className="opacity-90">{insight.text}</p>
            </div>
          ))}
        </div>
      </div>

      {adaptivePaths.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-4 text-[15px] font-black text-slate-800">Lộ Trình Cải Thiện Đề Xuất</h3>
          <div className="space-y-4">
            {adaptivePaths.map((path, idx) => (
              <div key={idx} className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm">
                <div className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                  <span className="bg-amber-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">!</span>
                  Mục tiêu ưu tiên: Cải thiện {path.domain} ({path.axis})
                </div>
                <p className="text-sm text-amber-700 mb-4 font-medium">{path.reason}</p>
                <div className="space-y-2">
                  {path.tasks.map((task, tIdx) => (
                    <div key={tIdx} className="flex items-start gap-2 bg-white rounded-lg p-3 text-sm text-slate-700 font-medium shadow-sm border border-amber-100">
                      <div className="w-5 h-5 rounded border-2 border-amber-300 mt-0.5 shrink-0" />
                      {task}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.questionDetails && result.questionDetails.length > 0 && (
        <div className="mt-8">
          <button 
            onClick={() => setShowReview(!showReview)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition"
          >
            {showReview ? "Đóng chi tiết bài chữa" : "Xem chi tiết bài chữa (Review Mode)"}
          </button>
          
          {showReview && (
            <div className="space-y-4 mt-4">
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
          )}
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
