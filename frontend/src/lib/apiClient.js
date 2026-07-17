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

export const api = {
  getDashboard: (signal) => apiGet("/student/dashboard", signal),
  getPath: (signal) => apiGet("/student/path", signal),
};
