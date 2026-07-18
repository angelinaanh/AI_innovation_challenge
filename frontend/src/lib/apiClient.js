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

export async function apiPostForm(path, formData, signal, accessToken) {
  // Không tự đặt Content-Type — trình duyệt tự thêm boundary cho multipart.
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: await accessTokenHeaders(accessToken, { Accept: "application/json" }),
    body: formData,
    signal,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw apiError(response, payload, "Không thể gửi tài liệu tới EduOne.");
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

export async function apiDelete(path, signal, accessToken) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: await accessTokenHeaders(accessToken, { Accept: "application/json" }),
    signal,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw apiError(response, payload, "Không thể xóa dữ liệu trên EduOne.");
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
  // Lộ trình học theo môn (nội dung từ DB backend) + tiến độ học sinh.
  getLearningSubjects: (grade, signal) => apiGet(`/student/learning-path?grade=${encodeURIComponent(grade)}`, signal),
  getLearningPath: (subjectKey, grade, signal) => apiGet(
    `/student/learning-path/${encodeURIComponent(subjectKey)}?grade=${encodeURIComponent(grade)}`,
    signal,
  ),
  getLearningProgress: (subjectKey, grade, signal) => apiGet(
    `/student/learning-path/${encodeURIComponent(subjectKey)}/progress?grade=${encodeURIComponent(grade)}`,
    signal,
  ),
  saveLearningProgress: (subjectKey, grade, completed, replace = false, signal) => apiPost(
    `/student/learning-path/${encodeURIComponent(subjectKey)}/progress`,
    { grade, completed, replace },
    signal,
  ),
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
  // Onboarding AI chat + Placement Test
  onboardingChat: (body, signal) => apiPost("/student/onboarding/chat", body, signal),
  completeOnboarding: (body, signal) => apiPost("/student/onboarding/complete", body, signal),
  getPlacement: (signal) => apiGet("/student/placement", signal),
  generatePlacement: (signal) => apiPost("/student/placement/generate", {}, signal),
  submitPlacement: (body, signal) => apiPost("/student/placement/submit", body, signal),
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
  // Lesson Generator — bước 1 (dàn ý từ tài liệu) & bước 2 (viết bài giảng).
  generateOutline: (formData, signal) => apiPostForm("/teacher/content/outline", formData, signal),
  generateLessons: (payload, signal) => apiPost("/teacher/content/generate", payload, signal),
  saveAiCourse: (payload, signal) => apiPost("/teacher/content/ai-courses", payload, signal),
  getAiCourses: (signal) => apiGet("/teacher/ai-courses", signal),
  getTeacherAiLesson: (lessonId, signal) => apiGet(
    `/teacher/ai-lessons/${encodeURIComponent(lessonId)}`,
    signal,
  ),
  updateAiLesson: (lessonId, content, signal) => apiPatch(
    `/teacher/ai-lessons/${encodeURIComponent(lessonId)}`,
    { content },
    signal,
  ),
  publishAiCourse: (courseId, signal) => apiPost(
    `/teacher/ai-courses/${encodeURIComponent(courseId)}/publish`,
    {},
    signal,
  ),
  publishAiLesson: (lessonId, signal) => apiPost(
    `/teacher/ai-lessons/${encodeURIComponent(lessonId)}/publish`,
    {},
    signal,
  ),
  unpublishAiLesson: (lessonId, signal) => apiPost(
    `/teacher/ai-lessons/${encodeURIComponent(lessonId)}/unpublish`,
    {},
    signal,
  ),
  getClassAiLessons: (classId, signal) => apiGet(
    `/teacher/classes/${encodeURIComponent(classId)}/ai-lessons`,
    signal,
  ),
  assignAiLessonsToClass: (classId, lessonIds, signal) => apiPost(
    `/teacher/classes/${encodeURIComponent(classId)}/ai-lessons`,
    { lessonIds },
    signal,
  ),
  removeAiLessonFromClass: (classId, lessonId, signal) => apiDelete(
    `/teacher/classes/${encodeURIComponent(classId)}/ai-lessons/${encodeURIComponent(lessonId)}`,
    signal,
  ),
  getStudentAiLessons: (signal) => apiGet("/student/ai-lessons", signal),
  getStudentAiLesson: (lessonId, signal) => apiGet(
    `/student/ai-lessons/${encodeURIComponent(lessonId)}`,
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
  getCommunityPosts: (filters, signal) => {
    const params = new URLSearchParams();
    if (filters?.gradeLevel) params.append("gradeLevel", filters.gradeLevel);
    if (filters?.subjectId) params.append("subjectId", filters.subjectId);
    if (filters?.type) params.append("type", filters.type);
    const qs = params.toString();
    return apiGet(`/community/posts${qs ? `?${qs}` : ""}`, signal);
  },
  getCommunityPost: (postId, signal) => apiGet(`/community/posts/${encodeURIComponent(postId)}`, signal),
  createCommunityPost: (payload, signal) => apiPost("/community/posts", payload, signal),
  deleteCommunityPost: (id, signal) => apiDelete(`/community/posts/${id}`, signal),
  createCommunityReply: (postId, payload, signal) => apiPost(`/community/posts/${encodeURIComponent(postId)}/replies`, payload, signal),
  incrementCommunityPostView: (postId, signal) => apiPost(`/community/posts/${encodeURIComponent(postId)}/view`, {}, signal),
  voteCommunityPost: (postId, vote, type, signal) => apiPost(`/community/posts/${encodeURIComponent(postId)}/vote`, { vote, type }, signal),
  toggleCommunityBookmark: (postId, signal) => apiPost(`/community/posts/${encodeURIComponent(postId)}/bookmark`, {}, signal),
  getCommunitySubjects: (signal) => apiGet("/community/subjects", signal),
  getCommunityStats: (signal) => apiGet("/community/stats", signal),
  getCommunityBookmarks: (signal) => apiGet("/community/bookmarks", signal),
  acceptCommunityReply: (replyId, signal) => apiPost(`/community/replies/${encodeURIComponent(replyId)}/accept`, {}, signal),
};
