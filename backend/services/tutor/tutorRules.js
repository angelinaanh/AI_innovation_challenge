const STOP_WORDS = new Set([
  "ban", "biet", "cac", "cho", "cua", "duoc", "gi", "hay", "khi", "la",
  "lam", "mot", "nao", "nhu", "tai", "the", "thi", "toi", "trong", "va", "voi",
]);

export function normalizeText(value = "") {
  return String(value)
    .toLocaleLowerCase("vi-VN")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(value) {
  return [...new Set(
    normalizeText(value)
      .split(" ")
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token)),
  )];
}

export function lexicalScore(question, content) {
  const queryTokens = tokenize(question);
  if (queryTokens.length === 0) return 0;
  const contentTokens = new Set(tokenize(content));
  const matches = queryTokens.filter((token) => contentTokens.has(token)).length;
  return matches / queryTokens.length;
}

export function rankKnowledgeChunks(question, chunks) {
  return chunks
    .map((chunk) => ({
      ...chunk,
      lexicalScore: lexicalScore(question, `${chunk.title || ""} ${chunk.content}`),
    }))
    .sort((left, right) => right.lexicalScore - left.lexicalScore);
}

export function isKnowledgeGrounded(rankedChunks, threshold = 0.2) {
  return Boolean(rankedChunks[0] && rankedChunks[0].lexicalScore >= threshold);
}

export function isAnswerSeeking(question) {
  return /(đáp án|dap an|câu trả lời đúng|cau tra loi dung|chọn câu nào|chon cau nao|give me the answer|answer key)/i
    .test(question);
}

export function isPromptOverrideAttempt(question) {
  return /(bỏ qua|bo qua|ignore|quên|quen).{0,24}(hướng dẫn|huong dan|chỉ dẫn|chi dan|instructions|previous)|system prompt|developer message|tiết lộ prompt|tiet lo prompt/i
    .test(question);
}

// Conversational (non-academic) turns: greetings, thanks, farewells, short
// acknowledgements, and questions about the Tutor itself. These should be
// answered warmly instead of hitting the grounding gate and being refused.
const SMALLTALK_GREET_RE = /^(hi+|hello+|hallo|helu+|helo+|heo|hey+|chao|xin chao|alo+|allo|yo|hola)\b/;
const SMALLTALK_THANKS_RE = /\b(cam on|cang on|thank you|thanks|thank|tks+|ty)\b/;
const SMALLTALK_FAREWELL_RE = /\b(tam biet|bye+|bai bai|good ?bye|see you)\b/;
const SMALLTALK_AFFIRM_RE = /^(ok+|oke+|okay|okie|vang|da|uh+|um+|roi|duoc roi|hay qua|tuyet|great)\b/;
const SMALLTALK_META_RE = /(ban la ai|ban ten( la)? gi|ban la gi|ban (co the )?(lam|giup)( duoc)? (gi|nhu the nao)|who are you|what can you do|gioi thieu( ve)? ban|ban lam( duoc)? gi)/;

export function isSmallTalk(question) {
  const norm = normalizeText(question);
  if (!norm) return false;
  if (SMALLTALK_META_RE.test(norm)) return true;
  // A longer message is probably a real academic question (even if it opens
  // with "chào"), so let it fall through to grounded retrieval.
  if (norm.split(" ").length > 5) return false;
  return (
    SMALLTALK_GREET_RE.test(norm)
    || SMALLTALK_THANKS_RE.test(norm)
    || SMALLTALK_FAREWELL_RE.test(norm)
    || SMALLTALK_AFFIRM_RE.test(norm)
  );
}

const GREET_REPLIES = [
  "Chào bạn 👋 Mình là AI Tutor của EduOne, luôn sẵn sàng giúp bạn hiểu bài. Bạn đang thắc mắc ở phần nào trong bài học nhỉ?",
  "Xin chào! Rất vui được học cùng bạn hôm nay 😊 Bạn muốn mình giúp phần nào trong bài này?",
  "Chào bạn! Mình ở đây để gợi mở từng bước cho bạn. Cứ hỏi mình bất cứ chỗ nào bạn thấy khó nhé!",
];
const THANKS_REPLIES = [
  "Không có gì đâu! Mình luôn sẵn sàng 😊 Còn phần nào trong bài bạn muốn hỏi thêm không?",
  "Rất vui vì đã giúp được bạn! Bạn cứ hỏi tiếp nếu còn chỗ nào chưa rõ nhé.",
];
const FAREWELL_REPLIES = [
  "Tạm biệt bạn nhé! Hẹn gặp lại, cứ quay lại hỏi mình bất cứ lúc nào 👋",
  "Chào bạn, chúc bạn học vui! Mình luôn ở đây khi bạn cần.",
];
const AFFIRM_REPLIES = [
  "Tuyệt! Bạn cứ hỏi mình bất cứ điều gì trong bài nhé 👍",
  "Oke luôn! Bạn muốn bắt đầu từ phần nào của bài?",
];
const META_REPLIES = [
  "Mình là AI Tutor của EduOne 🤖 Mình giúp bạn hiểu các bài học đã được giáo viên duyệt — giải thích, gợi ý từng bước và tạo bài luyện tập. Để đảm bảo chính xác, mình chỉ trả lời trong phạm vi bài học. Bạn muốn bắt đầu từ đâu?",
  "Mình là trợ lý học tập AI của EduOne. Mình có thể giải thích khái niệm, gợi mở khi bạn bí, và ra bài luyện tập — tất cả dựa trên bài giáo viên đã duyệt. Bạn đang học phần nào nhỉ?",
];

function pickReply(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function smallTalkReply(question) {
  const norm = normalizeText(question);
  if (SMALLTALK_META_RE.test(norm)) return pickReply(META_REPLIES);
  if (SMALLTALK_FAREWELL_RE.test(norm)) return pickReply(FAREWELL_REPLIES);
  if (SMALLTALK_THANKS_RE.test(norm)) return pickReply(THANKS_REPLIES);
  if (SMALLTALK_AFFIRM_RE.test(norm) && !SMALLTALK_GREET_RE.test(norm)) return pickReply(AFFIRM_REPLIES);
  return pickReply(GREET_REPLIES);
}

export function splitAnswerForStreaming(answer, maxLength = 48) {
  const words = String(answer).split(/(\s+)/);
  const chunks = [];
  let current = "";
  for (const word of words) {
    if (current.length + word.length > maxLength && current) {
      chunks.push(current);
      current = word;
    } else {
      current += word;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export function encodeSse(event, data) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}
