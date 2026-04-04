/**
 * grader.js
 * Scoring tiers for terminal states.
 * Called once when the episode ends.
 */

const SCORE_TIERS = {
  interview_secured: 1.0,
  applied_with_referral: 0.5,
  applied_cold: 0.2,
  deadline_missed: 0.0,
};

/**
 * Compute final score based on terminal reason + bonus multipliers.
 * @param {object} state - final environment state
 * @returns {{ score: number, breakdown: object }}
 */
function grade(state) {
  const base = SCORE_TIERS[state.terminal_reason] ?? 0.0;

  // Resume tailoring bonus: doubles reward if keywords matched
  let tailoringMultiplier = 1.0;
  if (state.tailored_skills_submitted && state.job_description_keywords) {
    const matched = state.tailored_skills_submitted.filter((skill) =>
      state.job_description_keywords
        .map((k) => k.toLowerCase())
        .includes(skill.toLowerCase())
    );
    const matchRatio = matched.length / state.job_description_keywords.length;
    if (matchRatio >= 0.8) {
      tailoringMultiplier = 2.0; // full match → double reward
    } else if (matchRatio >= 0.5) {
      tailoringMultiplier = 1.5; // partial match → 1.5x
    }
  }

  const finalScore = Math.min(base * tailoringMultiplier, 1.0); // cap at 1.0

  return {
    score: parseFloat(finalScore.toFixed(4)),
    breakdown: {
      base_score: base,
      tailoring_multiplier: tailoringMultiplier,
      terminal_reason: state.terminal_reason,
      steps_taken: state.steps_taken,
      total_time_penalty: state.total_reward, // accumulated step penalties
    },
  };
}

module.exports = { grade, SCORE_TIERS };
