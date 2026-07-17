const VALID_AXES = new Set(["S", "T", "E", "A", "M"]);

export function validateAnswerIndex(answerIndex, options) {
  return Number.isInteger(answerIndex)
    && Array.isArray(options)
    && answerIndex >= 0
    && answerIndex < options.length;
}

export function gradeMultipleChoice(answerIndex, answerKey) {
  return Number(answerKey?.index) === answerIndex;
}

export function calculateMasteryDelta(steamWeights = {}) {
  return Object.fromEntries(
    Object.entries(steamWeights)
      .map(([axis, weight]) => [axis.toUpperCase(), Number(weight)])
      .filter(([axis, weight]) => VALID_AXES.has(axis) && weight > 0)
      .map(([axis, weight]) => [axis, Math.max(1, Math.round(weight * 8))]),
  );
}

export function calculateQuizReward({ usedHint, currentTotalExp }) {
  const xp = usedHint ? 50 : 80;
  const totalExp = Math.max(0, Number(currentTotalExp || 0)) + xp;
  return {
    xp,
    totalExp,
    level: Math.floor(totalExp / 500) + 1,
  };
}
