const AXIS_LABELS = {
  S: "Khoa học",
  T: "Công nghệ",
  E: "Kỹ thuật",
  A: "Nghệ thuật",
  M: "Toán học",
};

function normalizeScores(profile = {}) {
  return {
    S: Number(profile.s || 0),
    T: Number(profile.t || 0),
    E: Number(profile.e || 0),
    A: Number(profile.a || 0),
    M: Number(profile.m || 0),
  };
}

function thresholdEntries(thresholds = {}) {
  return Object.entries(thresholds)
    .filter(([axis]) => AXIS_LABELS[axis.toUpperCase()])
    .map(([axis, value]) => [axis.toUpperCase(), Number(value)]);
}

function buildUnlockReason(node, scores, prerequisiteNames) {
  const metThresholds = thresholdEntries(node.unlock_thresholds)
    .filter(([axis, minimum]) => scores[axis] >= minimum)
    .map(([axis, minimum]) => `${axis} ${scores[axis]} >= ${minimum}`);

  const parts = [];
  if (prerequisiteNames.length) {
    parts.push(`Đã hoàn thành ${prerequisiteNames.join(", ")}`);
  }
  if (metThresholds.length) {
    parts.push(metThresholds.join(" và "));
  }
  return parts.length
    ? parts.join(". ")
    : "Đây là điểm bắt đầu phù hợp với hồ sơ hiện tại của bạn.";
}

function buildLockedReason(deficits, missingPrerequisiteNames, hasLesson) {
  const reasons = deficits.map(
    ({ axis, missing }) => `cần thêm ${missing} điểm ${axis} (${AXIS_LABELS[axis]})`,
  );
  if (missingPrerequisiteNames.length) {
    reasons.push(`hoàn thành ${missingPrerequisiteNames.join(", ")}`);
  }
  if (!hasLesson) {
    reasons.push("chờ giáo viên xuất bản bài học");
  }
  return reasons.length ? `Để mở khóa: ${reasons.join("; ")}.` : null;
}

export function evaluateLearningPath({
  steamProfile,
  skillNodes,
  prerequisites,
  completedNodeIds,
  publishedLessonNodeIds,
}) {
  const scores = normalizeScores(steamProfile);
  const completed = new Set(completedNodeIds);
  const published = new Set(publishedLessonNodeIds);
  const nodeById = new Map(skillNodes.map((node) => [node.id, node]));
  const prerequisitesByNode = new Map();

  for (const edge of prerequisites) {
    const current = prerequisitesByNode.get(edge.skill_node_id) || [];
    current.push(edge.prerequisite_id);
    prerequisitesByNode.set(edge.skill_node_id, current);
  }

  const evaluated = [...skillNodes]
    .sort((a, b) => a.order_index - b.order_index)
    .map((node) => {
      const prerequisiteIds = prerequisitesByNode.get(node.id) || [];
      const missingPrerequisiteIds = prerequisiteIds.filter((id) => !completed.has(id));
      const prerequisiteNames = prerequisiteIds
        .map((id) => nodeById.get(id)?.name)
        .filter(Boolean);
      const missingPrerequisiteNames = missingPrerequisiteIds
        .map((id) => nodeById.get(id)?.name)
        .filter(Boolean);
      const deficits = thresholdEntries(node.unlock_thresholds)
        .filter(([axis, minimum]) => scores[axis] < minimum)
        .map(([axis, minimum]) => ({
          axis,
          current: scores[axis],
          minimum,
          missing: minimum - scores[axis],
        }));
      const hasLesson = published.has(node.id);
      const isCompleted = completed.has(node.id);
      const isAvailable = !isCompleted
        && deficits.length === 0
        && missingPrerequisiteIds.length === 0
        && hasLesson;

      return {
        id: node.id,
        name: node.name,
        description: node.description,
        subject: node.subject,
        orderIndex: node.order_index,
        steamWeights: node.steam_weights,
        status: isCompleted ? "completed" : isAvailable ? "available" : "locked",
        hasPublishedLesson: hasLesson,
        unlockReason: isAvailable
          ? buildUnlockReason(node, scores, prerequisiteNames)
          : null,
        lockedReason: isCompleted
          ? null
          : buildLockedReason(deficits, missingPrerequisiteNames, hasLesson),
        deficits,
        prerequisiteIds,
      };
    });

  const recommendation = evaluated.find((node) => node.status === "available") || null;
  if (recommendation) {
    recommendation.status = "current";
  }

  return {
    scores,
    nodes: evaluated,
    recommendation,
    completedCount: evaluated.filter((node) => node.status === "completed").length,
    totalCount: evaluated.length,
  };
}
