// Pure, deterministic logic for Tutor interactive exercises.
// No I/O here so it can be unit-tested without Supabase or a model.
//
// Four exercise types: mcq | matching | ordering | cloze.
// The model returns a FULL item (with answers); the server splits it into a
// render `payload` (no answers) and a server-only `answerKey`, then grades
// student responses against the answer key.

export const EXERCISE_TYPES = ["mcq", "matching", "ordering", "cloze"];

export function isExerciseType(value) {
  return EXERCISE_TYPES.includes(value);
}

// Deterministic, seedable shuffle so a stored item is stable and testable.
function shuffle(items, seed = 1) {
  const copy = [...items];
  let state = seed >>> 0 || 1;
  for (let i = copy.length - 1; i > 0; i -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const j = state % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function normalizeBlank(value = "") {
  return String(value)
    .toLocaleLowerCase("vi-VN")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

// ---- Validation ------------------------------------------------------------
// Structured Outputs should already conform, but never trust model output that
// is about to be shown to a child. Reject anything malformed.

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateExercise(item) {
  if (!item || typeof item !== "object") return "Bài luyện không hợp lệ.";
  if (!isExerciseType(item.type)) return "Loại bài luyện không được hỗ trợ.";
  if (!isNonEmptyString(item.prompt)) return "Bài luyện thiếu đề bài.";

  if (item.type === "mcq") {
    if (!Array.isArray(item.options) || item.options.length < 2 || item.options.length > 4) {
      return "MCQ cần 2–4 lựa chọn.";
    }
    if (!item.options.every(isNonEmptyString)) return "Lựa chọn MCQ không hợp lệ.";
    if (!Number.isInteger(item.correctIndex)
      || item.correctIndex < 0
      || item.correctIndex >= item.options.length) {
      return "MCQ thiếu đáp án đúng hợp lệ.";
    }
    return null;
  }

  if (item.type === "matching") {
    const { left, right, pairs } = item;
    if (!Array.isArray(left) || !Array.isArray(right) || left.length < 2) {
      return "Matching cần ít nhất 2 cặp.";
    }
    if (left.length !== right.length) return "Hai cột matching phải cùng số phần tử.";
    const rightIds = new Set(right.map((entry) => entry?.id));
    if (rightIds.size !== right.length) return "Cột phải matching có id trùng.";
    if (!pairs || typeof pairs !== "object") return "Matching thiếu đáp án ghép.";
    for (const entry of left) {
      if (!isNonEmptyString(entry?.id) || !isNonEmptyString(entry?.label)) {
        return "Phần tử cột trái matching không hợp lệ.";
      }
      if (!rightIds.has(pairs[entry.id])) return "Đáp án ghép matching không khớp cột phải.";
    }
    return null;
  }

  if (item.type === "ordering") {
    const { items, correctOrder } = item;
    if (!Array.isArray(items) || items.length < 2) return "Ordering cần ít nhất 2 bước.";
    if (!Array.isArray(correctOrder) || correctOrder.length !== items.length) {
      return "Ordering thiếu thứ tự đúng.";
    }
    const ids = new Set(items.map((entry) => entry?.id));
    if (ids.size !== items.length) return "Các bước ordering có id trùng.";
    if (!items.every((entry) => isNonEmptyString(entry?.label))) return "Bước ordering thiếu nhãn.";
    if (!correctOrder.every((id) => ids.has(id))) return "Thứ tự đúng tham chiếu id lạ.";
    return null;
  }

  // cloze
  const { text, blanks } = item;
  if (!isNonEmptyString(text)) return "Cloze thiếu đoạn văn.";
  if (!Array.isArray(blanks) || blanks.length < 1) return "Cloze cần ít nhất 1 chỗ trống.";
  for (const blank of blanks) {
    if (!isNonEmptyString(blank?.id) || !isNonEmptyString(blank?.answer)) {
      return "Chỗ trống cloze không hợp lệ.";
    }
    if (!text.includes(`{{${blank.id}}}`)) return "Đoạn văn cloze thiếu vị trí chỗ trống.";
    if (blank.options && (!Array.isArray(blank.options) || !blank.options.every(isNonEmptyString))) {
      return "Lựa chọn cloze không hợp lệ.";
    }
  }
  return null;
}

// ---- Split model output into render payload + server-only answer key --------

export function splitExercise(item, seed = 7) {
  if (item.type === "mcq") {
    return {
      payload: { type: "mcq", prompt: item.prompt, options: item.options },
      answerKey: { correctIndex: item.correctIndex, explanation: item.explanation || "" },
    };
  }
  if (item.type === "matching") {
    return {
      payload: {
        type: "matching",
        prompt: item.prompt,
        left: item.left.map(({ id, label }) => ({ id, label })),
        // shuffle the right column so the correct pairing is not positional
        right: shuffle(item.right.map(({ id, label }) => ({ id, label })), seed),
      },
      answerKey: { pairs: item.pairs, explanation: item.explanation || "" },
    };
  }
  if (item.type === "ordering") {
    let shuffled = shuffle(item.items.map(({ id, label }) => ({ id, label })), seed);
    // guard against the shuffle accidentally returning the correct order
    if (shuffled.every((entry, index) => entry.id === item.correctOrder[index])) {
      shuffled = shuffle(shuffled, seed + 1);
    }
    return {
      payload: { type: "ordering", prompt: item.prompt, items: shuffled },
      answerKey: { correctOrder: item.correctOrder, explanation: item.explanation || "" },
    };
  }
  // cloze
  const answers = {};
  const blanks = item.blanks.map((blank) => {
    answers[blank.id] = blank.answer;
    const options = blank.options && blank.options.length
      ? shuffle(blank.options, seed)
      : null;
    return options ? { id: blank.id, options } : { id: blank.id };
  });
  return {
    payload: { type: "cloze", prompt: item.prompt, text: item.text, blanks },
    answerKey: { answers, explanation: item.explanation || "" },
  };
}

// ---- Grading ---------------------------------------------------------------
// Returns { isCorrect, score (0..1), solution } where solution is safe to show
// AFTER a submission so the student can learn from mistakes.

export function gradeExercise(type, answerKey, response) {
  if (type === "mcq") {
    const selectedIndex = Number(response?.selectedIndex);
    const isCorrect = selectedIndex === Number(answerKey.correctIndex);
    return { isCorrect, score: isCorrect ? 1 : 0, solution: { correctIndex: answerKey.correctIndex } };
  }

  if (type === "matching") {
    const pairs = response?.pairs && typeof response.pairs === "object" ? response.pairs : {};
    const keys = Object.keys(answerKey.pairs);
    const correct = keys.filter((leftId) => pairs[leftId] === answerKey.pairs[leftId]).length;
    const score = keys.length ? correct / keys.length : 0;
    return { isCorrect: score === 1, score, solution: { pairs: answerKey.pairs } };
  }

  if (type === "ordering") {
    const order = Array.isArray(response?.order) ? response.order : [];
    const target = answerKey.correctOrder;
    const inPlace = target.filter((id, index) => order[index] === id).length;
    const score = target.length ? inPlace / target.length : 0;
    return { isCorrect: score === 1, score, solution: { correctOrder: target } };
  }

  // cloze
  const given = response?.answers && typeof response.answers === "object" ? response.answers : {};
  const ids = Object.keys(answerKey.answers);
  const correct = ids.filter((id) => normalizeBlank(given[id]) === normalizeBlank(answerKey.answers[id])).length;
  const score = ids.length ? correct / ids.length : 0;
  return { isCorrect: score === 1, score, solution: { answers: answerKey.answers } };
}

// Effort EXP for attempting practice. Small and fixed; NEVER touches STEAM and
// NEVER unlocks content (mục 6.2 / FR6.6). Awarded once per exercise.
export const PRACTICE_EFFORT_EXP = 5;

export function nextLevel(totalExp) {
  return Math.floor(Math.max(0, Number(totalExp) || 0) / 500) + 1;
}
