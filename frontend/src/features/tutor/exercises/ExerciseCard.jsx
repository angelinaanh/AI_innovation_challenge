import { useState } from "react";
import { CheckCircle2, HelpCircle, LoaderCircle, PartyPopper, Send, Sparkles, XCircle } from "lucide-react";

import { exerciseApi } from "../../../lib/exerciseApi.js";
import {
  ExerciseCloze,
  ExerciseMCQ,
  ExerciseMatching,
  ExerciseOrdering,
} from "./ExerciseInputs.jsx";

const TYPE_META = {
  mcq: { label: "Trắc nghiệm", icon: "list" },
  matching: { label: "Nối cột", icon: "shuffle" },
  ordering: { label: "Sắp thứ tự", icon: "sort" },
  cloze: { label: "Điền khuyết", icon: "cloze" },
};

function initialResponse(exercise) {
  if (exercise.type === "mcq") return { selectedIndex: null };
  if (exercise.type === "matching") return { pairs: {} };
  if (exercise.type === "ordering") return { order: exercise.items.map((item) => item.id) };
  return { answers: {} };
}

function isAnswerable(exercise, response) {
  if (exercise.type === "mcq") return Number.isInteger(response.selectedIndex);
  if (exercise.type === "matching") return Object.keys(response.pairs).length === exercise.left.length;
  if (exercise.type === "ordering") return true;
  return exercise.blanks.every((blank) => String(response.answers[blank.id] || "").trim().length > 0);
}

export function ExerciseCard({ exercise, onAskTutor }) {
  const [response, setResponse] = useState(() => initialResponse(exercise));
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [promoted, setPromoted] = useState(false);

  const meta = TYPE_META[exercise.type] || { label: "Bài luyện" };
  const disabled = Boolean(result);
  const Input = {
    mcq: ExerciseMCQ,
    matching: ExerciseMatching,
    ordering: ExerciseOrdering,
    cloze: ExerciseCloze,
  }[exercise.type];

  async function check() {
    if (busy || !isAnswerable(exercise, response)) return;
    setBusy(true);
    setError(null);
    try {
      const data = await exerciseApi.submit(exercise.id, response);
      setResult(data);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  async function promote() {
    if (busy) return;
    setBusy(true);
    try {
      await exerciseApi.promote(exercise.id);
      setPromoted(true);
    } catch (promoteError) {
      setError(promoteError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ex-card" aria-label={`Bài luyện ${meta.label}`}>
      <header className="ex-card-head">
        <span className="ex-card-kind"><Sparkles size={14} /> {meta.label}</span>
        <span className="ex-card-tag">Bài luyện · không tính điểm</span>
      </header>
      <p className="ex-card-prompt">{exercise.prompt}</p>

      <Input
        payload={exercise}
        value={response}
        onChange={setResponse}
        disabled={disabled}
        solution={result?.solution}
      />

      {error && <p className="ex-card-error" role="alert">{error}</p>}

      {!result ? (
        <button className="primary-button mt-3 w-full" onClick={check} disabled={busy || !isAnswerable(exercise, response)}>
          {busy ? <LoaderCircle className="animate-spin" size={17} /> : <CheckCircle2 size={17} />} Kiểm tra
        </button>
      ) : (
        <div className={`ex-result ${result.isCorrect ? "ex-result-correct" : "ex-result-wrong"}`}>
          <div className="flex items-center gap-2 font-black">
            {result.isCorrect ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
            {result.isCorrect ? "Chính xác!" : `Đúng ${Math.round(result.score * 100)}% — xem lại nhé`}
            {result.award && <span className="ex-exp-chip"><PartyPopper size={13} /> +{result.award.xp} EXP</span>}
          </div>
          {result.explanation && <p className="mt-2 text-sm leading-6">{result.explanation}</p>}
          {!result.isCorrect && onAskTutor && (
            <button
              className="secondary-button mt-3 w-full"
              onClick={() => onAskTutor(`Vì sao mình chưa trả lời đúng câu: "${exercise.prompt}"? Giải thích dựa trên bài học.`)}
            >
              <HelpCircle size={15} /> Vì sao mình sai?
            </button>
          )}
          {result.canPromote && !promoted && (
            <button className="secondary-button mt-3 w-full" onClick={promote} disabled={busy}>
              <Send size={15} /> Gửi giáo viên duyệt thành câu hỏi thật
            </button>
          )}
          {promoted && (
            <p className="mt-3 flex items-center gap-2 text-xs font-black text-emerald-700">
              <CheckCircle2 size={15} /> Đã gửi cho giáo viên xét duyệt
            </p>
          )}
        </div>
      )}
    </section>
  );
}
