import { createClient } from "@supabase/supabase-js";

import { env } from "../utils/env.js";

const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const shouldResetProgress = process.argv.includes("--reset-progress");

const IDS = {
  organization: "00000000-0000-0000-0000-000000000001",
  loopSourceDocument: "70000000-0000-4000-8000-000000000001",
  skills: {
    intro: "10000000-0000-4000-8000-000000000001",
    events: "10000000-0000-4000-8000-000000000002",
    loops: "10000000-0000-4000-8000-000000000003",
    variables: "10000000-0000-4000-8000-000000000004",
    conditions: "10000000-0000-4000-8000-000000000005",
    story: "10000000-0000-4000-8000-000000000006",
    project: "10000000-0000-4000-8000-000000000007",
  },
};

function assertResult(result, operation) {
  if (result.error) {
    throw new Error(`${operation}: ${result.error.message}`);
  }
  return result.data;
}

async function ensureAuthUser({ email, password, fullName, role }) {
  const listed = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  assertResult(listed, `List users for ${email}`);
  const existing = listed.data.users.find((user) => user.email === email);
  if (existing) {
    return existing;
  }

  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });
  return assertResult(created, `Create ${role} demo user`).user;
}

function daysAgo(days) {
  const value = new Date();
  value.setHours(10, 0, 0, 0);
  value.setDate(value.getDate() - days);
  return value.toISOString();
}

function vietnamDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function resetDemoProgress(studentId) {
  const loopsQuestionId = "30000000-0000-4000-8000-000000000003";
  const attemptsResult = await supabase
    .from("attempts")
    .select("id")
    .eq("user_id", studentId)
    .eq("question_id", loopsQuestionId);
  const attempts = assertResult(attemptsResult, "Find demo Loops attempts") || [];

  if (attempts.length > 0) {
    const attemptIds = attempts.map((attempt) => attempt.id);
    assertResult(
      await supabase.from("score_events").delete().in("source_id", attemptIds),
      "Reset demo quiz score events",
    );
    assertResult(
      await supabase.from("attempts").delete().in("id", attemptIds),
      "Reset demo Loops attempts",
    );
  }

  assertResult(
    await supabase
      .from("exp_events")
      .delete()
      .eq("user_id", studentId)
      .eq("action_type", "quiz_mastery_reward"),
    "Reset demo quiz EXP events",
  );

  const sessionsResult = await supabase
    .from("tutor_sessions")
    .select("id")
    .eq("user_id", studentId);
  const sessions = assertResult(sessionsResult, "Find demo Tutor sessions") || [];
  if (sessions.length > 0) {
    const sessionIds = sessions.map((session) => session.id);
    assertResult(
      await supabase.from("tutor_escalations").delete().in("session_id", sessionIds),
      "Reset demo Tutor escalations",
    );
    assertResult(
      await supabase.from("tutor_sessions").delete().in("id", sessionIds),
      "Reset demo Tutor sessions",
    );
  }
}

async function seed() {
  assertResult(
    await supabase.from("organizations").upsert({
      id: IDS.organization,
      name: "STEAM for Vietnam Demo",
    }),
    "Upsert organization",
  );

  const [student, teacher] = await Promise.all([
    ensureAuthUser({
      email: "student.demo@eduone.local",
      password: "EduOneDemo!2026",
      fullName: "Minh Nguyễn",
      role: "student",
    }),
    ensureAuthUser({
      email: "teacher.demo@eduone.local",
      password: "EduOneDemo!2026",
      fullName: "Cô Lan",
      role: "teacher",
    }),
  ]);

  assertResult(
    await supabase.from("profiles").upsert([
      {
        id: student.id,
        org_id: IDS.organization,
        email: student.email,
        full_name: "Minh Nguyễn",
        role: "student",
        grade_band: "secondary",
        guardian_consent_at: daysAgo(45),
      },
      {
        id: teacher.id,
        org_id: IDS.organization,
        email: teacher.email,
        full_name: "Cô Lan",
        role: "teacher",
        grade_band: null,
      },
    ]),
    "Upsert demo profiles",
  );

  if (shouldResetProgress) {
    await resetDemoProgress(student.id);
  }

  const skillNodes = [
    {
      id: IDS.skills.intro,
      org_id: IDS.organization,
      subject: "scratch",
      grade_band: "secondary",
      name: "Làm quen Scratch",
      description: "Khám phá sân khấu, nhân vật và khối lệnh đầu tiên.",
      steam_weights: { T: 0.5, A: 0.3, M: 0.2 },
      unlock_thresholds: {},
      order_index: 1,
    },
    {
      id: IDS.skills.events,
      org_id: IDS.organization,
      subject: "scratch",
      grade_band: "secondary",
      name: "Sự kiện & chuyển động",
      description: "Điều khiển nhân vật bằng sự kiện và tọa độ.",
      steam_weights: { T: 0.5, M: 0.3, A: 0.2 },
      unlock_thresholds: { T: 35, M: 30 },
      order_index: 2,
    },
    {
      id: IDS.skills.loops,
      org_id: IDS.organization,
      subject: "scratch",
      grade_band: "secondary",
      name: "Vòng lặp kỳ diệu",
      description: "Tạo chuyển động lặp lại và hoạt ảnh tiết kiệm khối lệnh.",
      steam_weights: { T: 0.45, M: 0.35, E: 0.2 },
      unlock_thresholds: { T: 55, M: 45 },
      order_index: 3,
    },
    {
      id: IDS.skills.variables,
      org_id: IDS.organization,
      subject: "scratch",
      grade_band: "secondary",
      name: "Biến số & điểm số",
      description: "Lưu điểm, thời gian và trạng thái trong trò chơi.",
      steam_weights: { T: 0.45, M: 0.4, E: 0.15 },
      unlock_thresholds: { T: 65, M: 55 },
      order_index: 4,
    },
    {
      id: IDS.skills.conditions,
      org_id: IDS.organization,
      subject: "scratch",
      grade_band: "secondary",
      name: "Điều kiện thông minh",
      description: "Giúp chương trình ra quyết định với nếu/thì.",
      steam_weights: { S: 0.3, T: 0.4, M: 0.3 },
      unlock_thresholds: { S: 60, T: 65 },
      order_index: 5,
    },
    {
      id: IDS.skills.story,
      org_id: IDS.organization,
      subject: "scratch",
      grade_band: "secondary",
      name: "Kể chuyện tương tác",
      description: "Kết hợp hội thoại, âm thanh và hoạt ảnh thành câu chuyện.",
      steam_weights: { A: 0.55, T: 0.25, E: 0.2 },
      unlock_thresholds: { A: 50, T: 45 },
      order_index: 6,
    },
    {
      id: IDS.skills.project,
      org_id: IDS.organization,
      subject: "scratch",
      grade_band: "secondary",
      name: "Dự án giải cứu đại dương",
      description: "Vận dụng STEAM để xây trò chơi có tác động xã hội.",
      steam_weights: { S: 0.25, T: 0.2, E: 0.25, A: 0.15, M: 0.15 },
      unlock_thresholds: { E: 60, A: 45 },
      order_index: 7,
    },
  ];

  assertResult(
    await supabase.from("skill_nodes").upsert(skillNodes),
    "Upsert Scratch Skill Nodes",
  );

  assertResult(
    await supabase.from("skill_node_prerequisites").upsert([
      { skill_node_id: IDS.skills.events, prerequisite_id: IDS.skills.intro },
      { skill_node_id: IDS.skills.loops, prerequisite_id: IDS.skills.events },
      { skill_node_id: IDS.skills.variables, prerequisite_id: IDS.skills.loops },
      { skill_node_id: IDS.skills.conditions, prerequisite_id: IDS.skills.variables },
      { skill_node_id: IDS.skills.story, prerequisite_id: IDS.skills.events },
      { skill_node_id: IDS.skills.project, prerequisite_id: IDS.skills.loops },
      { skill_node_id: IDS.skills.project, prerequisite_id: IDS.skills.story },
    ]),
    "Upsert Skill Node prerequisites",
  );

  assertResult(
    await supabase.from("steam_profiles").upsert({
      user_id: student.id,
      s: 78,
      t: 62,
      e: 55,
      a: 34,
      m: 82,
    }),
    "Upsert student STEAM profile",
  );

  assertResult(
    await supabase.from("exp_totals").upsert({
      user_id: student.id,
      total_exp: 1420,
      level: 3,
    }),
    "Upsert EXP total",
  );

  assertResult(
    await supabase.from("streaks").upsert({
      user_id: student.id,
      current_streak: 5,
      longest_streak: 9,
      last_active_date: vietnamDate(),
    }),
    "Upsert streak",
  );

  const badges = [
    {
      id: "40000000-0000-4000-8000-000000000001",
      code: "FIRST_QUEST",
      name: "Nhiệm vụ đầu tiên",
      description: "Hoàn thành Skill Node đầu tiên.",
    },
    {
      id: "40000000-0000-4000-8000-000000000002",
      code: "FIVE_DAY_STREAK",
      name: "Bền bỉ 5 ngày",
      description: "Học tập trong 5 ngày liên tiếp.",
    },
    {
      id: "40000000-0000-4000-8000-000000000003",
      code: "EVENT_EXPLORER",
      name: "Nhà thám hiểm sự kiện",
      description: "Làm chủ sự kiện và chuyển động trong Scratch.",
    },
  ];
  assertResult(await supabase.from("badges").upsert(badges), "Upsert badges");
  assertResult(
    await supabase.from("user_badges").upsert(
      badges.map((badge, index) => ({
        user_id: student.id,
        badge_id: badge.id,
        awarded_at: daysAgo(index + 2),
      })),
    ),
    "Award demo badges",
  );

  const loopLessonContent = {
    title: "Vòng lặp kỳ diệu",
    summary: "Biến những chuỗi lệnh lặp lại thành chương trình ngắn gọn, dễ đọc và dễ sửa.",
    estimatedMinutes: 24,
    learningObjectives: [
      "Nhận ra mẫu hành động đang lặp lại",
      "Chọn đúng repeat hoặc forever",
      "Tạo hoạt ảnh bằng vòng lặp hữu hạn",
    ],
    checkpoints: [
      {
        id: "loops-pattern",
        title: "Tìm mẫu đang lặp",
        type: "concept",
        durationMinutes: 6,
        eyebrow: "Checkpoint 1",
        body: "Khi cùng một hành động xuất hiện nhiều lần, chương trình đang có một mẫu lặp. Thay vì kéo sáu khối di chuyển giống nhau, ta có thể mô tả số lần lặp và hành động bên trong.",
        blocks: ["di chuyển 10 bước", "di chuyển 10 bước", "di chuyển 10 bước"],
        takeaway: "Mẫu lặp = cùng hành động + số lần thực hiện.",
      },
      {
        id: "loops-repeat",
        title: "Làm chủ khối repeat",
        type: "guided_practice",
        durationMinutes: 8,
        eyebrow: "Checkpoint 2",
        body: "Khối repeat chạy các lệnh bên trong đúng số lần đã chọn rồi dừng. Đây là lựa chọn phù hợp khi ta biết trước nhân vật cần lặp bao nhiêu lần.",
        blocks: ["lặp lại 6 lần", "di chuyển 10 bước", "xoay 15 độ"],
        takeaway: "repeat có điểm dừng; forever tiếp tục cho tới khi chương trình dừng.",
      },
      {
        id: "loops-build",
        title: "Xây hoạt ảnh chuyển động",
        type: "challenge",
        durationMinutes: 10,
        eyebrow: "Checkpoint 3",
        body: "Hãy tưởng tượng nhân vật cần tiến lên và xoay nhẹ sáu lần để tạo một cung tròn. Xác định khối nào nằm bên ngoài, khối nào nằm bên trong vòng lặp.",
        blocks: ["khi bấm cờ xanh", "lặp lại 6 lần", "di chuyển 10 bước", "xoay 15 độ"],
        takeaway: "Chỉ đặt các hành động cần lặp vào bên trong khối repeat.",
      },
    ],
    quizHints: [
      "Tìm phương án có ghi rõ số lần thực hiện.",
      "Khối forever không tự dừng sau 6 lần.",
      "Đặt khối di chuyển vào bên trong repeat 6 để không phải sao chép lệnh.",
    ],
  };

  assertResult(
    await supabase.from("source_documents").upsert({
      id: IDS.loopSourceDocument,
      uploaded_by: teacher.id,
      skill_node_id: IDS.skills.loops,
      storage_path: "demo/loops-approved-source.md",
      extracted_text: loopLessonContent.checkpoints
        .map((checkpoint) => `${checkpoint.title}\n${checkpoint.body}\n${checkpoint.takeaway}`)
        .join("\n\n"),
    }),
    "Upsert approved Loops source document",
  );

  const lessons = skillNodes.map((node, index) => ({
    id: `20000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    skill_node_id: node.id,
    status: "PUBLISHED",
    difficulty: index < 3 ? "basic" : "advanced",
    content: node.id === IDS.skills.loops
      ? loopLessonContent
      : {
          title: node.name,
          summary: node.description,
          estimatedMinutes: 18 + index * 2,
          learningObjectives: ["Hiểu khái niệm chính", "Áp dụng vào một thử thách Scratch"],
          checkpoints: [
            {
              id: `${node.id}-observe`,
              title: "Quan sát",
              type: "concept",
              durationMinutes: 6,
              eyebrow: "Checkpoint 1",
              body: `Quan sát ví dụ về ${node.name.toLowerCase()} và tìm những khối lệnh tạo nên hành vi chính.`,
              takeaway: "Gọi tên được khái niệm trước khi bắt đầu xây dựng.",
            },
            {
              id: `${node.id}-build`,
              title: "Thử thách",
              type: "practice",
              durationMinutes: 9,
              eyebrow: "Checkpoint 2",
              body: `Sắp xếp các bước cần thiết để áp dụng ${node.name.toLowerCase()} vào một dự án Scratch nhỏ.`,
              takeaway: "Chia thử thách thành các hành động ngắn và kiểm tra từng bước.",
            },
            {
              id: `${node.id}-reflect`,
              title: "Tự đánh giá",
              type: "reflection",
              durationMinutes: 5,
              eyebrow: "Checkpoint 3",
              body: "Mô tả điều đã hoạt động, điều cần sửa và một cách bạn có thể dùng kỹ năng này trong dự án khác.",
              takeaway: "Giải thích được cách làm là dấu hiệu bạn đã hiểu sâu hơn.",
            },
          ],
          quizHints: [],
        },
    source_document_id: node.id === IDS.skills.loops ? IDS.loopSourceDocument : null,
    generated_by: "human-authored-demo",
    reviewed_by: teacher.id,
    published_at: daysAgo(30 - index),
  }));
  assertResult(await supabase.from("lessons").upsert(lessons), "Publish demo lessons");

  assertResult(
    await supabase.from("document_chunks").upsert(
      loopLessonContent.checkpoints.map((checkpoint, index) => ({
        id: `71000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
        source_document_id: IDS.loopSourceDocument,
        skill_node_id: IDS.skills.loops,
        chunk_index: index,
        content: `${checkpoint.title}\n${checkpoint.body}\n${checkpoint.takeaway}`,
      })),
    ),
    "Upsert approved Loops knowledge chunks",
  );

  const questions = [
    {
      id: "30000000-0000-4000-8000-000000000001",
      lesson_id: lessons[0].id,
      skill_node_id: IDS.skills.intro,
      grade_band: "secondary",
      type: "mcq",
      difficulty: "easy",
      steam_weights: { T: 0.7, A: 0.3 },
      body: "Khu vực nào hiển thị hành động của nhân vật Scratch?",
      options: ["Sân khấu", "Bảng khối lệnh", "Ba lô"],
      answer_key: { index: 0 },
      status: "PUBLISHED",
    },
    {
      id: "30000000-0000-4000-8000-000000000002",
      lesson_id: lessons[1].id,
      skill_node_id: IDS.skills.events,
      grade_band: "secondary",
      type: "mcq",
      difficulty: "medium",
      steam_weights: { T: 0.6, M: 0.4 },
      body: "Khối nào bắt đầu chương trình khi nhấn cờ xanh?",
      options: ["Khi bấm vào tôi", "Khi bấm cờ xanh", "Đợi 1 giây"],
      answer_key: { index: 1 },
      status: "PUBLISHED",
    },
    {
      id: "30000000-0000-4000-8000-000000000003",
      lesson_id: lessons[2].id,
      skill_node_id: IDS.skills.loops,
      grade_band: "secondary",
      type: "mcq",
      difficulty: "medium",
      steam_weights: { T: 0.45, M: 0.35, E: 0.2 },
      body: "Khối lệnh nào giúp nhân vật tiến 10 bước đúng 6 lần mà không sao chép lệnh?",
      options: [
        "Dùng 6 khối di chuyển 10 bước rời nhau",
        "Đặt di chuyển 10 bước bên trong repeat 6",
        "Đặt di chuyển 10 bước bên trong forever",
      ],
      answer_key: {
        index: 1,
        explanation: "Chính xác! repeat 6 thực hiện khối di chuyển đúng sáu lần rồi dừng.",
      },
      status: "PUBLISHED",
    },
  ];
  assertResult(await supabase.from("questions").upsert(questions), "Upsert demo questions");
  assertResult(
    await supabase.from("attempts").upsert([
      {
        id: "50000000-0000-4000-8000-000000000001",
        user_id: student.id,
        question_id: questions[0].id,
        is_correct: true,
        used_hint: false,
        duration_ms: 42000,
        created_at: daysAgo(12),
      },
      {
        id: "50000000-0000-4000-8000-000000000002",
        user_id: student.id,
        question_id: questions[1].id,
        is_correct: true,
        used_hint: true,
        duration_ms: 61000,
        created_at: daysAgo(7),
      },
    ]),
    "Upsert completed attempts",
  );

  assertResult(
    await supabase.from("exp_events").upsert(
      [0, 1, 2, 4, 5].map((offset, index) => ({
        id: `60000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
        user_id: student.id,
        action_type: index % 2 === 0 ? "lesson_checkpoint" : "quiz_completed",
        amount: index === 0 ? 60 : 30,
        created_at: daysAgo(offset),
      })),
    ),
    "Upsert weekly EXP activity",
  );

  assertResult(
    await supabase.from("daily_cost_budgets").upsert({
      org_id: IDS.organization,
      date: vietnamDate(),
      budget_usd: env.aiDailyBudgetUsd,
    }),
    "Upsert daily AI budget",
  );

  console.log("EduOne demo data is ready.");
  console.log(`Student profile: ${student.id}`);
  console.log(`Skill Nodes: ${skillNodes.length}; published lessons: ${lessons.length}`);
}

seed().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
