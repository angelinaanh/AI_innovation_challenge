const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

export async function apiGet(path, signal) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
    signal,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error?.message || "Không thể kết nối với EduOne.");
  }
  return payload.data;
}

export async function apiPost(path, body, signal) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error?.message || "Không thể gửi dữ liệu tới EduOne.");
  }
  return payload.data;
}

export async function streamPost(path, body, { onEvent, signal } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error?.message || "Không thể kết nối với AI Tutor.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() || "";
    for (const frame of frames) {
      let event = "message";
      const dataLines = [];
      for (const line of frame.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
      }
      if (dataLines.length > 0) {
        const rawData = dataLines.join("\n");
        const data = JSON.parse(rawData);
        onEvent?.(event, data);
      }
    }
    if (done) break;
  }
}

export const api = {
  getDashboard: (signal) => apiGet("/student/dashboard", signal),
  getPath: (signal) => apiGet("/student/path", signal),
  getLesson: (skillNodeId, signal) => apiGet(
    `/student/lessons/${encodeURIComponent(skillNodeId)}`,
    signal,
  ),
  submitAttempt: (attempt, signal) => apiPost("/student/attempts", attempt, signal),
  createTutorSession: (skillNodeId, signal) => apiPost(
    "/tutor/sessions",
    { skillNodeId },
    signal,
  ),
  streamTutorMessage: (sessionId, message, options) => streamPost(
    `/tutor/sessions/${encodeURIComponent(sessionId)}/messages/stream`,
    { message },
    options,
  ),
  escalateTutorMessage: (messageId, signal) => apiPost(
    `/tutor/messages/${encodeURIComponent(messageId)}/escalate`,
    {},
    signal,
  ),
};
