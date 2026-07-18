import { supabase } from "../supabase.js";
import { evaluateLearningPath } from "../path-engine/pathEngine.js";
import { resolveStudentId, throwDatabaseError } from "./studentContext.js";

async function loadPathInputs(studentId) {
  const [steamResult, nodesResult, prerequisiteResult, lessonResult, attemptResult] =
    await Promise.all([
      supabase.from("steam_profiles").select("s,t,e,a,m,updated_at").eq("user_id", studentId).maybeSingle(),
      supabase.from("skill_nodes").select("*").eq("subject", "scratch").order("order_index"),
      supabase.from("skill_node_prerequisites").select("skill_node_id,prerequisite_id"),
      supabase.from("lessons").select("skill_node_id,difficulty").eq("status", "PUBLISHED"),
      supabase
        .from("attempts")
        .select("is_correct,questions!inner(skill_node_id)")
        .eq("user_id", studentId)
        .eq("is_correct", true),
    ]);

  throwDatabaseError(steamResult.error, "load STEAM profile");
  throwDatabaseError(nodesResult.error, "load Skill Nodes");
  throwDatabaseError(prerequisiteResult.error, "load prerequisites");
  throwDatabaseError(lessonResult.error, "load published lessons");
  throwDatabaseError(attemptResult.error, "load completed attempts");

  const completedNodeIds = [
    ...new Set(
      (attemptResult.data || [])
        .map((attempt) => attempt.questions?.skill_node_id)
        .filter(Boolean),
    ),
  ];

  return {
    steamProfile: steamResult.data || {},
    skillNodes: nodesResult.data || [],
    prerequisites: prerequisiteResult.data || [],
    completedNodeIds,
    publishedLessonNodeIds: (lessonResult.data || []).map((lesson) => lesson.skill_node_id),
  };
}

function createWeekActivity(events) {
  const eventDates = new Set(events.map((event) => event.created_at.slice(0, 10)));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const isoDate = date.toISOString().slice(0, 10);
    return {
      date: isoDate,
      day: new Intl.DateTimeFormat("vi-VN", { weekday: "short" }).format(date),
      active: eventDates.has(isoDate),
    };
  });
}

export async function getStudentPath(requestedStudentId) {
  const studentId = await resolveStudentId(requestedStudentId);
  const inputs = await loadPathInputs(studentId);
  return {
    studentId,
    ...evaluateLearningPath(inputs),
  };
}

export async function getStudentDashboard(requestedStudentId) {
  const studentId = await resolveStudentId(requestedStudentId);
  const [profileResult, expResult, streakResult, badgesResult, eventsResult, path] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id,full_name,role,grade_level,grade_band")
        .eq("id", studentId)
        .single(),
      supabase.from("exp_totals").select("total_exp,level").eq("user_id", studentId).maybeSingle(),
      supabase.from("streaks").select("current_streak,longest_streak,last_active_date").eq("user_id", studentId).maybeSingle(),
      supabase
        .from("user_badges")
        .select("awarded_at,badges(id,code,name,description)")
        .eq("user_id", studentId)
        .order("awarded_at", { ascending: false }),
      supabase
        .from("exp_events")
        .select("amount,action_type,created_at")
        .eq("user_id", studentId)
        .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString())
        .order("created_at"),
      getStudentPath(studentId),
    ]);

  throwDatabaseError(profileResult.error, "load student profile");
  throwDatabaseError(expResult.error, "load EXP total");
  throwDatabaseError(streakResult.error, "load streak");
  throwDatabaseError(badgesResult.error, "load badges");
  throwDatabaseError(eventsResult.error, "load weekly activity");

  const exp = expResult.data || { total_exp: 0, level: 1 };
  const currentLevelFloor = Math.max(0, (exp.level - 1) * 500);
  const nextLevelAt = exp.level * 500;

  return {
    student: {
      id: profileResult.data.id,
      fullName: profileResult.data.full_name || "Học sinh EduOne",
      gradeLevel: profileResult.data.grade_level,
      gradeBand: profileResult.data.grade_band,
    },
    steamProfile: path.scores,
    gamification: {
      totalExp: exp.total_exp,
      level: exp.level,
      currentLevelFloor,
      nextLevelAt,
      levelProgress: Math.min(
        100,
        Math.round(((exp.total_exp - currentLevelFloor) / (nextLevelAt - currentLevelFloor)) * 100),
      ),
      streak: streakResult.data || {
        current_streak: 0,
        longest_streak: 0,
        last_active_date: null,
      },
    },
    badges: (badgesResult.data || []).map((item) => ({
      ...item.badges,
      awardedAt: item.awarded_at,
    })),
    weekActivity: createWeekActivity(eventsResult.data || []),
    weekExp: (eventsResult.data || []).reduce((sum, event) => sum + event.amount, 0),
    pathProgress: {
      completed: path.completedCount,
      total: path.totalCount,
    },
    recommendation: path.recommendation,
    pathPreview: path.nodes.slice(0, 5),
  };
}
