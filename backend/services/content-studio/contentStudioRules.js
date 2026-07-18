const TRANSITIONS = Object.freeze({
  submit_review: { DRAFT: "IN_REVIEW" },
  publish: { IN_REVIEW: "PUBLISHED" },
  archive: {
    DRAFT: "ARCHIVED",
    IN_REVIEW: "ARCHIVED",
    PUBLISHED: "ARCHIVED",
  },
});

function cleanText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function sentences(sourceText) {
  const normalized = String(sourceText || "").replace(/\r/g, "\n").trim();
  const paragraphs = normalized
    .split(/\n{2,}|\n(?=[A-ZÀ-Ỹ0-9])/u)
    .map(cleanText)
    .filter((value) => value.length >= 25);
  if (paragraphs.length >= 3) return paragraphs;
  return normalized
    .split(/(?<=[.!?])\s+/u)
    .map(cleanText)
    .filter((value) => value.length >= 20);
}

function clip(value, maxLength) {
  const normalized = cleanText(value);
  return normalized.length <= maxLength
    ? normalized
    : `${normalized.slice(0, maxLength - 1).trim()}…`;
}

export function nextLessonStatus(action, currentStatus) {
  const next = TRANSITIONS[action]?.[currentStatus];
  if (!next) {
    const error = new Error(`Không thể thực hiện ${action} khi bài học ở trạng thái ${currentStatus}.`);
    error.code = "CONTENT_INVALID_STATE";
    throw error;
  }
  return next;
}

export function buildStructuredDraft({ sourceText, title, skillNodeName }) {
  const source = cleanText(sourceText);
  if (source.length < 120 || source.length > 20000) {
    const error = new Error("Nguồn nội dung cần từ 120 đến 20.000 ký tự.");
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const lessonTitle = clip(title || skillNodeName || "Bài học mới", 120);
  const parts = sentences(source);
  const fallback = [source, source, source];
  const checkpointBodies = Array.from({ length: 3 }, (_, index) => (
    parts[index] || parts[index % Math.max(parts.length, 1)] || fallback[index]
  ));
  const summary = clip(parts[0] || source, 260);

  const checkpoints = checkpointBodies.map((body, index) => ({
    id: `checkpoint-${index + 1}`,
    title: ["Khám phá khái niệm", "Thực hành có hướng dẫn", "Vận dụng và phản tư"][index],
    type: ["concept", "guided_practice", "reflection"][index],
    durationMinutes: [7, 9, 6][index],
    eyebrow: `Checkpoint ${index + 1}`,
    body: clip(body, 1200),
    blocks: [],
    takeaway: clip(body, 180),
  }));

  return {
    content: {
      title: lessonTitle,
      summary,
      estimatedMinutes: 22,
      learningObjectives: [
        `Giải thích được ý chính của ${lessonTitle}`,
        `Vận dụng ${lessonTitle} vào một nhiệm vụ ngắn`,
        "Tự đánh giá cách làm và điều cần cải thiện",
      ],
      checkpoints,
      quizHints: [
        "Đối chiếu lại ý chính trong checkpoint đầu tiên.",
        "Loại các phương án không xuất hiện trong nguồn bài học.",
      ],
    },
    question: {
      body: `Phát biểu nào phù hợp nhất với nội dung cốt lõi của “${lessonTitle}”?`,
      options: [
        clip(checkpoints[0].takeaway, 220),
        "Nội dung chỉ cần ghi nhớ, không cần áp dụng vào tình huống thực tế.",
        "Mọi cách giải đều đúng mà không cần đối chiếu với nguồn bài học.",
      ],
      correctIndex: 0,
      explanation: `Ý chính được nêu trực tiếp trong nguồn: ${clip(checkpoints[0].takeaway, 260)}`,
      difficulty: "medium",
    },
  };
}

export function validateLessonDraft(content, question) {
  if (!content || typeof content !== "object") return "Thiếu nội dung bài học.";
  if (cleanText(content.title).length < 3 || cleanText(content.title).length > 120) {
    return "Tiêu đề cần từ 3 đến 120 ký tự.";
  }
  if (cleanText(content.summary).length < 10 || cleanText(content.summary).length > 600) {
    return "Tóm tắt cần từ 10 đến 600 ký tự.";
  }
  const estimatedMinutes = Number(content.estimatedMinutes);
  if (!Number.isInteger(estimatedMinutes) || estimatedMinutes < 5 || estimatedMinutes > 180) {
    return "Thời lượng cần là số nguyên từ 5 đến 180 phút.";
  }
  if (!Array.isArray(content.learningObjectives)
    || content.learningObjectives.length < 1
    || content.learningObjectives.length > 6
    || content.learningObjectives.some((item) => cleanText(item).length < 5)) {
    return "Bài học cần từ 1 đến 6 mục tiêu hợp lệ.";
  }
  if (!Array.isArray(content.checkpoints)
    || content.checkpoints.length < 1
    || content.checkpoints.length > 8) {
    return "Bài học cần từ 1 đến 8 checkpoint.";
  }
  for (const checkpoint of content.checkpoints) {
    if (cleanText(checkpoint?.title).length < 3 || cleanText(checkpoint?.body).length < 20) {
      return "Mỗi checkpoint cần tiêu đề và nội dung tối thiểu 20 ký tự.";
    }
  }
  if (!question || cleanText(question.body).length < 10) return "Thiếu câu hỏi kiểm tra.";
  if (!Array.isArray(question.options)
    || question.options.length < 3
    || question.options.length > 5
    || question.options.some((option) => cleanText(option).length < 2)) {
    return "Câu hỏi cần từ 3 đến 5 phương án hợp lệ.";
  }
  const correctIndex = Number(question.correctIndex);
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= question.options.length) {
    return "Đáp án đúng không hợp lệ.";
  }
  return null;
}

export function contentSafetyText(content, question) {
  return [
    content?.title,
    content?.summary,
    ...(content?.learningObjectives || []),
    ...(content?.checkpoints || []).flatMap((checkpoint) => [
      checkpoint.title,
      checkpoint.body,
      checkpoint.takeaway,
    ]),
    question?.body,
    ...(question?.options || []),
    question?.explanation,
  ].filter(Boolean).join("\n");
}
