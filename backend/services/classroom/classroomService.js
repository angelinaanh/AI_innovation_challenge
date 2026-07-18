import { supabase } from "../supabase.js";
import { throwDatabaseError } from "../student/studentContext.js";
import { emitClassMembershipUpdated } from "../realtime/realtimeHub.js";
import {
  generateJoinCode,
  isGradeBand,
  isGradeInBand,
  isSubjectInGrade,
  gradeBandForLevel,
  normalizeGradeLevel,
  nextMembershipStatus,
} from "./classroomRules.js";

function appError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

async function loadProfile(userId) {
  const result = await supabase.from("profiles").select("id,org_id,role,full_name,email,grade_level,grade_band")
    .eq("id", userId).single();
  throwDatabaseError(result.error, "load classroom profile");
  return result.data;
}

async function loadOwnedClass(teacherId, classId) {
  const result = await supabase.from("classes")
    .select("id,teacher_id,org_id,name,grade_level,grade_band,max_members,description,join_code,created_at")
    .eq("id", classId).eq("teacher_id", teacherId).maybeSingle();
  throwDatabaseError(result.error, "load owned class");
  if (!result.data) throw appError("CLASS_NOT_FOUND", "Không tìm thấy lớp này.");
  return result.data;
}

async function loadSubjectsForClasses(classIds) {
  const ids = [...new Set(classIds.filter(Boolean))];
  if (ids.length === 0) return new Map();
  const result = await supabase.from("class_subjects")
    .select("class_id,subjects(id,name,steam_axis,grade_level,grade_band,org_id)")
    .in("class_id", ids);
  throwDatabaseError(result.error, "load class subjects");

  const byClass = new Map();
  for (const row of result.data || []) {
    const subject = Array.isArray(row.subjects) ? row.subjects[0] : row.subjects;
    if (!subject) continue;
    if (!byClass.has(row.class_id)) byClass.set(row.class_id, []);
    byClass.get(row.class_id).push(subject);
  }
  return byClass;
}

async function validateClassSubjects(profile, subjectIds, gradeLevel) {
  const ids = [...new Set((subjectIds || []).map(String).filter(Boolean))];
  if (ids.length === 0) {
    throw appError("VALIDATION_ERROR", "Cần chọn ít nhất một môn học.");
  }

  const result = await supabase.from("subjects")
    .select("id,name,steam_axis,grade_level,grade_band,org_id")
    .in("id", ids);
  throwDatabaseError(result.error, "validate class subjects");

  const found = result.data || [];
  if (
    found.length !== ids.length
    || found.some((subject) => subject.org_id !== profile.org_id || !isSubjectInGrade(subject, gradeLevel))
  ) {
    throw appError("SUBJECT_INVALID", "Môn học không thuộc đúng lớp hoặc tổ chức này.");
  }
  return found;
}

function parseMaxMembers(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
    throw appError("VALIDATION_ERROR", "Số thành viên tối đa phải là số nguyên từ 1 đến 100.");
  }
  return parsed;
}

function assertCapacity(klass, activeCount) {
  if (klass.max_members != null && activeCount >= klass.max_members) {
    throw appError("CLASS_FULL", "Lớp đã đủ số lượng thành viên tối đa.");
  }
}

async function countActiveMembers(classId) {
  const result = await supabase.from("class_memberships")
    .select("id", { count: "exact", head: true })
    .eq("class_id", classId).eq("status", "active");
  throwDatabaseError(result.error, "count active class members");
  return result.count || 0;
}

function serializeClass(row, subjects = []) {
  return {
    ...row,
    gradeLevel: row.grade_level,
    gradeBand: row.grade_band,
    maxMembers: row.max_members,
    subjects,
    subject: subjects[0] || null,
  };
}

// ---- Subjects catalog ------------------------------------------------------

export async function listSubjects(userId, gradeLevelInput) {
  const profile = await loadProfile(userId);
  const gradeLevel = normalizeGradeLevel(gradeLevelInput);
  if (gradeLevelInput !== undefined && gradeLevelInput !== "" && !gradeLevel) {
    throw appError("VALIDATION_ERROR", "Lớp học không hợp lệ. Vui lòng chọn từ lớp 1 đến lớp 12.");
  }

  let query = supabase.from("subjects").select("id,name,steam_axis,grade_level,grade_band")
    .eq("org_id", profile.org_id).order("grade_level").order("steam_axis").order("name");
  if (gradeLevel) query = query.eq("grade_level", gradeLevel);
  const result = await query;
  throwDatabaseError(result.error, "list subjects");
  return result.data || [];
}

// ---- Teacher flow ----------------------------------------------------------

export async function createClass(teacherId, {
  name,
  gradeLevel: gradeLevelInput,
  subjectIds,
  description,
  maxMembers,
}) {
  const cleanName = String(name || "").trim();
  const cleanDescription = String(description || "").trim();
  const gradeLevel = normalizeGradeLevel(gradeLevelInput);
  if (cleanName.length < 2) throw appError("VALIDATION_ERROR", "Tên lớp cần ít nhất 2 ký tự.");
  if (cleanName.length > 80) throw appError("VALIDATION_ERROR", "Tên lớp tối đa 80 ký tự.");
  if (cleanDescription.length > 500) throw appError("VALIDATION_ERROR", "Mô tả lớp tối đa 500 ký tự.");
  if (!gradeLevel) throw appError("VALIDATION_ERROR", "Lớp học không hợp lệ. Vui lòng chọn từ lớp 1 đến lớp 12.");

  const gradeBand = gradeBandForLevel(gradeLevel);
  const cleanMaxMembers = parseMaxMembers(maxMembers);
  const teacher = await loadProfile(teacherId);
  if (teacher.role !== "teacher") throw appError("AUTH_FORBIDDEN", "Chỉ giáo viên được tạo lớp.");
  const subjects = await validateClassSubjects(teacher, subjectIds);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const result = await supabase.from("classes").insert({
      org_id: teacher.org_id,
      teacher_id: teacherId,
      name: cleanName,
      grade_level: gradeLevel,
      grade_band: gradeBand,
      max_members: cleanMaxMembers,
      description: cleanDescription || null,
      join_code: generateJoinCode(),
    }).select("id,name,grade_level,grade_band,max_members,description,join_code,created_at").single();

    if (result.error) {
      if (result.error.code === "23505") continue;
      throwDatabaseError(result.error, "create class");
    }

    const subjectLinks = await supabase.from("class_subjects")
      .insert(subjects.map((subject) => ({
        class_id: result.data.id,
        subject_id: subject.id,
        grade_level: gradeLevel,
      })));
    if (subjectLinks.error) {
      await supabase.from("classes").delete().eq("id", result.data.id);
      throwDatabaseError(subjectLinks.error, "link class subjects");
    }
    return serializeClass(result.data, subjects);
  }
  throw appError("CLASS_CODE_COLLISION", "Không tạo được mã lớp, hãy thử lại.");
}

export async function listTeacherClasses(teacherId) {
  const result = await supabase.from("classes")
    .select("id,name,grade_level,grade_band,max_members,description,join_code,created_at")
    .eq("teacher_id", teacherId).order("created_at", { ascending: false });
  throwDatabaseError(result.error, "list teacher classes");
  const classes = result.data || [];
  if (classes.length === 0) return [];
  const subjectsByClass = await loadSubjectsForClasses(classes.map((item) => item.id));

  const membersResult = await supabase.from("class_memberships")
    .select("class_id,status").in("class_id", classes.map((c) => c.id));
  throwDatabaseError(membersResult.error, "count class members");
  const counts = {};
  for (const m of membersResult.data || []) {
    counts[m.class_id] = counts[m.class_id] || { active: 0, pending: 0 };
    if (m.status === "active") counts[m.class_id].active += 1;
    else if (m.status === "invited" || m.status === "requested") counts[m.class_id].pending += 1;
  }
  return classes.map((c) => ({
    ...serializeClass(c, subjectsByClass.get(c.id) || []),
    memberCount: counts[c.id]?.active || 0,
    pendingCount: counts[c.id]?.pending || 0,
  }));
}

export async function getClassMembers(teacherId, classId) {
  const klass = await loadOwnedClass(teacherId, classId);
  const result = await supabase.from("class_memberships")
    .select("id,student_id,status,created_at")
    .eq("class_id", classId).in("status", ["active", "invited", "requested"])
    .order("created_at", { ascending: true });
  throwDatabaseError(result.error, "load class members");

  const rows = result.data || [];
  const studentResult = rows.length
    ? await supabase.from("profiles").select("id,full_name,email")
        .in("id", rows.map((r) => r.student_id))
    : { data: [], error: null };
  throwDatabaseError(studentResult.error, "load class member profiles");
  const students = studentResult.data || [];
  const byId = new Map(students.map((s) => [s.id, s]));
  const subjectsByClass = await loadSubjectsForClasses([klass.id]);
  return {
    class: serializeClass(klass, subjectsByClass.get(klass.id) || []),
    active: rows.filter((r) => r.status === "active").map((r) => ({ ...r, student: byId.get(r.student_id) })),
    pending: rows.filter((r) => r.status !== "active").map((r) => ({ ...r, student: byId.get(r.student_id) })),
  };
}

export async function inviteStudent(teacherId, classId, studentEmail) {
  const klass = await loadOwnedClass(teacherId, classId);
  const email = String(studentEmail || "").trim().toLowerCase();
  if (!email) throw appError("VALIDATION_ERROR", "Cần email học sinh.");

  const studentResult = await supabase.from("profiles").select("id,org_id,grade_level,grade_band")
    .eq("email", email).eq("role", "student").maybeSingle();
  throwDatabaseError(studentResult.error, "find student to invite");
  const student = studentResult.data;
  if (!student || student.org_id !== klass.org_id) {
    throw appError("STUDENT_NOT_FOUND", "Không tìm thấy học sinh với email này trong tổ chức.");
  }
  if (student.grade_level !== klass.grade_level) {
    throw appError("GRADE_LEVEL_MISMATCH", `Học sinh phải thuộc lớp ${klass.grade_level} để tham gia lớp này.`);
  }

  const existing = await supabase.from("class_memberships").select("id,status")
    .eq("class_id", classId).eq("student_id", student.id).maybeSingle();
  throwDatabaseError(existing.error, "check existing membership");
  const current = existing.data;

  if (current?.status === "active") throw appError("ALREADY_MEMBER", "Học sinh đã là thành viên lớp.");
  // A pending request + an invite converge into active membership.
  const nextStatus = current?.status === "requested" ? "active" : "invited";
  if (nextStatus === "active") assertCapacity(klass, await countActiveMembers(classId));

  if (current) {
    const upd = await supabase.from("class_memberships")
      .update({ status: nextStatus, invited_by: teacherId, decided_at: nextStatus === "active" ? new Date().toISOString() : null })
      .eq("id", current.id).select("id,status").single();
    throwDatabaseError(upd.error, "update membership on invite");
    emitClassMembershipUpdated({ teacherId, studentId: student.id, classId, status: upd.data.status });
    return upd.data;
  }
  const ins = await supabase.from("class_memberships")
    .insert({ class_id: classId, student_id: student.id, status: "invited", invited_by: teacherId })
    .select("id,status").single();
  throwDatabaseError(ins.error, "insert invite membership");
  emitClassMembershipUpdated({ teacherId, studentId: student.id, classId, status: ins.data.status });
  return ins.data;
}

export async function decideRequest(teacherId, membershipId, decision) {
  const action = decision === "approve" ? "approve_request" : decision === "reject" ? "reject_request" : null;
  if (!action) throw appError("VALIDATION_ERROR", "Quyết định không hợp lệ.");

  const memResult = await supabase.from("class_memberships")
    .select("id,status,class_id,student_id,classes!inner(teacher_id,max_members)")
    .eq("id", membershipId).maybeSingle();
  throwDatabaseError(memResult.error, "load membership for decision");
  const membership = memResult.data;
  const klass = membership && (Array.isArray(membership.classes) ? membership.classes[0] : membership.classes);
  if (!membership || klass?.teacher_id !== teacherId) throw appError("MEMBERSHIP_NOT_FOUND", "Không tìm thấy yêu cầu.");

  const nextStatus = nextMembershipStatus(action, membership.status);
  if (nextStatus === "active") assertCapacity(klass, await countActiveMembers(membership.class_id));
  const upd = await supabase.from("class_memberships")
    .update({ status: nextStatus, decided_at: new Date().toISOString() })
    .eq("id", membershipId).select("id,status").single();
  throwDatabaseError(upd.error, "apply membership decision");
  emitClassMembershipUpdated({
    teacherId,
    studentId: membership.student_id,
    classId: membership.class_id,
    status: upd.data.status,
  });
  return upd.data;
}

// ---- Student flow ----------------------------------------------------------

export async function listStudentClasses(studentId) {
  const result = await supabase.from("class_memberships")
    .select("id,status,class_id,classes!inner(id,name,grade_level,grade_band,teacher_id)")
    .eq("student_id", studentId).eq("status", "active");
  throwDatabaseError(result.error, "list student classes");
  const rows = result.data || [];
  const classRows = rows.map((m) => Array.isArray(m.classes) ? m.classes[0] : m.classes);
  const subjectsByClass = await loadSubjectsForClasses(classRows.map((c) => c.id));
  const teacherIds = [...new Set(classRows.map((c) => c.teacher_id))];
  const teacherResult = teacherIds.length
    ? await supabase.from("profiles").select("id,full_name").in("id", teacherIds)
    : { data: [], error: null };
  throwDatabaseError(teacherResult.error, "load class teachers");
  const teachers = new Map((teacherResult.data || []).map((teacher) => [teacher.id, teacher]));
  return rows.map((m) => {
    const c = Array.isArray(m.classes) ? m.classes[0] : m.classes;
    return {
      membershipId: m.id,
      id: c.id,
      name: c.name,
      gradeLevel: c.grade_level,
      gradeBand: c.grade_band,
      subjects: subjectsByClass.get(c.id) || [],
      subject: (subjectsByClass.get(c.id) || [])[0] || null,
      teacher: teachers.get(c.teacher_id) || null,
    };
  });
}

export async function listInvitations(studentId) {
  const result = await supabase.from("class_memberships")
    .select("id,status,created_at,classes!inner(id,name,grade_level,grade_band,teacher_id)")
    .eq("student_id", studentId).eq("status", "invited").order("created_at", { ascending: false });
  throwDatabaseError(result.error, "list invitations");
  const rows = result.data || [];
  const teacherIds = [...new Set(rows.map((m) => (Array.isArray(m.classes) ? m.classes[0] : m.classes).teacher_id))];
  const teacherResult = teacherIds.length
    ? await supabase.from("profiles").select("id,full_name").in("id", teacherIds)
    : { data: [], error: null };
  throwDatabaseError(teacherResult.error, "load invitation teachers");
  const teachers = teacherResult.data || [];
  const byId = new Map(teachers.map((t) => [t.id, t]));
  const classRows = rows.map((m) => Array.isArray(m.classes) ? m.classes[0] : m.classes);
  const subjectsByClass = await loadSubjectsForClasses(classRows.map((c) => c.id));
  return rows.map((m) => {
    const c = Array.isArray(m.classes) ? m.classes[0] : m.classes;
    return {
      membershipId: m.id,
      classId: c.id,
      name: c.name,
      gradeLevel: c.grade_level,
      gradeBand: c.grade_band,
      subjects: subjectsByClass.get(c.id) || [],
      subject: (subjectsByClass.get(c.id) || [])[0] || null,
      teacher: byId.get(c.teacher_id) || null,
    };
  });
}

export async function requestJoin(studentId, joinCode) {
  const code = String(joinCode || "").trim().toUpperCase();
  if (!code) throw appError("VALIDATION_ERROR", "Cần mã lớp.");
  const classResult = await supabase.from("classes")
    .select("id,org_id,name,grade_level,grade_band,teacher_id,max_members")
    .eq("join_code", code).maybeSingle();
  throwDatabaseError(classResult.error, "find class by code");
  const klass = classResult.data;
  if (!klass) throw appError("CLASS_NOT_FOUND", "Mã lớp không đúng.");

  const student = await loadProfile(studentId);
  if (student.org_id !== klass.org_id) throw appError("CLASS_NOT_FOUND", "Mã lớp không đúng.");
  if (student.grade_level !== klass.grade_level) {
    throw appError("GRADE_LEVEL_MISMATCH", `Lớp này dành cho học sinh lớp ${klass.grade_level}.`);
  }

  const existing = await supabase.from("class_memberships").select("id,status")
    .eq("class_id", klass.id).eq("student_id", studentId).maybeSingle();
  throwDatabaseError(existing.error, "check membership before join");
  const current = existing.data;
  if (current?.status === "active") throw appError("ALREADY_MEMBER", "Bạn đã là thành viên lớp này.");
  // If already invited by the teacher, requesting converges to active.
  const nextStatus = current?.status === "invited" ? "active" : "requested";
  if (nextStatus === "active") assertCapacity(klass, await countActiveMembers(klass.id));

  if (current) {
    const upd = await supabase.from("class_memberships")
      .update({ status: nextStatus, decided_at: nextStatus === "active" ? new Date().toISOString() : null })
      .eq("id", current.id).select("id,status").single();
    throwDatabaseError(upd.error, "update membership on request");
    emitClassMembershipUpdated({
      teacherId: klass.teacher_id,
      studentId,
      classId: klass.id,
      status: upd.data.status,
    });
    return { ...upd.data, className: klass.name };
  }
  const ins = await supabase.from("class_memberships")
    .insert({ class_id: klass.id, student_id: studentId, status: "requested" })
    .select("id,status").single();
  throwDatabaseError(ins.error, "insert join request");
  emitClassMembershipUpdated({
    teacherId: klass.teacher_id,
    studentId,
    classId: klass.id,
    status: ins.data.status,
  });
  return { ...ins.data, className: klass.name };
}

export async function respondInvite(studentId, membershipId, response) {
  const action = response === "accept" ? "accept_invite" : response === "decline" ? "decline_invite" : null;
  if (!action) throw appError("VALIDATION_ERROR", "Phản hồi không hợp lệ.");
  const memResult = await supabase.from("class_memberships")
    .select("id,status,student_id,class_id,classes!inner(teacher_id,max_members)")
    .eq("id", membershipId).eq("student_id", studentId).maybeSingle();
  throwDatabaseError(memResult.error, "load invitation");
  if (!memResult.data) throw appError("MEMBERSHIP_NOT_FOUND", "Không tìm thấy lời mời.");

  const nextStatus = nextMembershipStatus(action, memResult.data.status);
  if (nextStatus === "active") {
    const klassForCapacity = Array.isArray(memResult.data.classes)
      ? memResult.data.classes[0]
      : memResult.data.classes;
    assertCapacity(klassForCapacity, await countActiveMembers(memResult.data.class_id));
  }
  const upd = await supabase.from("class_memberships")
    .update({ status: nextStatus, decided_at: new Date().toISOString() })
    .eq("id", membershipId).select("id,status").single();
  throwDatabaseError(upd.error, "respond to invitation");
  const klass = Array.isArray(memResult.data.classes)
    ? memResult.data.classes[0]
    : memResult.data.classes;
  emitClassMembershipUpdated({
    teacherId: klass?.teacher_id,
    studentId,
    classId: memResult.data.class_id,
    status: upd.data.status,
  });
  return upd.data;
}
