import assert from "node:assert/strict";
import test from "node:test";

import { evaluateLearningPath } from "../services/path-engine/pathEngine.js";

const nodes = [
  {
    id: "intro",
    name: "Làm quen Scratch",
    subject: "scratch",
    order_index: 1,
    unlock_thresholds: {},
    steam_weights: { T: 0.5 },
  },
  {
    id: "loops",
    name: "Vòng lặp",
    subject: "scratch",
    order_index: 2,
    unlock_thresholds: { T: 55, M: 45 },
    steam_weights: { T: 0.5, M: 0.5 },
  },
  {
    id: "story",
    name: "Kể chuyện tương tác",
    subject: "scratch",
    order_index: 3,
    unlock_thresholds: { A: 50 },
    steam_weights: { A: 0.7 },
  },
];

test("recommends the first qualified node with an explainable reason", () => {
  const result = evaluateLearningPath({
    steamProfile: { s: 78, t: 62, e: 55, a: 34, m: 82 },
    skillNodes: nodes,
    prerequisites: [
      { skill_node_id: "loops", prerequisite_id: "intro" },
      { skill_node_id: "story", prerequisite_id: "intro" },
    ],
    completedNodeIds: ["intro"],
    publishedLessonNodeIds: ["intro", "loops", "story"],
  });

  assert.equal(result.recommendation.id, "loops");
  assert.equal(result.recommendation.status, "current");
  assert.match(result.recommendation.unlockReason, /T 62 >= 55/);
});

test("reports numeric recovery guidance for a locked node", () => {
  const result = evaluateLearningPath({
    steamProfile: { s: 78, t: 62, e: 55, a: 34, m: 82 },
    skillNodes: nodes,
    prerequisites: [{ skill_node_id: "story", prerequisite_id: "intro" }],
    completedNodeIds: ["intro"],
    publishedLessonNodeIds: ["intro", "loops", "story"],
  });

  const story = result.nodes.find((node) => node.id === "story");
  assert.equal(story.status, "locked");
  assert.match(story.lockedReason, /thêm 16 điểm A/);
});

test("keeps a node locked when no teacher-approved lesson exists", () => {
  const result = evaluateLearningPath({
    steamProfile: { s: 100, t: 100, e: 100, a: 100, m: 100 },
    skillNodes: nodes,
    prerequisites: [],
    completedNodeIds: ["intro", "loops"],
    publishedLessonNodeIds: ["intro", "loops"],
  });

  const story = result.nodes.find((node) => node.id === "story");
  assert.equal(story.status, "locked");
  assert.match(story.lockedReason, /giáo viên xuất bản/);
});
