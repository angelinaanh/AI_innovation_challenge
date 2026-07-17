import { useState } from "react";
import { Check, GripVertical, X } from "lucide-react";

// Presentational, controlled inputs for the four exercise types.
// Each receives { payload, value, onChange, disabled, solution } and reports a
// response object shaped exactly as the server grader expects.

export function ExerciseMCQ({ payload, value, onChange, disabled, solution }) {
  return (
    <div className="ex-options" role="radiogroup" aria-label={payload.prompt}>
      {payload.options.map((option, index) => {
        const selected = value.selectedIndex === index;
        const isAnswer = solution && solution.correctIndex === index;
        const wrongPick = solution && selected && !isAnswer;
        const cls = [
          "ex-option",
          selected && !solution ? "ex-option-selected" : "",
          isAnswer ? "ex-option-correct" : "",
          wrongPick ? "ex-option-wrong" : "",
        ].filter(Boolean).join(" ");
        return (
          <button
            key={index}
            type="button"
            role="radio"
            aria-checked={selected}
            className={cls}
            disabled={disabled}
            onClick={() => onChange({ selectedIndex: index })}
          >
            <span className="ex-option-letter">{String.fromCharCode(65 + index)}</span>
            <span className="flex-1 text-left">{option}</span>
            {isAnswer && <Check size={16} />}
          </button>
        );
      })}
    </div>
  );
}

export function ExerciseMatching({ payload, value, onChange, disabled, solution }) {
  const [picked, setPicked] = useState(null);
  const pairs = value.pairs || {};
  const usedRightIds = new Set(Object.values(pairs));
  const rightById = new Map(payload.right.map((entry) => [entry.id, entry]));
  const pool = payload.right.filter((entry) => !usedRightIds.has(entry.id));

  function assign(leftId, rightId) {
    if (disabled || !rightId) return;
    const next = {};
    for (const [key, val] of Object.entries(pairs)) {
      if (val !== rightId) next[key] = val;
    }
    next[leftId] = rightId;
    onChange({ pairs: next });
    setPicked(null);
  }
  function clear(leftId) {
    if (disabled) return;
    const next = { ...pairs };
    delete next[leftId];
    onChange({ pairs: next });
  }

  return (
    <div className="ex-match">
      <div className="ex-match-col">
        {payload.left.map((left) => {
          const placedId = pairs[left.id];
          const placed = placedId ? rightById.get(placedId) : null;
          const correct = solution && solution.pairs?.[left.id] === placedId && placedId;
          const wrong = solution && placedId && solution.pairs?.[left.id] !== placedId;
          return (
            <div key={left.id} className="ex-match-row">
              <span className="ex-match-left">{left.label}</span>
              <div
                className={`ex-slot ${placed ? "ex-slot-filled" : ""} ${correct ? "ex-slot-correct" : ""} ${wrong ? "ex-slot-wrong" : ""}`}
                onDragOver={(event) => !disabled && event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  assign(left.id, event.dataTransfer.getData("text/plain"));
                }}
                onClick={() => picked && assign(left.id, picked)}
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-label={placed ? `${left.label}: ${placed.label}` : `Ô cho ${left.label}`}
                onKeyDown={(event) => {
                  if ((event.key === "Enter" || event.key === " ") && picked) {
                    event.preventDefault();
                    assign(left.id, picked);
                  }
                }}
              >
                {placed ? (
                  <span className="ex-chip-placed">
                    {placed.label}
                    {!disabled && (
                      <button type="button" aria-label="Bỏ ghép" onClick={(event) => { event.stopPropagation(); clear(left.id); }}>
                        <X size={13} />
                      </button>
                    )}
                    {solution && (correct ? <Check size={13} /> : <X size={13} />)}
                  </span>
                ) : (
                  <span className="ex-slot-hint">thả vào đây</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {!disabled && (
        <div className="ex-chip-pool" aria-label="Kéo hoặc chọn rồi đặt vào ô">
          {pool.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`ex-chip ${picked === entry.id ? "ex-chip-picked" : ""}`}
              draggable
              onDragStart={(event) => event.dataTransfer.setData("text/plain", entry.id)}
              onClick={() => setPicked((current) => (current === entry.id ? null : entry.id))}
              aria-pressed={picked === entry.id}
            >
              <GripVertical size={13} /> {entry.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ExerciseOrdering({ payload, value, onChange, disabled, solution }) {
  const order = value.order || payload.items.map((item) => item.id);
  const labelById = new Map(payload.items.map((item) => [item.id, item.label]));

  function move(index, delta) {
    const target = index + delta;
    if (disabled || target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ order: next });
  }
  function drop(fromIndex, toIndex) {
    if (disabled || fromIndex === toIndex) return;
    const next = [...order];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onChange({ order: next });
  }

  return (
    <ol className="ex-order">
      {order.map((id, index) => {
        const correct = solution && solution.correctOrder?.[index] === id;
        const wrong = solution && !correct;
        return (
          <li
            key={id}
            className={`ex-order-item ${correct ? "ex-slot-correct" : ""} ${wrong ? "ex-slot-wrong" : ""}`}
            draggable={!disabled}
            onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
            onDragOver={(event) => !disabled && event.preventDefault()}
            onDrop={(event) => { event.preventDefault(); drop(Number(event.dataTransfer.getData("text/plain")), index); }}
          >
            <span className="ex-order-index">{index + 1}</span>
            {!disabled && <GripVertical size={14} className="text-slate-400" />}
            <span className="flex-1">{labelById.get(id)}</span>
            {solution && (correct ? <Check size={14} /> : <X size={14} />)}
            {!disabled && (
              <span className="ex-order-move">
                <button type="button" aria-label="Lên" onClick={() => move(index, -1)} disabled={index === 0}>↑</button>
                <button type="button" aria-label="Xuống" onClick={() => move(index, 1)} disabled={index === order.length - 1}>↓</button>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function ExerciseCloze({ payload, value, onChange, disabled, solution }) {
  const answers = value.answers || {};
  const parts = payload.text.split(/(\{\{\w+\}\})/g);
  const blankById = new Map(payload.blanks.map((blank) => [blank.id, blank]));

  function setBlank(id, val) {
    onChange({ answers: { ...answers, [id]: val } });
  }

  return (
    <p className="ex-cloze">
      {parts.map((part, index) => {
        const match = part.match(/^\{\{(\w+)\}\}$/);
        if (!match) return <span key={index}>{part}</span>;
        const id = match[1];
        const blank = blankById.get(id) || {};
        const correct = solution && solution.answers?.[id];
        const status = solution
          ? (String(answers[id] || "").trim().toLowerCase() === String(correct || "").toLowerCase()
            ? "ex-slot-correct" : "ex-slot-wrong")
          : "";
        if (blank.options?.length) {
          return (
            <select
              key={index}
              className={`ex-cloze-select ${status}`}
              value={answers[id] || ""}
              disabled={disabled}
              onChange={(event) => setBlank(id, event.target.value)}
              aria-label={`Chỗ trống ${id}`}
            >
              <option value="">— chọn —</option>
              {blank.options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          );
        }
        return (
          <input
            key={index}
            className={`ex-cloze-input ${status}`}
            value={answers[id] || ""}
            disabled={disabled}
            onChange={(event) => setBlank(id, event.target.value)}
            aria-label={`Chỗ trống ${id}`}
          />
        );
      })}
    </p>
  );
}
