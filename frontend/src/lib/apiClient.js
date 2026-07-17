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

export const api = {
  getDashboard: (signal) => apiGet("/student/dashboard", signal),
  getPath: (signal) => apiGet("/student/path", signal),
  getLesson: (skillNodeId, signal) => apiGet(
    `/student/lessons/${encodeURIComponent(skillNodeId)}`,
    signal,
  ),
  submitAttempt: (attempt, signal) => apiPost("/student/attempts", attempt, signal),
};
