/**
 * Luồng "Tạo bài giảng bằng AI" (Human-in-the-Loop) — gọi thẳng OpenAI từ
 * backend Node, thay cho AI Content Service (FastAPI) trước đây.
 *
 *   generateOutline()        file + config -> trích văn bản -> Prompt 1 -> dàn ý
 *   generateCourseLessons()  dàn ý đã duyệt -> Prompt 2 (song song) -> bài giảng
 *
 * Không dùng vector DB: văn bản tài liệu được giữ tạm trong RAM theo document_id
 * (giữa bước outline và generate) rồi truy hồi ngữ cảnh theo trùng khớp từ khóa.
 */
import crypto from "node:crypto";

import { PDFParse } from "pdf-parse";

import { env } from "../../utils/env.js";
import { assertAiBudgetAllowance, recordAiUsage } from "../ai/aiGateway.js";
import { getOpenAiClient } from "../ai/openaiClient.js";

const MODEL = env.openAiModels.contentHigh;
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB — khớp với giới hạn frontend.
const LEVEL_LABELS = { Basic: "Cơ bản", Advanced: "Nâng cao" };

function appError(code, message, cause) {
  const error = new Error(message);
  error.code = code;
  if (cause) error.cause = cause;
  return error;
}

// ---------------------------------------------------- Kho tài liệu tạm ----
// Văn bản đã trích được giữ tạm để bước /generate còn ngữ cảnh, tự hết hạn sau
// 1 giờ. Vai trò tương đương namespace Chroma của service cũ.
const DOC_TTL_MS = 60 * 60 * 1000;
const DOC_STORE_CAP = 40;
const documentStore = new Map(); // document_id -> { text, expiresAt }

function putDocument(text) {
  const documentId = `doc-${crypto.randomUUID().replace(/-/g, "")}`;
  const now = Date.now();
  for (const [id, entry] of documentStore) {
    if (entry.expiresAt <= now) documentStore.delete(id);
  }
  if (documentStore.size >= DOC_STORE_CAP) {
    documentStore.delete(documentStore.keys().next().value);
  }
  documentStore.set(documentId, { text, expiresAt: now + DOC_TTL_MS });
  return documentId;
}

function getDocument(documentId) {
  const entry = documentStore.get(documentId);
  if (!entry || entry.expiresAt <= Date.now()) {
    documentStore.delete(documentId);
    return null;
  }
  return entry.text;
}

// ------------------------------------------------------------- Parsing ----
export async function parseDocument(filename, buffer) {
  const name = String(filename || "").toLowerCase();
  let text = "";
  if (name.endsWith(".pdf")) {
    try {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      text = result.text || "";
      await parser.destroy();
    } catch (error) {
      throw appError(
        "UPLOAD_NO_TEXT",
        "PDF không trích xuất được chữ (có thể là bản scan/ảnh). Vui lòng tải lên đúng định dạng tài liệu có văn bản.",
        error,
      );
    }
  } else if (name.endsWith(".txt") || name.endsWith(".md")) {
    text = buffer.toString("utf-8");
  } else {
    throw appError(
      "UPLOAD_INVALID_FORMAT",
      "Sai định dạng tài liệu. Vui lòng tải lên đúng định dạng PDF hoặc Text (.txt, .md).",
    );
  }
  text = text.trim();
  if (!text) {
    throw appError(
      "UPLOAD_NO_TEXT",
      "PDF không trích xuất được chữ (có thể là bản scan/ảnh). Vui lòng tải lên đúng định dạng tài liệu có văn bản.",
    );
  }
  return text;
}

// ------------------------------------------------------ Chunk & retrieve ----
// Chia theo ~1000 từ/chunk (xấp xỉ cửa sổ token của service cũ) để truy hồi
// ngữ cảnh liên quan cho từng bài mà không cần embeddings.
function chunkText(text, wordsPerChunk = 900) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(" "));
  }
  return chunks.length ? chunks : [text];
}

// Ngữ cảnh cho bước sinh dàn ý: cần nhìn TOÀN BỘ tài liệu để chia chương/bài,
// nên lấy trọn văn bản, chỉ cắt bớt khi quá dài để giữ chi phí token hợp lý.
function documentForOutline(text, maxChars = 48000) {
  return text.length > maxChars ? `${text.slice(0, maxChars)}\n\n[... tài liệu bị cắt bớt do quá dài ...]` : text;
}

function tokenize(value) {
  return String(value || "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 1);
}

// Truy hồi top-k đoạn khớp từ khóa với query (thay cho similarity của vector DB).
function retrieve(text, query, k = 4) {
  const chunks = chunkText(text);
  if (chunks.length <= k) return chunks.join("\n\n---\n\n");
  const queryTerms = new Set(tokenize(query));
  if (queryTerms.size === 0) return chunks.slice(0, k).join("\n\n---\n\n");
  const scored = chunks.map((chunk, index) => {
    let score = 0;
    for (const term of tokenize(chunk)) if (queryTerms.has(term)) score += 1;
    return { index, chunk, score };
  });
  const top = scored
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, k);
  const chosen = (top.length ? top : scored.slice(0, k)).sort((a, b) => a.index - b.index);
  return chosen.map((row) => row.chunk).join("\n\n---\n\n");
}

// ------------------------------------------------------------- LLM call ----
const MAX_OUTPUT_TOKENS_CAP = 6000000; // trần an toàn cho max_output_tokens của model.

function parseJsonObject(response) {
  let raw = String(response.output_text || "").trim();
  const fenced = raw.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenced) raw = fenced[1].trim();
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    return data && typeof data === "object" && !Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

// Chặn khi ngân sách AI trong ngày đã hết. Chỉ AI_BUDGET_EXCEEDED mới chặn; lỗi
// hạ tầng ngân sách thì fail-open (log) để không làm gãy luồng đang chạy tốt.
async function guardBudget(orgId) {
  if (!orgId) return;
  try {
    await assertAiBudgetAllowance({ orgId });
  } catch (error) {
    if (error.code === "AI_BUDGET_EXCEEDED") throw error;
    console.warn(JSON.stringify({ level: "warn", code: "BUDGET_CHECK_FAILED", message: error.message }));
  }
}

// Ghi nhận token đã tiêu (cập nhật daily_cost_budgets). Best-effort — lỗi ghi
// nhận không được làm hỏng kết quả sinh nội dung.
async function trackUsage(usage, response) {
  if (!usage?.orgId) return;
  try {
    await recordAiUsage({
      orgId: usage.orgId,
      userId: usage.userId,
      feature: usage.feature,
      model: MODEL,
      tier: 1,
      tokensIn: Number(response.usage?.input_tokens || 0),
      tokensOut: Number(response.usage?.output_tokens || 0),
    });
  } catch (error) {
    console.warn(JSON.stringify({ level: "warn", code: "USAGE_RECORD_FAILED", message: error.message }));
  }
}

async function callJson(instructions, input, { maxTokens, step, effort = "low", timeoutMs = 120000, usage }) {
  // Nguyên nhân số 1 của "JSON không hợp lệ" là model bị CẮT NGANG khi chạm giới
  // hạn token. Nên thử tối đa 2 lần: lần sau tăng gấp đôi ngân sách token trước
  // khi báo lỗi, thay vì fail ngay.
  const budgets = [maxTokens, Math.min(maxTokens * 2, MAX_OUTPUT_TOKENS_CAP)];

  for (let attempt = 0; attempt < budgets.length; attempt += 1) {
    const isLast = attempt === budgets.length - 1;
    let response;
    try {
      // timeout riêng cho từng lần gọi — client dùng chung để 30s cho Tutor, còn
      // sinh bài giảng (reasoning + JSON dài) cần lâu hơn nhiều.
      response = await getOpenAiClient().responses.create({
        model: MODEL,
        instructions,
        input,
        reasoning: { effort },
        max_output_tokens: budgets[attempt],
        text: { format: { type: "json_object" } },
        store: false,
      }, { timeout: timeoutMs, maxRetries: 1 });
    } catch (error) {
      if (error.code === "AI_UNAVAILABLE") throw error;
      // Phân loại lỗi nhà cung cấp để giáo viên biết cách xử lý, thay vì báo chung.
      if (error.status === 429) {
        throw appError("CONTENT_GENERATION_FAILED", "Tài khoản OpenAI đã hết hạn mức (quota) hoặc bị giới hạn tần suất. Vui lòng kiểm tra billing/limit của OPENAI_API_KEY rồi thử lại.", error);
      }
      if (error.status === 401) {
        throw appError("CONTENT_GENERATION_FAILED", "OPENAI_API_KEY không hợp lệ. Vui lòng kiểm tra lại khóa API trong backend/.env.", error);
      }
      if (error.name === "APIConnectionTimeoutError" || /timed out/i.test(error.message || "")) {
        throw appError("CONTENT_GENERATION_FAILED", `AI xử lý quá lâu và bị timeout ở bước ${step}. Hãy thử lại hoặc rút gọn tài liệu.`, error);
      }
      throw appError("CONTENT_GENERATION_FAILED", `Không gọi được AI ở bước ${step}.`, error);
    }

    // Token đã tiêu dù response hợp lệ hay bị cắt -> ghi nhận vào ngân sách.
    await trackUsage(usage, response);

    // Bị cắt vì chạm giới hạn token -> thử lại với ngân sách lớn hơn nếu còn lượt.
    if (response.status === "incomplete") {
      const reason = response.incomplete_details?.reason || "unknown";
      if (reason === "max_output_tokens" && !isLast) continue;
      const detail = reason === "max_output_tokens" ? "Nội dung quá dài nên bị cắt" : `AI dừng bất thường (${reason})`;
      throw appError("CONTENT_GENERATION_FAILED", `${detail} ở bước ${step}. Hãy giảm số câu quiz, rút gọn hoặc tách nhỏ tài liệu rồi thử lại.`);
    }

    const data = parseJsonObject(response);
    if (data) return data;

    // JSON hỏng/rỗng dù không báo cắt -> thử lại một lần; hết lượt thì báo rõ.
    if (!isLast) continue;
    throw appError("CONTENT_GENERATION_FAILED", `AI trả về JSON không hợp lệ ở bước ${step}. Vui lòng thử lại; nếu lặp lại, hãy rút gọn tài liệu hoặc giảm số câu quiz.`);
  }
  throw appError("CONTENT_GENERATION_FAILED", `Không tạo được nội dung ở bước ${step}.`); // không tới đây
}

// --------------------------------------------------- Chuẩn hoá Markdown ----
const HTML_TAG_RE = /<(h[1-6]|p|div|strong|b|em|i|ul|ol|li|br)\b[^>]*>/i;

function normalizeMarkdown(text) {
  const value = String(text || "");
  if (!HTML_TAG_RE.test(value)) return value;
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|ul|ol)>/gi, "\n\n")
    .replace(/<h[1-6][^>]*>/gi, "\n### ")
    .replace(/<\/?(strong|b)>/gi, "**")
    .replace(/<\/?(em|i)>/gi, "*")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// -------------------------------------------------------------- Prompt 1 ----
// Nguồn: ai/prompts/create_syllsbus.md — dàn ý linh hoạt theo bản chất môn học
// (không ép STEAM), quiz chỉ thêm khi giáo viên yêu cầu > 0 câu.
function outlineInstructions(subject, grade, levelLabel, quizCount, teacherNote) {
  const note = String(teacherNote || "").trim() || "(không có)";
  return `Bạn là một Chuyên gia Phát triển Chương trình Giảng dạy xuất sắc.
Nhiệm vụ của bạn là phân tích tài liệu thô được cung cấp và trích xuất ra một Dàn ý khóa học (Course Syllabus/Outline) toàn diện, có cấu trúc logic phân tầng (Chương -> Bài học -> Mục).

THÔNG TIN NGỮ CẢNH TỪ GIÁO VIÊN:

Môn học: ${subject}

Đối tượng: Học sinh lớp ${grade}

Trình độ mong muốn: ${levelLabel}

Số lượng câu hỏi trắc nghiệm mỗi bài (nếu có): ${quizCount}

CÁC QUY TẮC LẬP DÀN Ý:

Bám sát tài liệu: CHỈ sử dụng kiến thức có trong [Tài liệu Nguồn]. Tuyệt đối không tự bịa thêm các nội dung ngoài tài liệu.

Tôn trọng "Ghi chú dành cho giáo viên": nếu giáo viên có yêu cầu/định hướng riêng thì ưu tiên tuân theo, miễn là không mâu thuẫn với tài liệu nguồn.

Cấu trúc Phân tầng (Chương & Bài):

Toàn bộ môn học phải được chia thành các Chương chính (Chapters).

Mỗi Chương bao gồm nhiều Bài học nhỏ (Lessons) bám sát mạch logic của tài liệu nguồn.

Mỗi Bài học nhỏ phải được ước tính thời lượng giảng dạy lý thuyết.

Thích ứng theo phân loại trình độ:

Nếu trình độ "Cơ bản": Dàn ý tập trung vào khái niệm nền tảng, định nghĩa, nhận biết và quan sát thực tế.

Nếu trình độ "Nâng cao": Rút gọn khái niệm sơ khai, bổ sung phân tích chuyên sâu, so sánh, phản biện và vận dụng logic.

Chia nhỏ để trị (Chunking): Mỗi bài học phải có các mục nhỏ (I, II, III...) được phân chia mạch lạc theo nội dung để người học dễ tiếp thu kiến thức.

Tính linh hoạt theo bản chất môn học:

Thay vì ép buộc cấu trúc cố định, hãy tự động điều chỉnh các mục nhỏ (sections) dựa trên đặc thù môn học.

Với môn Khoa học/Kỹ thuật: Ưu tiên các mục về phương pháp, thực nghiệm, ứng dụng thực tế hoặc góc nhìn liên môn (STEAM).

Với môn Ngôn ngữ/Xã hội/Nghệ thuật: Ưu tiên các mục về phân tích ngữ cảnh, thực hành kỹ năng, đọc hiểu, hoặc liên hệ thực tiễn xã hội.

Chuẩn bị cho Đánh giá: Thêm mục "Kiểm tra & Ôn tập" vào cuối bài học nếu giáo viên có yêu cầu thiết lập số lượng câu hỏi Quiz lớn hơn 0.

ĐỊNH DẠNG ĐẦU RA BẮT BUỘC (STRICT JSON):
Bạn chỉ được phép trả về chuỗi JSON hợp lệ, không kèm văn bản giải thích nào khác. Hãy chú ý các đánh dấu [REQUIRED] và [OPTIONAL] để xử lý:

{
  "course_outline": {
    "subject": "Tên môn học [REQUIRED]",
    "target_grade": "Lớp [REQUIRED]",
    "overall_objective": "Tóm tắt mục tiêu toàn bộ khóa học trong 1-2 câu [REQUIRED]",
    "chapters": [
      {
        "chapter_id": 1,
        "chapter_title": "Tên chương (VD: Chương 1: Động lực học hoặc Chương 1: Tổng quan Văn học hiện thực) [REQUIRED]",
        "chapter_objective": "Mục tiêu cốt lõi của chương này [REQUIRED]",
        "lessons": [
          {
            "lesson_id": "1.1",
            "lesson_title": "Tên bài học nhỏ [REQUIRED]",
            "estimated_time_minutes": 5,
            "sections": [
              {
                "section_id": "1.1.1",
                "section_title": "Tên mục (VD: I. Khái niệm cơ bản / Định luật / Đọc hiểu văn bản...) [REQUIRED]",
                "intent": "Ghi chú ngắn gọn cho giáo viên biết phần này sẽ dạy cái gì [REQUIRED]"
              },
              {
                "section_id": "1.1.2",
                "section_title": "Tên mục (VD: II. Ứng dụng thực tế / Góc nhìn thực tiễn / Liên hệ liên môn...) [OPTIONAL - Sinh ra dựa trên bản chất môn học]",
                "intent": "Ghi chú định hướng nội dung ứng dụng hoặc mở rộng kiến thức [OPTIONAL]"
              },
              {
                "section_id": "1.1.3",
                "section_title": "Kiểm tra & Đánh giá (${quizCount} câu hỏi) [OPTIONAL - Chỉ khởi tạo nếu số lượng câu hỏi Quiz lớn hơn 0]",
                "intent": "Đánh giá mức độ hiểu bài của học sinh [OPTIONAL]"
              }
            ]
          }
        ]
      }
    ]
  }
}
"estimated_time_minutes" là số nguyên, tối thiểu là 5 phút.

không kèm markdown, không giải thích.`;
}

function coerceOutline(rawCourse, subject, grade) {
  if (!rawCourse || typeof rawCourse !== "object") {
    throw appError("CONTENT_GENERATION_FAILED", "AI không trả về course_outline.");
  }
  const chapters = Array.isArray(rawCourse.chapters) ? rawCourse.chapters : [];
  const course = {
    subject: String(rawCourse.subject || subject || ""),
    target_grade: String(rawCourse.target_grade || grade || ""),
    overall_objective: String(rawCourse.overall_objective || ""),
    chapters: chapters.map((chapter) => ({
      chapter_id: String(chapter?.chapter_id ?? ""),
      chapter_title: String(chapter?.chapter_title || ""),
      chapter_objective: String(chapter?.chapter_objective || ""),
      lessons: (Array.isArray(chapter?.lessons) ? chapter.lessons : []).map((lesson) => ({
        lesson_id: String(lesson?.lesson_id ?? ""),
        lesson_title: String(lesson?.lesson_title || ""),
        estimated_time_minutes: Math.max(5, Number.parseInt(lesson?.estimated_time_minutes, 10) || 5),
        sections: (Array.isArray(lesson?.sections) ? lesson.sections : []).map((section) => ({
          section_id: String(section?.section_id ?? ""),
          section_title: String(section?.section_title || ""),
          intent: String(section?.intent || ""),
        })).filter((section) => section.section_title.trim()),
      })).filter((lesson) => lesson.lesson_title.trim() && lesson.sections.length > 0),
    })).filter((chapter) => chapter.chapter_title.trim() && chapter.lessons.length > 0),
  };
  const hasSection = course.chapters.some((chapter) =>
    chapter.lessons.some((lesson) => lesson.sections.length > 0));
  if (!course.chapters.length || !hasSection) {
    throw appError("CONTENT_GENERATION_FAILED", "Dàn ý trả về rỗng — tài liệu có thể quá ngắn.");
  }
  return course;
}

export async function generateOutline({ filename, buffer, subject, grade, level, quizCount, teacherNote, orgId, userId }) {
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw appError("UPLOAD_TOO_LARGE", "Tài liệu vượt quá giới hạn 20MB. Vui lòng tải lên tài liệu nhỏ hơn 20MB.");
  }
  const cleanSubject = String(subject || "").trim();
  const cleanGrade = String(grade || "").trim();
  if (!cleanSubject || !cleanGrade) {
    throw appError("VALIDATION_ERROR", "Thiếu tên môn học hoặc khối lớp.");
  }
  await guardBudget(orgId);
  const useLevel = level === "Advanced" ? "Advanced" : "Basic";
  const useQuizCount = Math.min(10, Math.max(1, Number.parseInt(quizCount, 10) || 3));

  const text = await parseDocument(filename, buffer);
  const documentId = putDocument(text);

  const instructions = outlineInstructions(cleanSubject, cleanGrade, LEVEL_LABELS[useLevel], useQuizCount, teacherNote);
  const input = `DỮ LIỆU ĐẦU VÀO:\n[Tài liệu Nguồn]:\n----------------\n${documentForOutline(text)}\n----------------\nHãy tạo Dàn ý khóa học theo đúng cấu trúc JSON bắt buộc.`;
  const data = await callJson(instructions, input, {
    maxTokens: 12000, step: "tạo dàn ý", effort: "low", timeoutMs: 180000,
    usage: { orgId, userId, feature: "content_outline" },
  });

  const course = coerceOutline(data.course_outline, cleanSubject, cleanGrade);
  return {
    document_id: documentId,
    subject: cleanSubject,
    grade: cleanGrade,
    level: useLevel,
    course_outline: course,
  };
}

// -------------------------------------------------------------- Prompt 2 ----
// Nguồn: ai/prompts/create_leacturer.md — viết chi tiết MỘT bài học, bám sát dàn
// ý đã duyệt, linh hoạt theo bản chất môn học, và tuân thủ ghi chú của giáo viên.
function lessonInstructions(subject, chapterTitle, grade, levelLabel, estimatedMinutes, quizCount, requireQuest, teacherNote) {
  const note = String(teacherNote || "").trim() || "(không có)";
  return `Bạn là một Chuyên gia Thiết kế Bài giảng (Instructional Designer) xuất sắc.
Nhiệm vụ của bạn là viết nội dung CHI TIẾT cho MỘT BÀI HỌC (Lesson) dựa trên [Dàn ý Bài học] đã được phê duyệt, [Tài liệu Tri thức] từ hệ thống và tuân thủ các chỉ thị riêng biệt từ giáo viên.

THÔNG TIN BÀI GIẢNG:
- Môn học trọng tâm: ${subject || "(không nêu)"}
- Bối cảnh Chương (Chapter): ${chapterTitle || "(không nêu)"}
- Đối tượng: Học sinh lớp ${grade}, Trình độ: ${levelLabel}
- Thời lượng dự kiến của bài: ${estimatedMinutes} phút
- Số lượng câu hỏi trắc nghiệm (Quiz): ${quizCount}
- Yêu cầu tạo Nhiệm vụ thực hành (Quest) cuối bài: ${requireQuest ? "TRUE" : "FALSE"}
- GHI CHÚ ĐẶC BIỆT TỪ PHẦN 1 (BẮT BUỘC FOLLOW): ${note}

CÁC NGUYÊN TẮC THIẾT KẾ BÀI GIẢNG:
1. Bám sát dàn ý đã duyệt: Viết đúng MỘT section cho MỖI mục trong [Dàn ý Bài học], GIỮ NGUYÊN section_id/lesson_id và bám sát "intent" của từng mục — không tự thêm/bớt/đổi thứ tự mục.
2. Trình bày Đa phương tiện & Gắn kết: Chia nhỏ văn bản thành các khối dễ tiếp thu (Micro-learning), tránh đoạn văn dài quá 4 câu. PHẢI in đậm (**bold**) các thuật ngữ/định nghĩa/từ khóa quan trọng.
3. Mở đầu sinh động: Luôn có phần mở đầu gợi tò mò, kết nối thực tế (engage_hook) trước khi giải thích nội dung chuyên sâu.
4. Linh hoạt theo bản chất môn học: Dựa vào tên môn và nội dung để chọn khối phù hợp — CHỈ dùng LaTeX $$...$$ khi có công thức Toán/Lý/Hóa/Tin; với môn Xã hội/Ngôn ngữ thì tăng phân tích, liên hệ thực tiễn hoặc mẹo ghi nhớ.
5. Khuyến khích sáng tạo: Chủ động đề xuất bài tập nhẩm nhanh (quick_practice) và mẹo tư duy (tip) độc đáo để đạt chất lượng sư phạm cao, không tóm tắt tài liệu một cách máy móc.
6. Tuyệt đối bám sát Tri thức & Ghi chú: Cốt lõi kiến thức dựa trên [Tài liệu Tri thức]; định hướng, văn phong và trọng tâm đi theo sát GHI CHÚ ĐẶC BIỆT ở trên.

QUY TẮC VỀ ĐỊNH DẠNG CHỮ:
Trong mọi trường văn bản, chỉ dùng Markdown thuần (**đậm**, "- " gạch đầu dòng). TUYỆT ĐỐI KHÔNG dùng thẻ HTML (<p>, <strong>, <ul>, <br>...).

ĐỊNH DẠNG ĐẦU RA BẮT BUỘC (STRICT JSON):
Bạn chỉ được phép trả về một chuỗi JSON hợp lệ với cấu trúc sau, không kèm bất kỳ giải thích nào khác:

{
  "lesson_id": "Mã bài học lấy từ Dàn ý (VD: 1.1)",
  "lesson_title": "Tên bài học",
  "engage_hook": "Một tình huống thực tế, câu hỏi mở hoặc ý tưởng dẫn dắt độc đáo để thu hút sự chú ý (Dưới 70 chữ).",
  "sections": [
    {
      "section_id": "Mã mục lấy từ Dàn ý (VD: 1.1.1)",
      "section_title": "Tên mục",
      "content_blocks": [
        { "type": "text", "content": "Nội dung lý thuyết ngắn gọn, diễn giải mạch lạc, in đậm từ khóa..." },
        { "type": "formula", "content": "Công thức LaTeX (chỉ khi bài có công thức toán học/khoa học)" },
        { "type": "image_suggestion", "alt_text": "Ý tưởng sơ đồ/tranh ảnh/đồ thị cần chèn để minh họa phần này" },
        { "type": "quick_practice", "question": "Câu hỏi nhẩm nhanh hoặc gợi mở tư duy", "answer": "Gợi ý đáp án ngắn gọn" },
        { "type": "tip", "content": "Mẹo nhớ nhanh, góc nhìn mở rộng, hoặc lưu ý tránh bẫy tư duy sai của học sinh" }
      ]
    }
  ],
  "lesson_highlights": ["Tóm tắt ý đọng lại 1", "Tóm tắt ý đọng lại 2"],
  "evaluation": {
    "quizzes": [
      {
        "question": "Câu hỏi tình huống kiểm tra mức độ Hiểu và Vận dụng",
        "options": [
          { "text": "Đáp án đúng", "is_correct": true, "feedback": "Phân tích lý do tại sao đúng." },
          { "text": "Đáp án nhiễu", "is_correct": false, "feedback": "Bóc tách lỗ hổng tư duy khiến học sinh chọn nhầm." }
        ]
      }
    ]
  },
  "practical_quest": {
    "quest_title": "Tên nhiệm vụ thực tế",
    "scenario": "Bối cảnh nhập vai, tình huống giả định hấp dẫn.",
    "task": "Thách thức học sinh tự giải quyết, thiết kế hoặc lên phương án hành động cụ thể.",
    "deliverable": "Sản phẩm cần nộp (VD: sơ đồ tư duy, bài thuyết trình, mô hình phác thảo)."
  }
}

RÀNG BUỘC BỔ SUNG:
- AI tự do quyết định số lượng và thứ tự các content_block trong mỗi mục; chỉ tạo block khi thực sự có giá trị. Nhưng SỐ LƯỢNG và THỨ TỰ các section phải KHỚP HỆT dàn ý.
- "evaluation.quizzes" phải có ĐÚNG ${quizCount} câu; mỗi câu 3-4 phương án và ĐÚNG MỘT phương án có is_correct = true; mọi phương án (kể cả sai) đều phải có "feedback".
- "lesson_highlights" gồm 3 đến 5 gạch đầu dòng.
- Nếu Yêu cầu tạo Nhiệm vụ thực hành = FALSE thì "practical_quest" phải là null.
- CHỈ dùng đúng các trường (key) trong cấu trúc mẫu; TUYỆT ĐỐI KHÔNG thêm trường nào khác. Mỗi content_block chỉ dùng các field hợp lệ của loại đó.
- Viết súc tích để JSON không quá dài; trả về DUY NHẤT một JSON object hoàn chỉnh, đóng đủ mọi dấu ngoặc, không kèm markdown hay giải thích.`;
}

const BLOCK_TYPES = new Set(["text", "formula", "image_suggestion", "quick_practice", "tip"]);

function normalizeBlock(raw) {
  if (!raw || typeof raw !== "object" || !BLOCK_TYPES.has(raw.type)) return null;
  const block = {
    type: raw.type,
    content: String(raw.content || ""),
    alt_text: String(raw.alt_text || ""),
    question: String(raw.question || ""),
    answer: String(raw.answer || ""),
  };
  // Bỏ block thiếu field bắt buộc của chính nó (tốt hơn là fail cả bài).
  if (block.type === "image_suggestion") {
    if (!block.alt_text.trim()) return null;
  } else if (block.type === "quick_practice") {
    if (!block.question.trim() || !block.answer.trim()) return null;
  } else if (!block.content.trim()) {
    return null;
  }
  // Công thức LaTeX giữ nguyên; các trường văn bản khác lọc HTML về Markdown.
  if (block.type !== "formula") {
    block.content = normalizeMarkdown(block.content);
    block.answer = normalizeMarkdown(block.answer);
    block.question = normalizeMarkdown(block.question);
  }
  return block;
}

function normalizeQuiz(raw) {
  if (!raw || typeof raw !== "object") return null;
  const options = (Array.isArray(raw.options) ? raw.options : [])
    .map((option) => ({
      text: String(option?.text || ""),
      is_correct: option?.is_correct === true,
      feedback: String(option?.feedback || ""),
    }))
    .filter((option) => option.text.trim());
  if (options.length < 2 || options.length > 6) return null;
  if (options.filter((option) => option.is_correct).length !== 1) return null;
  if (!String(raw.question || "").trim()) return null;
  return { question: String(raw.question), options };
}

function normalizeLesson(data, { lesson, chapterTitle, requireQuest }) {
  // Neo lại danh tính bài học theo dàn ý giáo viên đã duyệt.
  const sections = [];
  for (const section of Array.isArray(data.sections) ? data.sections : []) {
    if (!section || typeof section !== "object") continue;
    const blocks = (Array.isArray(section.content_blocks) ? section.content_blocks : [])
      .map(normalizeBlock)
      .filter(Boolean);
    if (blocks.length === 0) continue;
    sections.push({
      section_id: String(section.section_id || ""),
      section_title: String(section.section_title || ""),
      content_blocks: blocks,
    });
  }
  const quizzes = (Array.isArray(data.evaluation?.quizzes) ? data.evaluation.quizzes : [])
    .map(normalizeQuiz)
    .filter(Boolean);

  let practicalQuest = null;
  if (requireQuest && data.practical_quest && typeof data.practical_quest === "object") {
    practicalQuest = {
      quest_title: String(data.practical_quest.quest_title || ""),
      scenario: String(data.practical_quest.scenario || ""),
      task: String(data.practical_quest.task || ""),
      deliverable: String(data.practical_quest.deliverable || ""),
    };
  }

  return {
    lesson_id: lesson.lesson_id,
    lesson_title: String(data.lesson_title || lesson.lesson_title || ""),
    chapter_title: chapterTitle || "",
    estimated_time_minutes: Math.max(5, Number.parseInt(lesson.estimated_time_minutes, 10) || 5),
    engage_hook: normalizeMarkdown(data.engage_hook || ""),
    sections,
    lesson_highlights: (Array.isArray(data.lesson_highlights) ? data.lesson_highlights : [])
      .map((item) => normalizeMarkdown(String(item)))
      .filter((item) => item.trim()),
    evaluation: { quizzes },
    practical_quest: practicalQuest,
  };
}

// Chạy tối đa `limit` tác vụ song song, giữ nguyên thứ tự kết quả.
async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

export async function generateCourseLessons(payload) {
  const course = payload?.course_outline;
  const documentId = String(payload?.document_id || "");
  const cleanGrade = String(payload?.grade || "").trim();
  if (!cleanGrade) throw appError("VALIDATION_ERROR", "Thiếu khối lớp.");
  const level = payload?.level === "Advanced" ? "Advanced" : "Basic";
  const quizCount = Math.min(10, Math.max(1, Number.parseInt(payload?.quiz_count, 10) || 3));
  const requireQuest = payload?.require_quest !== false;
  const subject = String(payload?.subject || "").trim();
  const teacherNote = payload?.teacher_note; // Ghi chú đặc biệt từ bước 1 (BẮT BUỘC FOLLOW).
  const orgId = payload?.orgId;
  const userId = payload?.userId;
  await guardBudget(orgId);

  const text = getDocument(documentId);
  if (!text) {
    throw appError("CONTENT_NOT_FOUND", "Tài liệu đã hết hạn hoặc không tồn tại. Vui lòng tải lại tài liệu và tạo dàn ý mới.");
  }

  const lessonsWithChapter = [];
  for (const chapter of Array.isArray(course?.chapters) ? course.chapters : []) {
    for (const lesson of Array.isArray(chapter?.lessons) ? chapter.lessons : []) {
      if (Array.isArray(lesson?.sections) && lesson.sections.length > 0) {
        lessonsWithChapter.push({ chapterTitle: chapter.chapter_title, lesson });
      }
    }
  }
  if (lessonsWithChapter.length === 0) {
    throw appError("VALIDATION_ERROR", "Dàn ý cần ít nhất một bài học còn mục.");
  }

  // Sinh SONG SONG (tối đa 4) — một khóa thường có 6+ bài. Một bài lỗi -> fail
  // cả request để giáo viên thấy rõ, thay vì trả khóa thiếu bài ngầm định.
  const lessons = await mapPool(lessonsWithChapter, 4, async ({ chapterTitle, lesson }) => {
    const query = [
      lesson.lesson_title,
      ...(lesson.sections || []).map((section) => section.section_title),
      ...(lesson.sections || []).map((section) => section.intent).filter(Boolean),
    ].join(" ").trim();
    const context = retrieve(text, query);
    const lessonOutlineJson = JSON.stringify({
      lesson_id: lesson.lesson_id,
      lesson_title: lesson.lesson_title,
      estimated_time_minutes: lesson.estimated_time_minutes,
      sections: (lesson.sections || []).map((section) => ({
        section_id: section.section_id,
        section_title: section.section_title,
        intent: section.intent,
      })),
    }, null, 2);

    const instructions = lessonInstructions(
      subject, chapterTitle, cleanGrade, LEVEL_LABELS[level],
      lesson.estimated_time_minutes, quizCount, requireQuest, teacherNote,
    );
    const input = `DỮ LIỆU ĐẦU VÀO:\n[Dàn ý Bài học]:\n${lessonOutlineJson}\n\n[Tài liệu Tri thức]:\n----------------\n${context || "(không tìm thấy đoạn liên quan)"}\n----------------\nHãy viết bài giảng chi tiết theo đúng cấu trúc JSON bắt buộc.`;
    const data = await callJson(instructions, input, {
      maxTokens: 8000,
      step: `viết bài '${lesson.lesson_title}'`,
      effort: "low",
      usage: { orgId, userId, feature: "content_lesson" },
    });
    return normalizeLesson(data, { lesson, chapterTitle, requireQuest });
  });

  return {
    document_id: documentId,
    subject,
    grade: cleanGrade,
    level,
    lessons,
  };
}
