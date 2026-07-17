import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  XCircle,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import { api } from "../../lib/apiClient.js";

export function QuizPanel({ question, hints, onProgressUpdated }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [visibleHintCount, setVisibleHintCount] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    startedAt.current = Date.now();
    setSelectedIndex(null);
    setVisibleHintCount(0);
    setResult(null);
    setError(null);
  }, [question?.id]);

  if (!question) {
    return (
      <section className="surface p-7 text-center">
        <p className="text-lg font-black text-slate-800">Bài kiểm tra đang được giáo viên hoàn thiện.</p>
        <Link to="/student/path" className="primary-button mt-5">Về lộ trình</Link>
      </section>
    );
  }

  async function submit() {
    if (selectedIndex === null || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await api.submitAttempt({
        questionId: question.id,
        answerIndex: selectedIndex,
        usedHint: visibleHintCount > 0,
        durationMs: Date.now() - startedAt.current,
      });
      setResult(response);
      if (response.isCorrect) onProgressUpdated?.(response);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  function selectAnswer(index) {
    if (result?.isCorrect) return;
    setSelectedIndex(index);
    setResult(null);
    setError(null);
  }

  return (
    <section className="surface overflow-hidden" aria-labelledby="quiz-title">
      <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50 to-sky-50 px-5 py-5 md:px-7">
        <div className="flex items-center gap-2 text-xs font-black uppercase text-violet-700">
          <Sparkles size={16} /> Kiểm tra nhanh
        </div>
        <h2 id="quiz-title" className="mt-2 text-2xl font-black text-slate-950 md:text-3xl">
          Chọn cách dùng vòng lặp tốt nhất
        </h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">Chọn một đáp án. Sai cũng không mất XP.</p>
      </div>

      <div className="px-5 py-6 md:px-7 md:py-7">
        <p className="text-lg font-black leading-7 text-slate-900">{question.body}</p>
        <div className="mt-5 space-y-3" role="radiogroup" aria-label="Các đáp án">
          {question.options.map((option, index) => (
            <button
              key={option}
              className={`quiz-option ${selectedIndex === index ? "quiz-option-selected" : ""}`}
              role="radio"
              aria-checked={selectedIndex === index}
              onClick={() => selectAnswer(index)}
              disabled={Boolean(result?.isCorrect)}
            >
              <span className="quiz-option-letter">{String.fromCharCode(65 + index)}</span>
              <span>{option}</span>
            </button>
          ))}
        </div>

        {Array.isArray(hints) && hints.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-black text-amber-700">
                <Lightbulb size={18} /> Gợi ý từng tầng
              </div>
              {visibleHintCount < hints.length && !result?.isCorrect && (
                <button
                  className="hint-button"
                  onClick={() => setVisibleHintCount((count) => Math.min(hints.length, count + 1))}
                >
                  Mở gợi ý {visibleHintCount + 1}
                </button>
              )}
            </div>
            {visibleHintCount > 0 && (
              <ol className="mt-4 space-y-2">
                {hints.slice(0, visibleHintCount).map((hint, index) => (
                  <li key={hint} className="hint-row">
                    <span>{index + 1}</span><p>{hint}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {result && (
          <div className={`quiz-feedback ${result.isCorrect ? "quiz-feedback-correct" : "quiz-feedback-wrong"}`} role="status">
            {result.isCorrect ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
            <div>
              <p className="font-black">{result.isCorrect ? "Chính xác" : "Thử lại nhé"}</p>
              <p className="mt-1 text-sm font-semibold leading-6">{result.feedback}</p>
              {result.award && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="reward-chip"><Zap size={14} /> +{result.award.xp} XP</span>
                  {Object.entries(result.award.steamDelta).map(([axis, value]) => (
                    <span key={axis} className="reward-chip">+{value} {axis}</span>
                  ))}
                </div>
              )}
              {result.pathUpdate?.recommendation && (
                <p className="mt-3 text-sm font-black text-emerald-800">
                  Bước tiếp theo đã mở: {result.pathUpdate.recommendation.name}
                </p>
              )}
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm font-bold text-rose-600" role="alert">{error}</p>}

        <div className="mt-7 flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-5">
          {result?.isCorrect ? (
            <Link to="/student/path" className="primary-button">
              Xem lộ trình mới <ArrowRight size={17} />
            </Link>
          ) : (
            <>
              {result && !result.isCorrect ? (
                <button className="secondary-button" onClick={() => setResult(null)}>
                  <RotateCcw size={16} /> Thử lại
                </button>
              ) : <span />}
              <button
                className="primary-button"
                onClick={submit}
                disabled={selectedIndex === null || submitting}
              >
                {submitting ? <LoaderCircle className="animate-spin" size={17} /> : <CheckCircle2 size={17} />}
                Kiểm tra đáp án
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
