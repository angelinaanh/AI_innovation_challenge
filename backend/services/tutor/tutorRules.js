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
