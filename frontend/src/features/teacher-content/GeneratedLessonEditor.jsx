import {
  Calculator,
  ChevronDown,
  ChevronRight,
  Image,
  Lightbulb,
  ListChecks,
  PencilLine,
  Plus,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { useState } from "react";

// Metadata cho từng loại block (theo ai/prompts/create_leacturer.md).
// `fields` quyết định editor render ô nhập nào — mỗi type dùng field khác nhau.
const BLOCK_META = {
  text: {
    label: "Lý thuyết",
    icon: PencilLine,
    tone: "border-slate-200 bg-white",
    fields: [{ key: "content", label: "Nội dung", rows: 5 }],
  },
  formula: {
    label: "Công thức (LaTeX)",
    icon: Calculator,
    tone: "border-violet-200 bg-violet-50/50",
    fields: [{ key: "content", label: "Công thức LaTeX", rows: 2, mono: true }],
  },
  image_suggestion: {
    label: "Gợi ý hình ảnh",
    icon: Image,
    tone: "border-sky-200 bg-sky-50/50",
    fields: [{ key: "alt_text", label: "Mô tả hình ảnh cần chèn", rows: 2 }],
  },
  quick_practice: {
    label: "Luyện nhanh",
    icon: Target,
    tone: "border-emerald-200 bg-emerald-50/50",
    fields: [
      { key: "question", label: "Câu hỏi", rows: 2 },
      { key: "answer", label: "Đáp án", rows: 2 },
    ],
  },
  tip: {
    label: "Mẹo ghi nhớ",
    icon: Lightbulb,
    tone: "border-amber-200 bg-amber-50/50",
    fields: [{ key: "content", label: "Mẹo / lưu ý lỗi sai", rows: 3 }],
  },
};

const BLOCK_ORDER = ["text", "formula", "image_suggestion", "quick_practice", "tip"];

function emptyBlock(type) {
  return { type, content: "", alt_text: "", question: "", answer: "" };
}

function AutoTextarea({ label, value, onChange, rows = 3, mono = false }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-400">{label}</span>
      <textarea
        className={`auth-input min-h-0 resize-y px-3 py-2 text-sm leading-6 ${mono ? "font-mono text-xs" : ""}`}
        rows={rows}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function BlockCard({ block, onField, onRemove }) {
  const meta = BLOCK_META[block.type];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <div className={`space-y-2.5 rounded-lg border p-3 ${meta.tone}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-slate-500">
          <Icon size={14} />{meta.label}
        </span>
        <button type="button" className="icon-button inline-grid" aria-label="Xóa khối" title="Xóa khối" onClick={onRemove}>
          <Trash2 size={15} />
        </button>
      </div>
      {meta.fields.map((field) => (
        <AutoTextarea
          key={field.key}
          label={field.label}
          rows={field.rows}
          mono={field.mono}
          value={block[field.key]}
          onChange={(value) => onField(field.key, value)}
        />
      ))}
    </div>
  );
}

function QuizCard({ quiz, index, onQuestion, onOption, onRemove, onRemoveOption, onMarkCorrect }) {
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3.5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">Câu {index + 1}</span>
        <button type="button" className="icon-button inline-grid" aria-label="Xóa câu hỏi" title="Xóa câu hỏi" onClick={onRemove}>
          <Trash2 size={15} />
        </button>
      </div>
      <AutoTextarea label="Câu hỏi" rows={2} value={quiz.question} onChange={onQuestion} />
      <div className="space-y-2">
        {quiz.options.map((option, optionIndex) => (
          <div
            key={optionIndex}
            className={`space-y-2 rounded-lg border p-2.5 ${option.is_correct ? "border-emerald-300 bg-emerald-50/60" : "border-slate-200 bg-slate-50/60"}`}
          >
            <div className="flex items-center gap-2">
              {/* Radio: đổi đáp án đúng luôn giữ bất biến "đúng 1 đáp án" mà backend yêu cầu. */}
              <input
                type="radio"
                className="h-4 w-4 shrink-0 accent-emerald-600"
                checked={Boolean(option.is_correct)}
                onChange={() => onMarkCorrect(optionIndex)}
                aria-label={`Đặt phương án ${String.fromCharCode(65 + optionIndex)} là đáp án đúng`}
              />
              <span className="text-xs font-black text-slate-500">{String.fromCharCode(65 + optionIndex)}</span>
              <input
                className="auth-input px-3 text-sm font-bold"
                value={option.text}
                onChange={(event) => onOption(optionIndex, "text", event.target.value)}
                placeholder="Nội dung phương án"
              />
              <button
                type="button"
                className="icon-button inline-grid shrink-0"
                aria-label="Xóa phương án"
                title="Xóa phương án"
                disabled={quiz.options.length <= 2}
                onClick={() => onRemoveOption(optionIndex)}
              >
                <Trash2 size={14} />
              </button>
            </div>
            <AutoTextarea
              label={option.is_correct ? "Giải thích vì sao đúng" : "Phản hồi lỗi sai thường gặp"}
              rows={2}
              value={option.feedback}
              onChange={(value) => onOption(optionIndex, "feedback", value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Editor cho khóa bài giảng AI vừa sinh. Giáo viên sửa mọi trường, xóa khối /
 * mục / câu hỏi trước khi bấm Hoàn thành. State do component cha giữ (mảng
 * lessons); ở đây chỉ phát ra bản đã mutate.
 */
export function GeneratedLessonEditor({ lessons, onChange }) {
  const [openLesson, setOpenLesson] = useState(0);

  // Mọi thao tác sửa đều đi qua đây: clone sâu rồi mutate, giữ state bất biến.
  function mutate(lessonIndex, mutator) {
    const next = structuredClone(lessons);
    mutator(next[lessonIndex]);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {lessons.map((lesson, lessonIndex) => {
        const open = openLesson === lessonIndex;
        const quizzes = lesson.evaluation?.quizzes || [];
        return (
          <article key={`${lesson.lesson_id}-${lessonIndex}`} className="surface overflow-hidden">
            <button
              type="button"
              className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-slate-50"
              onClick={() => setOpenLesson(open ? -1 : lessonIndex)}
              aria-expanded={open}
            >
              {open ? <ChevronDown size={18} className="shrink-0 text-slate-400" /> : <ChevronRight size={18} className="shrink-0 text-slate-400" />}
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-black uppercase tracking-wide text-slate-400">
                  {lesson.chapter_title || "Chương"}
                </span>
                <span className="block truncate text-base font-black text-slate-950">
                  Bài {lesson.lesson_id}. {lesson.lesson_title}
                </span>
              </span>
              <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">
                {lesson.sections?.length || 0} mục · {quizzes.length} quiz
              </span>
            </button>

            {open && (
              <div className="space-y-5 border-t border-slate-200 px-5 py-5">
                <label className="block">
                  <span className="mb-1 block text-xs font-black text-slate-700">Tên bài học</span>
                  <input
                    className="auth-input px-3.5 font-extrabold"
                    value={lesson.lesson_title}
                    onChange={(event) => mutate(lessonIndex, (draft) => { draft.lesson_title = event.target.value; })}
                    maxLength={300}
                  />
                </label>

                <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3">
                  <AutoTextarea
                    label="Mở đầu gợi tò mò (Engage)"
                    rows={2}
                    value={lesson.engage_hook}
                    onChange={(value) => mutate(lessonIndex, (draft) => { draft.engage_hook = value; })}
                  />
                </div>

                {/* ------------------------------------------------ Các mục ---- */}
                {(lesson.sections || []).map((section, sectionIndex) => (
                  <section key={`${section.section_id}-${sectionIndex}`} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center gap-2">
                      <input
                        className="auth-input px-3 text-sm font-extrabold"
                        value={section.section_title}
                        onChange={(event) => mutate(lessonIndex, (draft) => {
                          draft.sections[sectionIndex].section_title = event.target.value;
                        })}
                        placeholder="Tên mục"
                        maxLength={300}
                      />
                      <button
                        type="button"
                        className="icon-button inline-grid shrink-0"
                        aria-label="Xóa mục"
                        title="Xóa cả mục"
                        onClick={() => mutate(lessonIndex, (draft) => { draft.sections.splice(sectionIndex, 1); })}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mt-3 space-y-2.5">
                      {(section.content_blocks || []).map((block, blockIndex) => (
                        <BlockCard
                          key={blockIndex}
                          block={block}
                          onField={(field, value) => mutate(lessonIndex, (draft) => {
                            draft.sections[sectionIndex].content_blocks[blockIndex][field] = value;
                          })}
                          onRemove={() => mutate(lessonIndex, (draft) => {
                            draft.sections[sectionIndex].content_blocks.splice(blockIndex, 1);
                          })}
                        />
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {BLOCK_ORDER.map((type) => (
                        <button
                          key={type}
                          type="button"
                          className="secondary-button !min-h-8 !px-2.5 !text-[11px]"
                          onClick={() => mutate(lessonIndex, (draft) => {
                            draft.sections[sectionIndex].content_blocks.push(emptyBlock(type));
                          })}
                        >
                          <Plus size={12} />{BLOCK_META[type].label}
                        </button>
                      ))}
                    </div>
                  </section>
                ))}

                <button
                  type="button"
                  className="secondary-button !min-h-9 !px-3 !text-xs"
                  onClick={() => mutate(lessonIndex, (draft) => {
                    draft.sections.push({
                      section_id: `${draft.lesson_id}.${(draft.sections?.length || 0) + 1}-${Date.now()}`,
                      section_title: "",
                      content_blocks: [emptyBlock("text")],
                    });
                  })}
                >
                  <Plus size={14} />Thêm mục mới
                </button>

                {/* ------------------------------------------- Tổng kết ---- */}
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="flex items-center gap-2 text-xs font-black uppercase text-slate-400">
                    <Sparkles size={15} />Tổng kết bài học
                  </p>
                  <div className="mt-3 space-y-2">
                    {(lesson.lesson_highlights || []).map((highlight, highlightIndex) => (
                      <div key={highlightIndex} className="flex items-center gap-2">
                        <span className="text-slate-300">•</span>
                        <input
                          className="auth-input px-3 text-sm"
                          value={highlight}
                          onChange={(event) => mutate(lessonIndex, (draft) => {
                            draft.lesson_highlights[highlightIndex] = event.target.value;
                          })}
                        />
                        <button
                          type="button"
                          className="icon-button inline-grid shrink-0"
                          aria-label="Xóa ý tổng kết"
                          onClick={() => mutate(lessonIndex, (draft) => {
                            draft.lesson_highlights.splice(highlightIndex, 1);
                          })}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="secondary-button !min-h-8 !px-2.5 !text-[11px]"
                      onClick={() => mutate(lessonIndex, (draft) => {
                        draft.lesson_highlights = [...(draft.lesson_highlights || []), ""];
                      })}
                    >
                      <Plus size={12} />Thêm ý
                    </button>
                  </div>
                </div>

                {/* ---------------------------------------------- Quiz ---- */}
                <div className="space-y-3">
                  <p className="flex items-center gap-2 text-xs font-black uppercase text-slate-400">
                    <ListChecks size={15} />Kiểm tra & Đánh giá ({quizzes.length} câu)
                  </p>
                  {quizzes.map((quiz, quizIndex) => (
                    <QuizCard
                      key={quizIndex}
                      quiz={quiz}
                      index={quizIndex}
                      onQuestion={(value) => mutate(lessonIndex, (draft) => {
                        draft.evaluation.quizzes[quizIndex].question = value;
                      })}
                      onOption={(optionIndex, field, value) => mutate(lessonIndex, (draft) => {
                        draft.evaluation.quizzes[quizIndex].options[optionIndex][field] = value;
                      })}
                      onMarkCorrect={(optionIndex) => mutate(lessonIndex, (draft) => {
                        draft.evaluation.quizzes[quizIndex].options.forEach((option, index) => {
                          option.is_correct = index === optionIndex;
                        });
                      })}
                      onRemoveOption={(optionIndex) => mutate(lessonIndex, (draft) => {
                        const options = draft.evaluation.quizzes[quizIndex].options;
                        const removingCorrect = options[optionIndex].is_correct;
                        options.splice(optionIndex, 1);
                        // Xóa mất đáp án đúng -> chuyển sang phương án đầu tiên,
                        // nếu không câu hỏi sẽ không lưu được.
                        if (removingCorrect && options.length > 0) options[0].is_correct = true;
                      })}
                      onRemove={() => mutate(lessonIndex, (draft) => {
                        draft.evaluation.quizzes.splice(quizIndex, 1);
                      })}
                    />
                  ))}
                  <button
                    type="button"
                    className="secondary-button !min-h-9 !px-3 !text-xs"
                    onClick={() => mutate(lessonIndex, (draft) => {
                      draft.evaluation = draft.evaluation || { quizzes: [] };
                      draft.evaluation.quizzes.push({
                        question: "",
                        options: [
                          { text: "", is_correct: true, feedback: "" },
                          { text: "", is_correct: false, feedback: "" },
                        ],
                      });
                    })}
                  >
                    <Plus size={14} />Thêm câu hỏi
                  </button>
                </div>

                {/* ------------------------------------ Nhiệm vụ thực hành ---- */}
                {lesson.practical_quest && (
                  <div className="space-y-2.5 rounded-lg border border-indigo-200 bg-indigo-50/50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black uppercase tracking-wide text-indigo-700">Nhiệm vụ thực hành</span>
                      <button
                        type="button"
                        className="icon-button inline-grid"
                        aria-label="Xóa nhiệm vụ"
                        title="Bỏ nhiệm vụ thực hành"
                        onClick={() => mutate(lessonIndex, (draft) => { draft.practical_quest = null; })}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    {[
                      ["quest_title", "Tên nhiệm vụ", 1],
                      ["scenario", "Bối cảnh", 2],
                      ["task", "Yêu cầu", 3],
                      ["deliverable", "Sản phẩm cần nộp", 2],
                    ].map(([key, label, rows]) => (
                      <AutoTextarea
                        key={key}
                        label={label}
                        rows={rows}
                        value={lesson.practical_quest[key]}
                        onChange={(value) => mutate(lessonIndex, (draft) => { draft.practical_quest[key] = value; })}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
