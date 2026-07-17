// Client for Tutor interactive practice exercises.
// Attaches the Supabase JWT like apiClient so it works behind the auth/RBAC
// middleware; kept as its own module to stay decoupled from apiClient.

import { supabase } from "./supabaseClient.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function post(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body || {}),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error?.message || "Không thể kết nối bài luyện.");
    error.code = payload.error?.code;
    throw error;
  }
  return payload.data;
}

export const exerciseApi = {
  generate: (sessionId, type) => post("/tutor/exercises", { sessionId, type }),
  submit: (exerciseId, response) => post(`/tutor/exercises/${exerciseId}/submit`, { response }),
  promote: (exerciseId) => post(`/tutor/exercises/${exerciseId}/promote`, {}),
};
