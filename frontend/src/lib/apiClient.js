import { supabase } from "./supabaseClient.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(message, { code = "API_ERROR", status = 500, requestId = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

async function accessTokenHeaders(accessToken, headers = {}) {
  let token = accessToken;
  if (!token) {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token;
  }
  return {
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function apiError(response, payload, fallback) {
  return new ApiError(payload.error?.message || fallback, {
    code: payload.error?.code,
    status: response.status,
    requestId: payload.error?.requestId,
  });
}

export async function apiGet(path, signal, accessToken) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: await accessTokenHeaders(accessToken, { Accept: "application/json" }),
    signal,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw apiError(response, payload, "Không thể kết nối với EduOne.");
  }
  return payload.data;
}

export async function apiPost(path, body, signal, accessToken) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: await accessTokenHeaders(accessToken, {
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(body),
    signal,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw apiError(response, payload, "Không thể gửi dữ liệu tới EduOne.");
  }
  return payload.data;
}

export async function apiPatch(path, body, signal, accessToken) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: await accessTokenHeaders(accessToken, {
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(body),
    signal,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw apiError(response, payload, "Không thể cập nhật dữ liệu EduOne.");
  }
  return payload.data;
}

export async function streamPost(path, body, { onEvent, signal } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: await accessTokenHeaders(null, {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => ({}));
    throw apiError(response, payload, "Không thể kết nối với AI Tutor.");
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
  getMe: (signal, accessToken) => apiGet("/auth/me", signal, accessToken),
  bootstrapAccount: (profile, signal, accessToken) => apiPost(
    "/auth/bootstrap",
    profile,
    signal,
    accessToken,
  ),
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
  getTeacherSubjects: (gradeLevel, signal) => apiGet(
    `/teacher/subjects${gradeLevel ? `?gradeLevel=${encodeURIComponent(gradeLevel)}` : ""}`,
    signal,
  ),
  getTeacherClasses: (signal) => apiGet("/teacher/classes", signal),
  createTeacherClass: (payload, signal) => apiPost("/teacher/classes", payload, signal),
  getTeacherClassMembers: (classId, signal) => apiGet(
    `/teacher/classes/${encodeURIComponent(classId)}/members`,
    signal,
  ),
  inviteStudentToClass: (classId, studentEmail, signal) => apiPost(
    `/teacher/classes/${encodeURIComponent(classId)}/invite`,
    { studentEmail },
    signal,
  ),
  decideClassRequest: (membershipId, decision, signal) => apiPost(
    `/teacher/memberships/${encodeURIComponent(membershipId)}/decision`,
    { decision },
    signal,
  ),
  getTeacherContent: (signal) => apiGet("/teacher/content", signal),
  createContentDraft: (payload, signal) => apiPost("/teacher/content/drafts", payload, signal),
  getTeacherLesson: (lessonId, signal) => apiGet(
    `/teacher/lessons/${encodeURIComponent(lessonId)}`,
    signal,
  ),
  updateTeacherLesson: (lessonId, payload, signal) => apiPatch(
    `/teacher/lessons/${encodeURIComponent(lessonId)}`,
    payload,
    signal,
  ),
  submitLessonReview: (lessonId, signal) => apiPost(
    `/teacher/lessons/${encodeURIComponent(lessonId)}/review`,
    {},
    signal,
  ),
  publishTeacherLesson: (lessonId, humanMinutes, signal) => apiPost(
    `/teacher/lessons/${encodeURIComponent(lessonId)}/publish`,
    { humanMinutes },
    signal,
  ),
  createLessonVersion: (lessonId, signal) => apiPost(
    `/teacher/lessons/${encodeURIComponent(lessonId)}/versions`,
    {},
    signal,
  ),
  archiveTeacherLesson: (lessonId, signal) => apiPost(
    `/teacher/lessons/${encodeURIComponent(lessonId)}/archive`,
    {},
    signal,
  ),
  getStudentClasses: (signal) => apiGet("/student/classes", signal),
  getStudentInvitations: (signal) => apiGet("/student/invitations", signal),
  requestClassJoin: (joinCode, signal) => apiPost(
    "/student/classes/join",
    { joinCode },
    signal,
  ),
  respondToClassInvite: (membershipId, response, signal) => apiPost(
    `/student/memberships/${encodeURIComponent(membershipId)}/respond`,
    { response },
    signal,
  ),
};
