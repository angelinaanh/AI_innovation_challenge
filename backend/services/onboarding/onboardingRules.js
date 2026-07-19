// Logic thuần (không DB, không mạng) cho luồng onboarding + placement.
// Test được bằng unit test: extract slot hội thoại, chuẩn hoá câu hỏi AI sinh,
// chấm điểm placement -> STEAM/lộ trình, và sinh lời nhận xét radar.

export const STEAM_AXES = ["S", "T", "E", "A", "M"];

export const AXIS_META = Object.freeze({
  S: { domain: "Khoa học", persona: "Nhà khoa học" },
  T: { domain: "Công nghệ", persona: "Lập trình viên" },
  E: { domain: "Kỹ thuật", persona: "Kỹ sư" },
  A: { domain: "Nghệ thuật", persona: "Nghệ sĩ" },
  M: { domain: "Tư duy Toán học", persona: "Nhà Toán học" },
});

// <50% -> Cơ bản, >=50% -> Nâng cao (theo mục 1.2/1.3 của tài liệu discovery).
export const ADVANCED_THRESHOLD_PERCENT = 75;

export function resolveTrack(scorePercent) {
  return Number(scorePercent) >= ADVANCED_THRESHOLD_PERCENT ? "advanced" : "basic";
}

export function resolveProficiency(scorePercent) {
  const p = Number(scorePercent);
  if (p >= 80) return "Giỏi";
  if (p >= 65) return "Khá";
  if (p >= 50) return "Trung bình";
  return "Yếu";
}

export function convertRubricTo10Scale(rubricScore) {
  let score;
  if (rubricScore < 4.0) {
    score = rubricScore * (4.9 / 3.9);
  } else if (rubricScore < 7.0) {
    score = 5.0 + ((rubricScore - 4.0) / 2.9) * 1.4;
  } else if (rubricScore < 10.0) {
    score = 6.5 + ((rubricScore - 7.0) / 2.9) * 1.4;
  } else {
    score = 8.0 + ((rubricScore - 10.0) / 2.0) * 2.0;
  }
  return Math.round(score * 10) / 10;
}

// ---------------------------------------------------------------------------
// 1. Hội thoại thu thập thông tin (fallback tất định khi AI không khả dụng)
// ---------------------------------------------------------------------------

function parseInteger(text, min, max) {
  const matches = String(text || "").match(/\d{1,3}/g);
  if (!matches) return null;
  for (const raw of matches) {
    const value = Number(raw);
    if (Number.isInteger(value) && value >= min && value <= max) return value;
  }
  return null;
}

function parseYesNo(text) {
  const normalized = String(text || "").toLowerCase();
  if (/(không|ko\b|nghỉ|đã nghỉ|thôi học|chưa đi học)/.test(normalized)) return false;
  if (/(có|đang học|vẫn học|còn đi học|đi học|rồi|yes)/.test(normalized)) return true;
  return null;
}

function looksLikeYear(text) {
  const match = String(text || "").match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : null;
}

// Thứ tự thu thập. Mỗi slot có:
// - question: câu hỏi khi lần đầu hỏi slot
// - extract: rút giá trị từ tin nhắn học sinh (null nếu không hợp lệ)
// - clarify: câu GIẢI THÍCH + hướng dẫn lại khi học sinh trả lời sai định dạng
export const ONBOARDING_SLOTS = Object.freeze([
  {
    key: "fullName",
    question: "Chào bạn! Mình là trợ lý EduOne 🤖. Trước khi bắt đầu, bạn cho mình biết bạn tên là gì nhé?",
    extract: (text) => {
      const value = String(text || "")
        .trim()
        .replace(/^(dạ|vâng|ạ|xin chào|chào|hi|hello)[\s,]+/i, "")
        .replace(/^(mình|tôi|em|tớ|con)?\s*(tên( mình| tôi| em)?( là| gọi là)?|là|gọi là)\s+/i, "")
        .trim();
      if (value.length < 2 || value.length > 80) return null;
      if (/^\d+$/.test(value)) return null;
      return value;
    },
    clarify: () => "Hihi mình chưa nhận ra tên bạn 😅. Bạn gõ giúp mình họ tên (ít nhất 2 chữ cái) nhé — ví dụ \"Minh Anh\".",
  },
  {
    key: "age",
    question: (c) => `Rất vui được gặp ${c.fullName || "bạn"}! Năm nay bạn bao nhiêu tuổi?`,
    extract: (text) => parseInteger(text, 5, 100),
    clarify: (_c, text) => {
      const year = looksLikeYear(text);
      if (year) {
        const age = new Date().getFullYear() - year;
        return `Hình như "${year}" là năm sinh phải không nè? 😊 Vậy chắc bạn khoảng ${age} tuổi. Bạn gõ lại số tuổi giúp mình nhé (ví dụ ${age}).`;
      }
      return "Không sao đâu nhé! Mình chỉ cần số tuổi hiện tại của bạn thôi — một số từ 5 đến 100 (ví dụ 12) 😊.";
    },
  },
  {
    key: "gradeLevel",
    question: "Bạn đang học lớp mấy vậy? (từ lớp 1 đến lớp 12)",
    extract: (text) => parseInteger(text, 1, 12),
    clarify: () => "Bạn cho mình biết lớp đang học nhé — một số từ 1 đến 12 thôi, ví dụ gõ \"lớp 8\" hoặc \"8\" 😊.",
  },
  {
    key: "isEnrolled",
    question: "Hiện tại bạn còn đang đi học ở trường chứ? EduOne dùng thông tin này để bổ trợ đúng chương trình cho bạn.",
    extract: parseYesNo,
    clarify: () => "Câu này dễ thôi mà 😊 — bạn chỉ cần trả lời \"Có\" (đang đi học) hoặc \"Chưa\" / \"Không\" (hiện không đi học) giúp mình nhé.",
  },
  {
    key: "schoolName",
    question: "Bạn đang học ở trường nào thế? (nếu không tiện chia sẻ, bạn gõ \"bỏ qua\" nhé)",
    extract: (text) => {
      const value = String(text || "").trim();
      if (!value) return null;
      if (/^(bỏ qua|khong|không|skip|ko)$/i.test(value)) return "";
      if (value.length > 120) return value.slice(0, 120);
      return value;
    },
    clarify: () => "Bạn gõ tên trường của mình giúp nhé — hoặc gõ \"bỏ qua\" nếu bạn không muốn chia sẻ.",
  },
  {
    key: "selfReportedGrade",
    question: "Câu cuối nhé: bạn cảm thấy trình độ hiện tại của mình tương đương lớp mấy? (cứ chọn theo cảm nhận, không sao cả)",
    extract: (text) => parseInteger(text, 1, 12),
    clarify: () => "Bạn cứ ước lượng thôi: trình độ của bạn khoảng lớp mấy? Cho mình một số từ 1 đến 12 nhé.",
  },
]);

// Lời ghi nhận ngắn khi học sinh trả lời hợp lệ, để hội thoại có cảm giác dẫn dắt, thân thiện.
const ACKS = ["Tuyệt lắm! ", "Mình ghi nhận rồi nhé 😊. ", "Cảm ơn bạn nhiều! ", "Okie, mình hiểu rồi. ", "Hay quá! "];

// Thông tin xen kẽ về hệ thống (chỉ dùng ở vài bước đầu).
const SYSTEM_BLURBS = [
  "Mọi câu hỏi của bạn với trợ lý AI đều là không gian an toàn để thử và sai nhé. ",
  "Sau phần này, bạn sẽ làm một \"Nhiệm vụ Phân tích Kỹ năng\" ngắn để mình hiểu bạn hơn. ",
];

export function missingSlots(collected = {}) {
  return ONBOARDING_SLOTS.filter((slot) => collected[slot.key] === undefined
    || collected[slot.key] === null);
}

function slotText(field, slot, collected, text) {
  const value = slot[field];
  if (typeof value === "function") return value(collected, text);
  return value;
}

// Tiến một bước hội thoại: rút thông tin từ tin nhắn mới, rồi hỏi slot còn thiếu.
// - Trả lời hợp lệ  -> ghi nhận + hỏi slot tiếp theo.
// - Trả lời sai     -> GIẢI THÍCH vì sao chưa hợp lệ + hướng dẫn lại (không lặp câu cũ).
// Trả về { reply, collected, complete }.
export function advanceOnboardingChat({ collected = {}, lastUserMessage = "" } = {}) {
  const next = { ...collected };
  let justFilled = false;
  let failedSlot = null;

  if (lastUserMessage) {
    const pending = missingSlots(next)[0];
    if (pending) {
      const value = pending.extract(lastUserMessage);
      if (value !== null) {
        next[pending.key] = value;
        justFilled = true;
      } else {
        failedSlot = pending;
      }
    }
  }

  // Trả lời sai định dạng -> giải thích và hướng dẫn lại đúng slot đó.
  if (failedSlot) {
    return {
      collected: next,
      complete: false,
      reply: slotText("clarify", failedSlot, next, lastUserMessage),
    };
  }

  const remaining = missingSlots(next);
  if (remaining.length === 0) {
    return {
      collected: next,
      complete: true,
      reply: `Tuyệt vời, cảm ơn ${next.fullName || "bạn"}! Mình đã đủ thông tin rồi. `
        + "Giờ chúng ta cùng bắt đầu \"Nhiệm vụ Phân tích Kỹ năng\" để khám phá thế mạnh STEAM của bạn nhé! 🚀",
    };
  }

  const answeredCount = ONBOARDING_SLOTS.length - remaining.length;
  const ack = justFilled ? ACKS[answeredCount % ACKS.length] : "";
  const blurb = answeredCount > 0 && answeredCount <= SYSTEM_BLURBS.length
    ? SYSTEM_BLURBS[answeredCount - 1]
    : "";
  return {
    collected: next,
    complete: false,
    reply: `${ack}${blurb}${slotText("question", remaining[0], next)}`,
  };
}

export function validateCollectedProfile(collected = {}) {
  const errors = [];
  if (!collected.fullName || String(collected.fullName).trim().length < 2) {
    errors.push("Thiếu họ tên hợp lệ.");
  }
  if (!Number.isInteger(collected.gradeLevel)
    || collected.gradeLevel < 1 || collected.gradeLevel > 12) {
    errors.push("Thiếu lớp hợp lệ (1-12).");
  }
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// 2. Chuẩn hoá câu hỏi do AI sinh (loại câu sai định dạng, giữ đúng phạm vi)
// ---------------------------------------------------------------------------

export function normalizeGeneratedQuestions(rawQuestions) {
  if (!Array.isArray(rawQuestions)) return [];
  const cleaned = [];
  for (const raw of rawQuestions) {
    const axis = String(raw?.steam_axis || raw?.axis || "").toUpperCase();
    const type = ["mcq", "fill_blank", "open", "interactive_visual", "true_false_cluster"].includes(raw?.type) ? raw.type : "mcq";
    const body = String(raw?.body || raw?.question || "").trim();
    const difficulty = ["easy", "medium", "hard"].includes(raw?.difficulty)
      ? raw.difficulty
      : "medium";

    if (!STEAM_AXES.includes(axis)) continue;
    if (!body) continue;

    const question = {
      steam_axis: axis,
      type,
      difficulty,
      body,
      image_url: raw?.image_url || null,
      explanation: String(raw?.explanation || "").trim() || null,
    };

    if (type === "mcq") {
      const options = Array.isArray(raw?.options)
        ? raw.options.map((option) => String(option).trim()).filter(Boolean)
        : [];
      const answerIndex = Number(raw?.answer_index);
      if (options.length < 2 || options.length > 5) continue;
      if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= options.length) continue;
      question.options = options;
      question.answer_index = answerIndex;
    } else if (type === "fill_blank") {
      const accepted = Array.isArray(raw?.accepted_answers)
        ? raw.accepted_answers.map((ans) => String(ans).trim()).filter(Boolean)
        : [];
      if (accepted.length === 0) continue;
      question.accepted_answers = accepted;
    } else if (type === "open") {
      const rubric = String(raw?.rubric || "").trim();
      if (!rubric) continue;
      question.rubric = rubric;
    } else if (type === "interactive_visual") {
      question.image_url = raw?.interactive_url || raw?.image_url || null; // save interactive URL in image_url or add interactive_url
      question.options = Array.isArray(raw?.options) ? raw.options : ["😃 Trả lời đúng", "😢 Trả lời sai"];
      question.answer_index = Number(raw?.answer_index) || 0;
    } else if (type === "true_false_cluster") {
      question.options = Array.isArray(raw?.clauses) ? raw.clauses : [];
      question.accepted_answers = Array.isArray(raw?.answers) ? raw.answers : []; // [true, false, true, false]
    }

    cleaned.push(question);
  }
  return cleaned.map((question, index) => ({ ...question, order_index: index }));
}

// ---------------------------------------------------------------------------
// 3. Chấm điểm placement -> STEAM (0-100 từng trục) + tổng % + lộ trình
// ---------------------------------------------------------------------------

// questions: [{ id, steam_axis, type, answer_index, accepted_answers }]
// answers:   [{ questionId, selectedIndex, textAnswer, scoreFraction }]
export function gradePlacement(questions = [], answers = []) {
  const answerByQuestionId = new Map(
    answers.map((answer) => [answer.questionId, answer]),
  );

  const perAxis = Object.fromEntries(STEAM_AXES.map((axis) => [axis, { score: 0, total: 0 }]));
  const perQuestion = [];
  let totalScore = 0;

  for (const question of questions) {
    const axis = String(question.steam_axis).toUpperCase();
    if (!perAxis[axis]) continue;
    
    const ans = answerByQuestionId.get(question.id) || {};
    let scoreFraction = 0;

    if (question.type === "mcq" || question.type === "interactive_visual" || !question.type) {
      if (ans.selectedIndex !== undefined && ans.selectedIndex !== null) {
        scoreFraction = Number(ans.selectedIndex) === Number(question.answer_index) ? 1 : 0;
      }
    } else if (question.type === "fill_blank") {
      if (ans.textAnswer) {
        const normalized = String(ans.textAnswer).trim().toLowerCase();
        const isMatch = (question.accepted_answers || []).some(
          (acc) => String(acc).trim().toLowerCase() === normalized
        );
        scoreFraction = isMatch ? 1 : 0;
      }
    } else if (question.type === "true_false_cluster") {
      if (ans.textAnswer && Array.isArray(question.accepted_answers)) {
        // ans.textAnswer expected to be like "true,false,true,true"
        const userAnswers = String(ans.textAnswer).split(',').map(s => s.trim().toLowerCase());
        const correctAnswers = question.accepted_answers.map(a => String(a).trim().toLowerCase());
        let correctCount = 0;
        for (let i = 0; i < Math.min(4, correctAnswers.length); i++) {
          if (userAnswers[i] === correctAnswers[i]) correctCount++;
        }
        if (correctCount === 1) scoreFraction = 0.1;
        else if (correctCount === 2) scoreFraction = 0.25;
        else if (correctCount === 3) scoreFraction = 0.5;
        else if (correctCount === 4) scoreFraction = 1.0;
      }
    } else if (question.type === "open") {
      scoreFraction = Number(ans.scoreFraction) || 0;
    } else if (question.type === "multiple_select") {
      if (ans.textAnswer && Array.isArray(question.accepted_answers)) {
        try {
          const userAns = JSON.parse(ans.textAnswer).map(String);
          const accepted = question.accepted_answers.map(String);
          const isCorrect = userAns.length === accepted.length && userAns.every(a => accepted.includes(a));
          scoreFraction = isCorrect ? 1 : 0;
        } catch(e) {}
      }
    } else if (question.type === "drag_drop" || question.type === "ordering") {
      if (ans.textAnswer && Array.isArray(question.accepted_answers)) {
        try {
          const userAns = JSON.parse(ans.textAnswer).map(String);
          const accepted = question.accepted_answers.map(String);
          let correctCount = 0;
          for (let i = 0; i < accepted.length; i++) {
            if (userAns[i] === accepted[i]) correctCount++;
          }
          scoreFraction = accepted.length > 0 ? (correctCount / accepted.length) : 0;
        } catch(e) {}
      }
    } else if (question.type === "hotspot") {
      if (ans.textAnswer && question.options) {
        try {
          const userClicks = JSON.parse(ans.textAnswer);
          const targets = Array.isArray(question.options.items) ? question.options.items : (Array.isArray(question.options) ? question.options : []);
          let hitCount = 0;
          for (const target of targets) {
            const hit = userClicks.some(click => {
              const dx = click.x - target.x;
              const dy = click.y - target.y;
              return Math.sqrt(dx*dx + dy*dy) <= (target.radius || 30);
            });
            if (hit) hitCount++;
          }
          scoreFraction = targets.length > 0 ? (hitCount / targets.length) : 0;
        } catch(e) {}
      }
    }

    perAxis[axis].total += 1;
    perAxis[axis].score += scoreFraction;
    totalScore += scoreFraction;

    perQuestion.push({ 
      questionId: question.id, 
      selectedIndex: ans.selectedIndex ?? null,
      textAnswer: ans.textAnswer ?? null,
      scoreFraction,
      isCorrect: scoreFraction === 1 // for backward compatibility
    });
  }

  const steam = Object.fromEntries(STEAM_AXES.map((axis) => {
    const { score, total } = perAxis[axis];
    return [axis, total > 0 ? Math.round((score / total) * 100) : 0];
  }));

  const totalQuestions = questions.length;
  const scorePercent = totalQuestions > 0
    ? Math.round((totalScore / totalQuestions) * 10000) / 100
    : 0;

  return {
    perQuestion,
    steam,
    totalCorrect: Math.round(totalScore), // approximate if fractions exist
    totalQuestions,
    scorePercent,
    track: resolveTrack(scorePercent),
  };
}

// ---------------------------------------------------------------------------
// 4. Lời nhận xét radar (FR2.5 — động viên, không xếp hạng)
// ---------------------------------------------------------------------------

export function radarSummary(steam = {}, { track } = {}) {
  const entries = STEAM_AXES.map((axis) => [axis, Number(steam[axis] || 0)]);
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  const [highAxis, highScore] = sorted[0];
  const [lowAxis] = sorted[sorted.length - 1];

  const high = AXIS_META[highAxis];
  const low = AXIS_META[lowAxis];
  const trackLabel = track === "advanced" ? "Nâng cao" : "Cơ bản";

  const headline = highScore > 0
    ? `Bạn là một ${high.persona} tiềm năng (điểm ${highAxis} cao)!`
    : "Chào mừng bạn đến với hành trình STEAM của mình!";
  const advice = highAxis === lowAxis
    ? "Hãy bắt đầu khám phá cả 5 lĩnh vực để tìm ra thế mạnh của mình nhé."
    : `Hãy bổ sung thêm ${low.domain} (${lowAxis}) để tạo ra những sản phẩm ấn tượng hơn nữa nhé!`;

  const insights = entries.map(([axis, score]) => {
    let type = "Thiếu hụt";
    let text = "";
    if (score >= 80) {
      type = "Điểm mạnh";
      text = `Tư duy ${AXIS_META[axis].domain} xuất sắc. Hãy duy trì phong độ và thử sức với các dự án nâng cao.`;
    } else if (score >= 50) {
      type = "Đạt chuẩn";
      text = `Nắm vững nền tảng ${AXIS_META[axis].domain}. Cần rèn luyện thêm tốc độ và kỹ năng phân tích sâu.`;
    } else {
      type = "Thiếu hụt";
      text = `Kỹ năng ${AXIS_META[axis].domain} chưa đạt chuẩn. Đây là nguyên nhân khiến bạn dễ mất điểm ở các câu hỏi vận dụng.`;
    }
    return { axis, domain: AXIS_META[axis].domain, score, type, text };
  });

  const mockTasks = {
    S: ["Xem video mô phỏng thí nghiệm Hóa học ảo (PhET)", "Thực hành 5 câu Trắc nghiệm Khoa học mức Nhận biết"],
    T: ["Hoàn thành nhiệm vụ Kéo thả Thuật toán Blockly", "Ôn tập tài liệu: Cấu trúc điều kiện IF-ELSE"],
    E: ["Xem video Nguyên lý cơ bản mạch điện xoay chiều", "Làm bài tập: Tìm lỗi sai trên bản vẽ kỹ thuật"],
    A: ["Làm bài tập thực hành: Phối màu Tương phản (UI/UX)", "Đọc tài liệu: Nguyên tắc Công thái học (Ergonomics)"],
    M: ["Ôn tập chuyên đề: Giải tích & Tích phân ứng dụng", "Làm 5 bài tập Tối ưu hóa Toán học thực tiễn"]
  };

  const weakAxes = [...sorted].reverse().filter(([_, score]) => score < 50).slice(0, 2);
  const adaptivePaths = weakAxes.map(([axis, score]) => {
    return {
      axis,
      domain: AXIS_META[axis].domain,
      reason: `Kỹ năng ${AXIS_META[axis].domain} của bạn đang ở mức ${score}%, ảnh hưởng đến khả năng giải quyết các câu hỏi thực tế.`,
      tasks: mockTasks[axis]
    };
  });

  return {
    headline,
    advice,
    message: `${headline} ${advice}`,
    trackLabel,
    strongestAxis: highAxis,
    weakestAxis: lowAxis,
    insights,
    adaptivePaths,
  };
}
