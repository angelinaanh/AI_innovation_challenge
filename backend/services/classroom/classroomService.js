import { supabase } from "../supabase.js";
import { throwDatabaseError } from "../student/studentContext.js";
import {
  generateJoinCode,
  isGradeBand,
  nextMembershipStatus,
} from "./classroomRules.js";

function appError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

async function loadProfile(userId) {
  const result = await supabase.from("profiles").select("id,org_id,role,full_name,email")
    .eq("id", userId).single();
  throwDatabaseError(result.error, "load classroom profile");
  return result.data;
}

async function loadOwnedClass(teacherId, classId) {
  const result = await supabase.from("classes")
    .select("id,teacher_id,org_id,name,grade_band,subject_id,join_code")
    .eq("id", classId).eq("teacher_id", teacherId).maybeSingle();
  throwDatabaseError(result.error, "load owned class");
  if (!result.data) throw appError("CLASS_NOT_FOUND", "Không tìm thấy lớp này.");
  return result.data;
}

// ---- Subjects catalog ------------------------------------------------------

export async function listSubjects(userId, gradeBand) {
  const profile = await loadProfile(userId);
  let query = supabase.from("subjects").select("id,name,steam_axis,grade_band")
    .eq("org_id", profile.org_id).order("grade_band").order("steam_axis");
  if (gradeBand && isGradeBand(gradeBand)) query = query.eq("grade_band", gradeBand);
  const result = await query;
  throwDatabaseError(result.error, "list subjects");
  return result.data || [];
}

// ---- Teacher flow ----------------------------------------------------------

export async function createClass(teacherId, { name, gradeBand, subjectId }) {
  const cleanName = String(name || "").trim();
  if (cleanName.length < 2) throw appError("VALIDATION_ERROR", "Tên lớp cần ít nhất 2 ký tự.");
  if (!isGradeBand(gradeBand)) throw appError("VALIDATION_ERROR", "Khối lớp không hợp lệ.");
  const teacher = await loadProfile(teacherId);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const result = await supabase.from("classes").insert({
      org_id: teacher.org_id,
      teacher_id: teacherId,
      name: cleanName,
      grade_band: gradeBand,
      subject_id: subjectId || null,
      join_code: generateJoinCode(),
    }).select("id,name,grade_band,subject_id,join_code,created_at").single();
    if (!result.error) return result.data;
    if (result.error.code !== "23505") throwDatabaseError(result.error, "create class");
  }
  throw appError("CLASS_CODE_COLLISION", "Không tạo được mã lớp, hãy thử lại.");
}

export async function listTeacherClasses(teacherId) {
  const result = await supabase.from("classes")
    .select("id,name,grade_band,subject_id,join_code,created_at")
    .eq("teacher_id", teacherId).order("created_at", { ascending: false });
  throwDatabaseError(result.error, "list teacher classes");
  const classes = result.data || [];
  if (classes.length === 0) return [];

  const membersResult = await supabase.from("class_memberships")
    .select("class_id,status").in("class_id", classes.map((c) => c.id));
  throwDatabaseError(membersResult.error, "count class members");
  const counts = {};
  for (const m of membersResult.data || []) {
    counts[m.class_id] = counts[m.class_id] || { active: 0, pending: 0 };
    if (m.status === "active") counts[m.class_id].active += 1;
    else if (m.status === "invited" || m.status === "requested") counts[m.class_id].pending += 1;
  }
  return classes.map((c) => ({ ...c, memberCount: counts[c.id]?.active || 0, pendingCount: counts[c.id]?.pending || 0 }));
}

export async function getClassMembers(teacherId, classId) {
  const klass = await loadOwnedClass(teacherId, classId);
  const result = await supabase.from("class_memberships")
    .select("id,student_id,status,created_at")
    .eq("class_id", classId).in("status", ["active", "invited", "requested"])
    .order("created_at", { ascending: true });
  throwDatabaseError(result.error, "load class members");
  const rows = result.data || [];
  const students = rows.length
    ? (await supabase.from("profiles").select("id,full_name,email")
        .in("id", rows.map((r) => r.student_id))).data || []
    : [];
  const byId = new Map(students.map((s) => [s.id, s]));
  return {
    class: { id: klass.id, name: klass.name, gradeBand: klass.grade_band, joinCode: klass.join_code },
    active: rows.filter((r) => r.status === "active").map((r) => ({ ...r, student: byId.get(r.student_id) })),
    pending: rows.filter((r) => r.status !== "active").map((r) => ({ ...r, student: byId.get(r.student_id) })),
  };
}

export async function inviteStudent(teacherId, classId, studentEmail) {
  const klass = await loadOwnedClass(teacherId, classId);
  const email = String(studentEmail || "").trim().toLowerCase();
  if (!email) throw appError("VALIDATION_ERROR", "Cần email học sinh.");

  const studentResult = await supabase.from("profiles").select("id,org_id")
    .eq("email", email).eq("role", "student").maybeSingle();
  throwDatabaseError(studentResult.error, "find student to invite");
  const student = studentResult.data;
  if (!student || student.org_id !== klass.org_id) {
    throw appError("STUDENT_NOT_FOUND", "Không tìm thấy học sinh với email này trong tổ chức.");
  }

  const existing = await supabase.from("class_memberships").select("id,status")
    .eq("class_id", classId).eq("student_id", student.id).maybeSingle();
  throwDatabaseError(existing.error, "check existing membership");
  const current = existing.data;

  if (current?.status === "active") throw appError("ALREADY_MEMBER", "Học sinh đã là thành viên lớp.");
  // A pending request + an invite converge into active membership.
  const nextStatus = current?.status === "requested" ? "active" : "invited";

  if (current) {
    const upd = await supabase.from("class_memberships")
      .update({ status: nextStatus, invited_by: teacherId, decided_at: nextStatus === "active" ? new Date().toISOString() : null })
      .eq("id", current.id).select("id,status").single();
    throwDatabaseError(upd.error, "update membership on invite");
    return upd.data;
  }
  const ins = await supabase.from("class_memberships")
    .insert({ class_id: classId, student_id: student.id, status: "invited", invited_by: teacherId })
    .select("id,status").single();
  throwDatabaseError(ins.error, "insert invite membership");
  return ins.data;
}

export async function decideRequest(teacherId, membershipId, decision) {
  const action = decision === "approve" ? "approve_request" : decision === "reject" ? "reject_request" : null;
  if (!action) throw appError("VALIDATION_ERROR", "Quyết định không hợp lệ.");

  const memResult = await supabase.from("class_memberships")
    .select("id,status,class_id,classes!inner(teacher_id)")
    .eq("id", membershipId).maybeSingle();
  throwDatabaseError(memResult.error, "load membership for decision");
  const membership = memResult.data;
  const klass = membership && (Array.isArray(membership.classes) ? membership.classes[0] : membership.classes);
  if (!membership || klass?.teacher_id !== teacherId) throw appError("MEMBERSHIP_NOT_FOUND", "Không tìm thấy yêu cầu.");

  const nextStatus = nextMembershipStatus(action, membership.status);
  const upd = await supabase.from("class_memberships")
    .update({ status: nextStatus, decided_at: new Date().toISOString() })
    .eq("id", membershipId).select("id,status").single();
  throwDatabaseError(upd.error, "apply membership decision");
  return upd.data;
}

// ---- Student flow ----------------------------------------------------------

export async function listStudentClasses(studentId) {
  const result = await supabase.from("class_memberships")
    .select("id,status,class_id,classes!inner(id,name,grade_band,subject_id,teacher_id)")
    .eq("student_id", studentId).eq("status", "active");
  throwDatabaseError(result.error, "list student classes");
  return (result.data || []).map((m) => {
    const c = Array.isArray(m.classes) ? m.classes[0] : m.classes;
    return { membershipId: m.id, id: c.id, name: c.name, gradeBand: c.grade_band, subjectId: c.subject_id };
  });
}

export async function listInvitations(studentId) {
  const result = await supabase.from("class_memberships")
    .select("id,status,created_at,classes!inner(id,name,grade_band,teacher_id)")
    .eq("student_id", studentId).eq("status", "invited").order("created_at", { ascending: false });
  throwDatabaseError(result.error, "list invitations");
  const rows = result.data || [];
  const teacherIds = [...new Set(rows.map((m) => (Array.isArray(m.classes) ? m.classes[0] : m.classes).teacher_id))];
  const teachers = teacherIds.length
    ? (await supabase.from("profiles").select("id,full_name").in("id", teacherIds)).data || []
    : [];
  const byId = new Map(teachers.map((t) => [t.id, t]));
  return rows.map((m) => {
    const c = Array.isArray(m.classes) ? m.classes[0] : m.classes;
    return { membershipId: m.id, classId: c.id, name: c.name, gradeBand: c.grade_band, teacher: byId.get(c.teacher_id) || null };
  });
}

export async function requestJoin(studentId, joinCode) {
  const code = String(joinCode || "").trim().toUpperCase();
  if (!code) throw appError("VALIDATION_ERROR", "Cần mã lớp.");
  const classResult = await supabase.from("classes").select("id,org_id,name").eq("join_code", code).maybeSingle();
  throwDatabaseError(classResult.error, "find class by code");
  const klass = classResult.data;
  if (!klass) throw appError("CLASS_NOT_FOUND", "Mã lớp không đúng.");

  const student = await loadProfile(studentId);
  if (student.org_id !== klass.org_id) throw appError("CLASS_NOT_FOUND", "Mã lớp không đúng.");

  const existing = await supabase.from("class_memberships").select("id,status")
    .eq("class_id", klass.id).eq("student_id", studentId).maybeSingle();
  throwDatabaseError(existing.error, "check membership before join");
  const current = existing.data;
  if (current?.status === "active") throw appError("ALREADY_MEMBER", "Bạn đã là thành viên lớp này.");
  // If already invited by the teacher, requesting converges to active.
  const nextStatus = current?.status === "invited" ? "active" : "requested";

  if (current) {
    const upd = await supabase.from("class_memberships")
      .update({ status: nextStatus, decided_at: nextStatus === "active" ? new Date().toISOString() : null })
      .eq("id", current.id).select("id,status").single();
    throwDatabaseError(upd.error, "update membership on request");
    return { ...upd.data, className: klass.name };
  }
  const ins = await supabase.from("class_memberships")
    .insert({ class_id: klass.id, student_id: studentId, status: "requested" })
    .select("id,status").single();
  throwDatabaseError(ins.error, "insert join request");
  return { ...ins.data, className: klass.name };
}

export async function respondInvite(studentId, membershipId, response) {
  const action = response === "accept" ? "accept_invite" : response === "decline" ? "decline_invite" : null;
  if (!action) throw appError("VALIDATION_ERROR", "Phản hồi không hợp lệ.");
  const memResult = await supabase.from("class_memberships").select("id,status,student_id")
    .eq("id", membershipId).eq("student_id", studentId).maybeSingle();
  throwDatabaseError(memResult.error, "load invitation");
  if (!memResult.data) throw appError("MEMBERSHIP_NOT_FOUND", "Không tìm thấy lời mời.");

  const nextStatus = nextMembershipStatus(action, memResult.data.status);
  const upd = await supabase.from("class_memberships")
    .update({ status: nextStatus, decided_at: new Date().toISOString() })
    .eq("id", membershipId).select("id,status").single();
  throwDatabaseError(upd.error, "respond to invitation");
  return upd.data;
}
