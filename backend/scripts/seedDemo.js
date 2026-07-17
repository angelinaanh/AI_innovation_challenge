import { createClient } from "@supabase/supabase-js";

import { env } from "../utils/env.js";

const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const IDS = {
  organization: "00000000-0000-0000-0000-000000000001",
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
      last_active_date: new Date().toISOString().slice(0, 10),
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

  const lessons = skillNodes.map((node, index) => ({
    id: `20000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    skill_node_id: node.id,
    status: "PUBLISHED",
    difficulty: index < 3 ? "basic" : "advanced",
    content: {
      title: node.name,
      summary: node.description,
      estimatedMinutes: 18 + index * 2,
      checkpoints: [
        { id: `${node.id}-observe`, title: "Quan sát", type: "concept" },
        { id: `${node.id}-build`, title: "Thử thách", type: "practice" },
        { id: `${node.id}-reflect`, title: "Tự đánh giá", type: "reflection" },
      ],
    },
    generated_by: "human-authored-demo",
    reviewed_by: teacher.id,
    published_at: daysAgo(30 - index),
  }));
  assertResult(await supabase.from("lessons").upsert(lessons), "Publish demo lessons");

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

  console.log("EduOne demo data is ready.");
  console.log(`Student profile: ${student.id}`);
  console.log(`Skill Nodes: ${skillNodes.length}; published lessons: ${lessons.length}`);
}

seed().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
