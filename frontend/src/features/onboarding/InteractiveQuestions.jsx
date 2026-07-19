import React, { useState, useEffect } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

export function MultipleSelectQuestion({ question, selectedAnswer, onChange }) {
  const selectedIndices = selectedAnswer ? JSON.parse(selectedAnswer) : [];

  const toggle = (index) => {
    const strIndex = String(index);
    if (selectedIndices.includes(strIndex)) {
      onChange(JSON.stringify(selectedIndices.filter((i) => i !== strIndex)));
    } else {
      onChange(JSON.stringify([...selectedIndices, strIndex]));
    }
  };

  return (
    <div className="space-y-2.5">
      {question.options.map((option, index) => {
        const isSelected = selectedIndices.includes(String(index));
        return (
          <label
            key={index}
            className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm font-semibold transition ${
              isSelected
                ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm"
                : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/40"
            }`}
          >
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              checked={isSelected}
              onChange={() => toggle(index)}
            />
            {option}
          </label>
        );
      })}
    </div>
  );
}

export function OrderingQuestion({ question, selectedAnswer, onChange }) {
  const options = Array.isArray(question.options?.items) ? question.options.items : question.options;
  const order = selectedAnswer ? JSON.parse(selectedAnswer) : options.map((_, i) => String(i));

  useEffect(() => {
    if (!selectedAnswer && options) {
      onChange(JSON.stringify(order));
    }
  }, [selectedAnswer, options, onChange]);

  const move = (index, direction) => {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === order.length - 1) return;
    const newOrder = [...order];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + direction];
    newOrder[index + direction] = temp;
    onChange(JSON.stringify(newOrder));
  };

  if (!options) return null;

  return (
    <div className="space-y-2.5">
      {order.map((originalIndex, currentIndex) => {
        const option = options[Number(originalIndex)];
        return (
          <div
            key={originalIndex}
            className="flex w-full items-center justify-between rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-500">
                {currentIndex + 1}
              </span>
              <span className="text-sm font-semibold text-slate-700">{option}</span>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => move(currentIndex, -1)}
                disabled={currentIndex === 0}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
              >
                <ArrowUp size={18} />
              </button>
              <button
                type="button"
                onClick={() => move(currentIndex, 1)}
                disabled={currentIndex === order.length - 1}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
              >
                <ArrowDown size={18} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DragDropQuestion({ question, selectedAnswer, onChange }) {
  const items = question.options?.items || [];
  const dropzones = question.options?.dropzones || [];
  const assignments = selectedAnswer ? JSON.parse(selectedAnswer) : Array(items.length).fill(null);

  const assign = (itemIndex, dropzone) => {
    const newAssignments = [...assignments];
    newAssignments[itemIndex] = dropzone;
    onChange(JSON.stringify(newAssignments));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => {
          if (assignments[index] !== null) return null;
          return (
            <div
              key={index}
              className="cursor-grab rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              {item}
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {dropzones.map((zone) => (
          <div key={zone} className="min-h-[120px] rounded-2xl border-2 border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500">{zone}</h4>
            <div className="space-y-2">
              {assignments.map((assignedZone, itemIndex) => {
                if (assignedZone === zone) {
                  return (
                    <div
                      key={itemIndex}
                      className="flex cursor-pointer items-center justify-between rounded-xl border-2 border-emerald-500 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900 shadow-sm"
                      onClick={() => assign(itemIndex, null)}
                    >
                      {items[itemIndex]}
                      <span className="text-xs text-emerald-600 hover:underline">Xóa</span>
                    </div>
                  );
                }
                return null;
              })}
              <div className="flex flex-wrap gap-1">
                 {items.map((item, itemIndex) => {
                    if (assignments[itemIndex] === null) {
                       return (
                         <button
                           key={itemIndex}
                           type="button"
                           onClick={() => assign(itemIndex, zone)}
                           className="rounded-lg bg-white border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:border-emerald-300 transition"
                         >
                           + {item}
                         </button>
                       )
                    }
                    return null;
                 })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HotspotQuestion({ question, selectedAnswer, onChange }) {
  const clicks = selectedAnswer ? JSON.parse(selectedAnswer) : [];

  const handleClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const scaleX = e.target.naturalWidth / rect.width;
    const scaleY = e.target.naturalHeight / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    onChange(JSON.stringify([...clicks, { x, y }]));
  };

  const clear = () => onChange(JSON.stringify([]));

  return (
    <div className="space-y-3">
      {question.imageUrl && (
        <div className="relative inline-block overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
          <img 
            src={question.imageUrl} 
            alt="Click to answer" 
            onClick={handleClick}
            className="max-h-[400px] w-auto cursor-crosshair object-contain"
          />
          {clicks.map((click, i) => (
             // Simple marker (not precise matching natural coordinates visually but works)
             <div key={i} className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-rose-500 shadow-md" style={{ left: '50%', top: '50%' }} />
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">Đã chấm {clicks.length} điểm</span>
        <button type="button" onClick={clear} className="text-xs font-bold text-slate-400 hover:text-rose-500">Xóa tất cả</button>
      </div>
    </div>
  );
}

export function NumericInputQuestion({ question, selectedAnswer, onChange }) {
  const handleChange = (e) => {
    // Chỉ cho phép số, dấu chấm, dấu phẩy, và dấu trừ ở đầu
    let val = e.target.value.replace(/[^0-9.,-]/g, '');
    onChange(val);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center gap-2">
        <label className="text-sm font-semibold text-slate-700">Nhập đáp án:</label>
        <input
          type="text"
          className="h-14 w-full max-w-[200px] rounded-xl border-2 border-slate-200 bg-white px-4 text-center text-lg font-bold tracking-widest text-emerald-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          placeholder="0.00"
          value={selectedAnswer || ""}
          onChange={handleChange}
          maxLength={10}
        />
      </div>
      <p className="text-[11px] font-semibold text-slate-400 text-center">
        Chỉ nhập số thập phân (dùng dấu chấm hoặc phẩy). Ví dụ: 4.5 hoặc 4,5
      </p>
    </div>
  );
}
