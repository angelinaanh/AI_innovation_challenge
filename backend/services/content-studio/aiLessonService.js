import { emitContentPublished } from "../realtime/realtimeHub.js";
import { supabase } from "../supabase.js";
import { throwDatabaseError } from "../student/studentContext.js";
import { validateGeneratedCourse, validateSingleLesson } from "./aiLessonRules.js";

function appError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

async function loadTeacher(teacherId) {
  const result = await supabase.from("profiles")
    .select("id,org_id,role")
    .eq("id", teacherId).eq("role", "teacher").single();
  throwDatabaseError(result.error, "load AI lesson teacher");
  return result.data;
}

async function loadOwnedClass(teacher, classId) {
  const result = await supabase.from("classes")
    .select("id,org_id,teacher_id,name,grade_level")
    .eq("id", classId).maybeSingle();
  throwDatabaseError(result.error, "load AI lesson class");
  if (!result.data) throw appError("CONTENT_NOT_FOUND", "Không tìm thấy lớp học này.");
  if (result.data.teacher_id !== teacher.id || result.data.org_id !== teacher.org_id) {
    throw appError("CONTENT_FORBIDDEN", "Bạn chỉ có thể lưu bài giảng vào lớp mình phụ trách.");
  }
  return result.data;
}

async function writeAudit({ teacher, action, entityId, payload = {} }) {
  const result = await supabase.from("audit_log").insert({
    org_id: teacher.org_id,
    actor_id: teacher.id,
    action,
    entity_type: "lesson",
    entity_id: entityId,
    payload,
  });
  throwDatabaseError(result.error, `write ${action} audit`);
}

/**
 * Đổi 1 bài giảng AI (shape steam_lesson) thành các row questions để dùng lại
 * ngân hàng câu hỏi hiện có. answer_key.index trỏ vào vị trí đáp án đúng, khớp
 * quy ước của Content Studio cũ; feedback từng phương án lưu ở optionFeedback.
 */
function questionRowsFor(lesson, lessonRowId, classRow) {
  return (lesson.evaluation?.quizzes || []).map((quiz) => {
    const options = quiz.options.map((option) => option.text);
    return {
      lesson_id: lessonRowId,
      grade_band: gradeBandOf(classRow.grade_level),
      type: "mcq",
      difficulty: "medium",
      steam_weights: {},
      body: quiz.question,
      options,
      answer_key: {
        index: quiz.options.findIndex((option) => option.is_correct),
        explanation: quiz.options.find((option) => option.is_correct)?.feedback || "",
        optionFeedback: quiz.options.map((option) => option.feedback || ""),
      },
      status: "DRAFT",
    };
  });
}

function gradeBandOf(gradeLevel) {
  const grade = Number(gradeLevel);
  if (grade <= 5) return "primary";
  if (grade <= 9) return "secondary";
  return "high_school";
}

/**
 * Bấm "Hoàn thành" ở bước 3: lưu cả khóa bài giảng (đã được giáo viên sửa) vào
 * public.lessons với content_format = 'steam_lesson', gắn vào lớp đã chọn.
 */
export async function saveGeneratedCourse(teacherId, payload) {
  const teacher = await loadTeacher(teacherId);
  const invalid = validateGeneratedCourse(payload);
  if (invalid) throw appError("VALIDATION_ERROR", invalid);
  const classRow = await loadOwnedClass(teacher, payload.classId);

  const courseResult = await supabase.from("ai_lesson_courses").insert({
    org_id: teacher.org_id,
    teacher_id: teacher.id,
    class_id: classRow.id,
    subject: payload.subject.trim(),
    grade: String(payload.grade).trim(),
    level: payload.level,
    quiz_count: payload.quizCount,
    document_id: payload.documentId || null,
    source_filename: payload.sourceFilename || null,
    course_outline: payload.courseOutline || {},
  }).select("id").single();
  throwDatabaseError(courseResult.error, "save AI lesson course");
  const courseId = courseResult.data.id;

  const lessonRows = payload.lessons.map((lesson, index) => ({
    class_id: classRow.id,
    ai_course_id: courseId,
    created_by: teacher.id,
    chapter_title: lesson.chapter_title || "",
    outline_lesson_id: lesson.lesson_id,
    order_index: index,
    status: "DRAFT",
    difficulty: payload.level === "Advanced" ? "advanced" : "basic",
    content_format: "steam_lesson",
    content: lesson,
    generated_by: payload.generatedBy || "ai-service/lesson-generator",
  }));

  const insertResult = await supabase.from("lessons").insert(lessonRows)
    .select("id,outline_lesson_id,order_index");
  throwDatabaseError(insertResult.error, "save AI lessons");
  const savedLessons = insertResult.data || [];

  // class_lessons là nguồn sự thật về "lớp nào thấy bài nào" (migration 0009).
  // lessons.class_id chỉ còn ghi nhận lớp gốc nơi bài được tạo.
  await assignLessonRows(classRow.id, savedLessons.map((row) => row.id), teacher.id);

  // Quiz đi kèm từng bài -> ngân hàng câu hỏi, để lesson player chấm được.
  const byOrder = new Map(savedLessons.map((row) => [row.order_index, row.id]));
  const questionRows = payload.lessons.flatMap((lesson, index) => {
    const lessonRowId = byOrder.get(index);
    return lessonRowId ? questionRowsFor(lesson, lessonRowId, classRow) : [];
  });
  if (questionRows.length > 0) {
    const questionResult = await supabase.from("questions").insert(questionRows);
    throwDatabaseError(questionResult.error, "save AI lesson questions");
  }

  await writeAudit({
    teacher,
    action: "AI_COURSE_SAVED",
    entityId: courseId,
    payload: {
      classId: classRow.id,
      lessonCount: savedLessons.length,
      questionCount: questionRows.length,
    },
  });

  return {
    courseId,
    classId: classRow.id,
    className: classRow.name,
    lessonCount: savedLessons.length,
    questionCount: questionRows.length,
    lessonIds: savedLessons.map((row) => row.id),
  };
}

async function assignLessonRows(classId, lessonIds, assignedBy) {
  if (lessonIds.length === 0) return;
  const result = await supabase.from("class_lessons")
    .upsert(
      lessonIds.map((lessonId) => ({
        class_id: classId,
        lesson_id: lessonId,
        assigned_by: assignedBy,
      })),
      { onConflict: "class_id,lesson_id", ignoreDuplicates: true },
    );
  throwDatabaseError(result.error, "assign lessons to class");
}

// Chỉ đọc các cột cần cho danh sách — content jsonb rất nặng, không select ở
// đây nếu không mỗi lần mở danh sách sẽ kéo về cả khóa học.
const LESSON_LIST_COLUMNS =
  "id,ai_course_id,class_id,status,difficulty,chapter_title,outline_lesson_id,order_index,published_at,created_at";

// `course` để danh sách phẳng (trong lớp / phía học sinh) biết bài thuộc MÔN
// nào — một lớp thường được gán bài từ nhiều khóa khác nhau, thiếu trường này
// thì giao diện không thể nhóm theo môn.
function lessonCard(row, course = null) {
  return {
    id: row.id,
    courseId: row.ai_course_id,
    classId: row.class_id,
    status: row.status,
    subject: course?.subject || "",
    grade: course?.grade || "",
    level: course?.level || "",
    chapterTitle: row.chapter_title || "",
    outlineLessonId: row.outline_lesson_id || "",
    orderIndex: row.order_index,
    title: row.content?.lesson_title || "Bài giảng chưa đặt tên",
    engageHook: row.content?.engage_hook || "",
    sectionCount: row.content?.sections?.length || 0,
    quizCount: row.content?.evaluation?.quizzes?.length || 0,
    hasQuest: Boolean(row.content?.practical_quest),
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

/** Nạp thông tin khóa (môn/khối) cho một tập bài giảng, tra theo ai_course_id. */
async function coursesByIdFor(lessonRows) {
  const courseIds = [...new Set(lessonRows.map((row) => row.ai_course_id).filter(Boolean))];
  if (courseIds.length === 0) return new Map();
  const result = await supabase.from("ai_lesson_courses")
    .select("id,subject,grade,level").in("id", courseIds);
  throwDatabaseError(result.error, "load courses for AI lessons");
  return new Map((result.data || []).map((row) => [row.id, row]));
}

// order_index đánh số TRONG TỪNG khóa, nên sắp xếp thuần theo nó sẽ trộn lẫn
// các môn (Bài 1.1 Toán, Bài 1.1 Lí, Bài 2.1 Toán...). Gom theo môn trước, rồi
// mới tới thứ tự bài trong môn.
function bySubjectThenOrder(a, b) {
  const subject = (a.subject || "").localeCompare(b.subject || "", "vi");
  if (subject !== 0) return subject;
  return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
}

/** Danh sách khóa bài giảng AI của giáo viên, kèm các bài và trạng thái. */
export async function listTeacherAiCourses(teacherId) {
  const teacher = await loadTeacher(teacherId);
  const coursesResult = await supabase.from("ai_lesson_courses")
    .select("id,class_id,subject,grade,level,quiz_count,source_filename,created_at")
    .eq("teacher_id", teacher.id)
    .order("created_at", { ascending: false });
  throwDatabaseError(coursesResult.error, "list AI lesson courses");
  const courses = coursesResult.data || [];
  if (courses.length === 0) return { courses: [], counts: { draft: 0, published: 0 } };

  const lessonsResult = await supabase.from("lessons")
    .select(`${LESSON_LIST_COLUMNS},content`)
    .in("ai_course_id", courses.map((course) => course.id))
    .order("order_index", { ascending: true });
  throwDatabaseError(lessonsResult.error, "list AI lessons");

  // Mỗi bài có thể đang được gán cho nhiều lớp — kèm theo để giáo viên thấy
  // ngay bài nào đã phát cho lớp nào mà không phải mở từng lớp.
  const allLessonIds = (lessonsResult.data || []).map((row) => row.id);
  const assignments = await assignmentsFor({ lessonIds: allLessonIds });
  const classesByLesson = new Map();
  for (const row of assignments) {
    if (!classesByLesson.has(row.lesson_id)) classesByLesson.set(row.lesson_id, []);
    classesByLesson.get(row.lesson_id).push(row.class_id);
  }
  const lessons = (lessonsResult.data || []).map((row) => ({
    ...lessonCard(row),
    assignedClassIds: classesByLesson.get(row.id) || [],
  }));

  const classIds = [...new Set([
    ...courses.map((course) => course.class_id).filter(Boolean),
    ...assignments.map((row) => row.class_id),
  ])];
  const classResult = classIds.length
    ? await supabase.from("classes").select("id,name,grade_level").in("id", classIds)
    : { data: [], error: null };
  throwDatabaseError(classResult.error, "load AI lesson classes");
  const classes = new Map((classResult.data || []).map((row) => [row.id, row]));

  return {
    // Tra cứu tên lớp cho assignedClassIds ở phía giao diện.
    classes: (classResult.data || []).map((row) => ({
      id: row.id, name: row.name, gradeLevel: row.grade_level,
    })),
    courses: courses.map((course) => ({
      id: course.id,
      subject: course.subject,
      grade: course.grade,
      level: course.level,
      quizCount: course.quiz_count,
      sourceFilename: course.source_filename,
      createdAt: course.created_at,
      class: classes.get(course.class_id) || null,
      lessons: lessons.filter((lesson) => lesson.courseId === course.id),
    })),
    counts: {
      draft: lessons.filter((lesson) => lesson.status === "DRAFT").length,
      published: lessons.filter((lesson) => lesson.status === "PUBLISHED").length,
    },
  };
}

async function loadOwnedAiLesson(teacher, lessonId) {
  const result = await supabase.from("lessons")
    .select(`${LESSON_LIST_COLUMNS},content,content_format,created_by`)
    .eq("id", lessonId).maybeSingle();
  throwDatabaseError(result.error, "load AI lesson");
  const lesson = result.data;
  if (!lesson) throw appError("CONTENT_NOT_FOUND", "Không tìm thấy bài giảng này.");
  if (lesson.content_format !== "steam_lesson") {
    throw appError("CONTENT_NOT_FOUND", "Bài học này không thuộc luồng bài giảng AI.");
  }
  if (lesson.created_by !== teacher.id) {
    throw appError("CONTENT_FORBIDDEN", "Bạn không phải người tạo bài giảng này.");
  }
  return lesson;
}

export async function getTeacherAiLesson(teacherId, lessonId) {
  const teacher = await loadTeacher(teacherId);
  const lesson = await loadOwnedAiLesson(teacher, lessonId);
  return { ...lessonCard(lesson), content: lesson.content };
}

/** Giáo viên sửa lại nội dung bài giảng đã lưu. Sửa xong quay về DRAFT. */
export async function updateAiLesson(teacherId, lessonId, payload) {
  const teacher = await loadTeacher(teacherId);
  await loadOwnedAiLesson(teacher, lessonId);
  const invalid = validateSingleLesson(payload?.content);
  if (invalid) throw appError("VALIDATION_ERROR", invalid);

  const result = await supabase.from("lessons").update({
    content: payload.content,
    status: "DRAFT",
    published_at: null,
  }).eq("id", lessonId).select("id,status").single();
  throwDatabaseError(result.error, "update AI lesson");
  await syncLessonQuestions(lessonId, payload.content);
  await writeAudit({ teacher, action: "AI_LESSON_UPDATED", entityId: lessonId });
  return result.data;
}

/**
 * Quiz được ghi đè hoàn toàn theo nội dung mới. Xóa-rồi-chèn thay vì diff từng
 * câu: câu hỏi bài giảng AI chưa có attempt nào tham chiếu tới lúc còn DRAFT.
 */
async function syncLessonQuestions(lessonId, content) {
  const deleteResult = await supabase.from("questions").delete().eq("lesson_id", lessonId);
  throwDatabaseError(deleteResult.error, "replace AI lesson questions");
  // Từ migration 0009, class_lessons tạo thêm đường nối nhiều-nhiều giữa
  // lessons và classes, nên embed "classes(...)" trở nên nhập nhằng
  // (PGRST201). Chỉ đích danh khóa ngoại trực tiếp — lớp gốc của bài giảng.
  const lessonResult = await supabase.from("lessons")
    .select("class_id,classes!lessons_class_id_fkey(grade_level)")
    .eq("id", lessonId).single();
  throwDatabaseError(lessonResult.error, "load AI lesson class for questions");
  // PostgREST trả quan hệ lồng khi thì object khi thì mảng tùy cách suy ra
  // cardinality — chuẩn hoá như các service khác trong repo.
  const joined = lessonResult.data?.classes;
  const classRow = Array.isArray(joined) ? joined[0] : joined;
  const rows = questionRowsFor(content, lessonId, { grade_level: classRow?.grade_level });
  if (rows.length === 0) return;
  const insertResult = await supabase.from("questions").insert(rows);
  throwDatabaseError(insertResult.error, "save AI lesson questions");
}

/** Xuất bản: học sinh trong lớp chỉ thấy bài ở trạng thái PUBLISHED. */
export async function publishAiLessons(teacherId, { courseId, lessonId }) {
  const teacher = await loadTeacher(teacherId);
  let targetIds = [];

  if (lessonId) {
    await loadOwnedAiLesson(teacher, lessonId);
    targetIds = [lessonId];
  } else if (courseId) {
    const courseResult = await supabase.from("ai_lesson_courses")
      .select("id,teacher_id").eq("id", courseId).maybeSingle();
    throwDatabaseError(courseResult.error, "load AI course for publish");
    if (!courseResult.data) throw appError("CONTENT_NOT_FOUND", "Không tìm thấy khóa bài giảng này.");
    if (courseResult.data.teacher_id !== teacher.id) {
      throw appError("CONTENT_FORBIDDEN", "Bạn không phải người tạo khóa bài giảng này.");
    }
    const lessonsResult = await supabase.from("lessons").select("id").eq("ai_course_id", courseId);
    throwDatabaseError(lessonsResult.error, "load AI course lessons for publish");
    targetIds = (lessonsResult.data || []).map((row) => row.id);
  } else {
    throw appError("VALIDATION_ERROR", "Cần chỉ định bài giảng hoặc khóa cần xuất bản.");
  }
  if (targetIds.length === 0) throw appError("CONTENT_NOT_FOUND", "Không có bài giảng nào để xuất bản.");

  const now = new Date().toISOString();
  const result = await supabase.from("lessons")
    .update({ status: "PUBLISHED", reviewed_by: teacher.id, published_at: now })
    .in("id", targetIds).select("id");
  throwDatabaseError(result.error, "publish AI lessons");
  const questionResult = await supabase.from("questions")
    .update({ status: "PUBLISHED" }).in("lesson_id", targetIds);
  throwDatabaseError(questionResult.error, "publish AI lesson questions");

  await writeAudit({
    teacher,
    action: "AI_LESSONS_PUBLISHED",
    entityId: courseId || lessonId,
    payload: { lessonIds: targetIds },
  });
  emitContentPublished({
    orgId: teacher.org_id,
    teacherId: teacher.id,
    lessonId: targetIds[0],
    skillNodeId: null,
    publishedAt: now,
  });
  return { publishedCount: targetIds.length, lessonIds: targetIds, publishedAt: now };
}

/** Đưa bài giảng trở lại nháp — học sinh sẽ không còn thấy. */
export async function unpublishAiLesson(teacherId, lessonId) {
  const teacher = await loadTeacher(teacherId);
  await loadOwnedAiLesson(teacher, lessonId);
  const result = await supabase.from("lessons")
    .update({ status: "DRAFT", published_at: null })
    .eq("id", lessonId).select("id,status").single();
  throwDatabaseError(result.error, "unpublish AI lesson");
  const questionResult = await supabase.from("questions")
    .update({ status: "DRAFT" }).eq("lesson_id", lessonId);
  throwDatabaseError(questionResult.error, "unpublish AI lesson questions");
  await writeAudit({ teacher, action: "AI_LESSON_UNPUBLISHED", entityId: lessonId });
  return result.data;
}

// -------------------------------------------- Gán bài giảng vào lớp học ----

/** Bài giảng AI đang được gán cho một lớp (trang chi tiết lớp học). */
export async function listClassAiLessons(teacherId, classId) {
  const teacher = await loadTeacher(teacherId);
  const classRow = await loadOwnedClass(teacher, classId);

  const assignments = await supabase.from("class_lessons")
    .select("lesson_id,assigned_at").eq("class_id", classRow.id)
    .order("assigned_at", { ascending: true });
  throwDatabaseError(assignments.error, "list class lesson assignments");
  const lessonIds = (assignments.data || []).map((row) => row.lesson_id);
  if (lessonIds.length === 0) return { classId: classRow.id, lessons: [] };

  const lessonsResult = await supabase.from("lessons")
    .select(`${LESSON_LIST_COLUMNS},content`)
    .in("id", lessonIds)
    .order("order_index", { ascending: true });
  throwDatabaseError(lessonsResult.error, "load class AI lessons");
  const lessonRows = lessonsResult.data || [];
  const courses = await coursesByIdFor(lessonRows);
  const lessons = lessonRows
    .map((row) => lessonCard(row, courses.get(row.ai_course_id)))
    .sort(bySubjectThenOrder);
  return { classId: classRow.id, lessons };
}

/**
 * Gán bài giảng vào lớp. Chỉ nhận bài do chính giáo viên tạo — nếu không một
 * giáo viên có thể phát tán bài của người khác vào lớp mình.
 */
export async function assignAiLessonsToClass(teacherId, classId, lessonIds) {
  const teacher = await loadTeacher(teacherId);
  const classRow = await loadOwnedClass(teacher, classId);
  const ids = [...new Set((lessonIds || []).map(String).filter(Boolean))];
  if (ids.length === 0) throw appError("VALIDATION_ERROR", "Hãy chọn ít nhất một bài giảng.");

  const ownedResult = await supabase.from("lessons")
    .select("id,created_by,content_format").in("id", ids);
  throwDatabaseError(ownedResult.error, "verify lesson ownership");
  const owned = ownedResult.data || [];
  if (owned.length !== ids.length
    || owned.some((row) => row.created_by !== teacher.id || row.content_format !== "steam_lesson")) {
    throw appError("CONTENT_FORBIDDEN", "Chỉ gán được bài giảng AI do bạn tạo.");
  }

  await assignLessonRows(classRow.id, ids, teacher.id);
  await writeAudit({
    teacher,
    action: "AI_LESSONS_ASSIGNED",
    entityId: classRow.id,
    payload: { classId: classRow.id, lessonIds: ids },
  });
  return { classId: classRow.id, assignedCount: ids.length };
}

/** Gỡ bài khỏi lớp. Bài giảng vẫn còn trong thư viện, chỉ mất ở lớp này. */
export async function removeAiLessonFromClass(teacherId, classId, lessonId) {
  const teacher = await loadTeacher(teacherId);
  const classRow = await loadOwnedClass(teacher, classId);
  const result = await supabase.from("class_lessons")
    .delete().eq("class_id", classRow.id).eq("lesson_id", lessonId).select("lesson_id");
  throwDatabaseError(result.error, "remove lesson from class");
  if ((result.data || []).length === 0) {
    throw appError("CONTENT_NOT_FOUND", "Bài giảng này không nằm trong lớp.");
  }
  await writeAudit({
    teacher,
    action: "AI_LESSON_UNASSIGNED",
    entityId: classRow.id,
    payload: { classId: classRow.id, lessonId },
  });
  return { classId: classRow.id, lessonId };
}

// ------------------------------------------------------------- Học sinh ----
async function activeClassIdsOf(studentId) {
  const result = await supabase.from("class_memberships")
    .select("class_id").eq("student_id", studentId).eq("status", "active");
  throwDatabaseError(result.error, "load student classes for AI lessons");
  return [...new Set((result.data || []).map((row) => row.class_id).filter(Boolean))];
}

/**
 * Bảng nối class_lessons -> map lessonId sang danh sách lớp được gán.
 * Một bài có thể nằm trong nhiều lớp nên không thể suy từ lessons.class_id.
 */
async function assignmentsFor({ classIds, lessonIds }) {
  let query = supabase.from("class_lessons").select("class_id,lesson_id,assigned_at");
  if (classIds) {
    if (classIds.length === 0) return [];
    query = query.in("class_id", classIds);
  }
  if (lessonIds) {
    if (lessonIds.length === 0) return [];
    query = query.in("lesson_id", lessonIds);
  }
  const result = await query;
  throwDatabaseError(result.error, "load class lesson assignments");
  return result.data || [];
}

/** Bài giảng AI đã xuất bản trong các lớp học sinh đang tham gia. */
export async function listStudentAiLessons(studentId) {
  const classIds = await activeClassIdsOf(studentId);
  if (classIds.length === 0) return { classes: [], lessonCount: 0 };

  const assignments = await assignmentsFor({ classIds });
  const assignedLessonIds = [...new Set(assignments.map((row) => row.lesson_id))];
  if (assignedLessonIds.length === 0) return { classes: [], lessonCount: 0 };

  const lessonsResult = await supabase.from("lessons")
    .select(`${LESSON_LIST_COLUMNS},content`)
    .in("id", assignedLessonIds)
    .eq("content_format", "steam_lesson")
    .eq("status", "PUBLISHED")
    .order("order_index", { ascending: true });
  throwDatabaseError(lessonsResult.error, "list student AI lessons");
  const publishedRows = lessonsResult.data || [];
  const publishedById = new Map(publishedRows.map((row) => [row.id, row]));
  const courses = await coursesByIdFor(publishedRows);

  // Cùng một bài gán cho nhiều lớp -> xuất hiện dưới mỗi lớp mà học sinh học.
  const lessons = assignments
    .filter((row) => publishedById.has(row.lesson_id))
    .map((row) => {
      const lessonRow = publishedById.get(row.lesson_id);
      return {
        ...lessonCard(lessonRow, courses.get(lessonRow.ai_course_id)),
        classId: row.class_id,
      };
    })
    .sort(bySubjectThenOrder);

  const classResult = await supabase.from("classes")
    .select("id,name,grade_level,teacher_id").in("id", classIds);
  throwDatabaseError(classResult.error, "load student classes");
  const classRows = classResult.data || [];

  const teacherIds = [...new Set(classRows.map((row) => row.teacher_id).filter(Boolean))];
  const teacherResult = teacherIds.length
    ? await supabase.from("profiles").select("id,full_name").in("id", teacherIds)
    : { data: [], error: null };
  throwDatabaseError(teacherResult.error, "load AI lesson teachers");
  const teachers = new Map((teacherResult.data || []).map((row) => [row.id, row]));

  // Chỉ trả lớp thực sự có bài — học sinh không cần thấy lớp trống ở đây.
  const classes = classRows
    .map((row) => ({
      id: row.id,
      name: row.name,
      gradeLevel: row.grade_level,
      teacher: teachers.get(row.teacher_id) || null,
      lessons: lessons.filter((lesson) => lesson.classId === row.id),
    }))
    .filter((row) => row.lessons.length > 0);

  return { classes, lessonCount: lessons.length };
}

export async function getStudentAiLesson(studentId, lessonId) {
  const classIds = await activeClassIdsOf(studentId);
  if (classIds.length === 0) throw appError("CONTENT_FORBIDDEN", "Bạn chưa tham gia lớp nào.");

  // Quyền xem đến từ việc bài được GÁN vào lớp học sinh đang học, không phải
  // từ lessons.class_id (lớp gốc) — bài có thể được gán sang lớp khác.
  const assignments = await assignmentsFor({ classIds, lessonIds: [lessonId] });
  if (assignments.length === 0) {
    throw appError("CONTENT_NOT_FOUND", "Không tìm thấy bài giảng này trong lớp của bạn.");
  }

  const result = await supabase.from("lessons")
    .select(`${LESSON_LIST_COLUMNS},content,content_format`)
    .eq("id", lessonId)
    .eq("content_format", "steam_lesson")
    .eq("status", "PUBLISHED")
    .maybeSingle();
  throwDatabaseError(result.error, "load student AI lesson");
  if (!result.data) {
    // Gộp "không tồn tại" và "không có quyền" vào một thông điệp: không tiết lộ
    // bài giảng của lớp khác có tồn tại hay không.
    throw appError("CONTENT_NOT_FOUND", "Không tìm thấy bài giảng này trong lớp của bạn.");
  }
  return { ...lessonCard(result.data), content: result.data.content };
}
