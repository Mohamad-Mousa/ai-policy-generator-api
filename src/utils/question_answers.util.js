/**
 * Normalizes question.answers from DB or API into a consistent shape.
 * Supports legacy plain strings for older documents.
 */
function answerItems(answers) {
  if (!Array.isArray(answers)) return [];
  return answers.map((a) => {
    if (typeof a === "string") {
      return { text: a, score: undefined };
    }
    if (a && typeof a === "object") {
      return {
        text: a.text != null ? String(a.text) : "",
        score: a.score != null ? Number(a.score) : undefined,
      };
    }
    return { text: "", score: undefined };
  });
}

function answerLabels(answers) {
  return answerItems(answers)
    .map((x) => x.text)
    .filter(Boolean);
}

function answerLabelSet(answers) {
  return new Set(answerLabels(answers));
}

/** Map score (1–5) -> item for radio questions */
function radioScoreMap(answers) {
  const map = new Map();
  for (const item of answerItems(answers)) {
    if (
      item.score != null &&
      Number.isInteger(item.score) &&
      item.score >= 1 &&
      item.score <= 5
    ) {
      map.set(item.score, item);
    }
  }
  return map;
}

function formatRadioOptionsHint(answers) {
  const items = answerItems(answers);
  return items
    .map((a) =>
      a.score != null && Number.isInteger(a.score)
        ? `[${a.score}] ${a.text}`
        : a.text
    )
    .join("; ");
}

function formatCheckboxOptionsHint(answers) {
  return answerLabels(answers).join(", ");
}

/**
 * Resolves the 1–5 readiness score for a radio answer (by score or option text).
 * @returns {number|null}
 */
function radioAnswerToScore(question, answer) {
  if (!question || question.type !== "radio") return null;
  if (answer === undefined || answer === null || answer === "") return null;

  const scores = radioScoreMap(question.answers);
  const numericAnswer =
    typeof answer === "number"
      ? answer
      : typeof answer === "string" && /^\s*\d+\s*$/.test(answer)
      ? parseInt(String(answer).trim(), 10)
      : null;

  if (numericAnswer != null && scores.has(numericAnswer)) {
    return numericAnswer;
  }

  if (typeof answer === "string") {
    for (const item of answerItems(question.answers)) {
      if (
        item.text === answer &&
        item.score != null &&
        Number.isInteger(item.score)
      ) {
        return item.score;
      }
    }
  }

  return null;
}

/**
 * Average of radio scores (each 1–5) and equivalent percentage of max (5).
 * @param {{ question: object, answer: unknown }[]} pairs
 * @returns {{ scoreAvg: number|null, scorePercentage: number|null }}
 */
function computeAssessmentRadioMetrics(pairs) {
  if (!Array.isArray(pairs) || pairs.length === 0) {
    return { scoreAvg: null, scorePercentage: null };
  }
  const values = [];
  for (const { question, answer } of pairs) {
    const s = radioAnswerToScore(question, answer);
    if (s != null) values.push(s);
  }
  if (values.length === 0) {
    return { scoreAvg: null, scorePercentage: null };
  }
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const scoreAvg = Math.round(avg * 100) / 100;
  const scorePercentage = Math.round((avg / 5) * 10000) / 100;
  return { scoreAvg, scorePercentage };
}

module.exports = {
  answerItems,
  answerLabels,
  answerLabelSet,
  radioScoreMap,
  formatRadioOptionsHint,
  formatCheckboxOptionsHint,
  radioAnswerToScore,
  computeAssessmentRadioMetrics,
};
