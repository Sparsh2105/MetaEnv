/**
 * events.js
 * Chaos event injector. Called inside step() each turn.
 * Randomly fires recruiter curveball events into the state.
 */

const RECRUITER_MESSAGES = [
  "Can you interview tomorrow at 10am?",
  "We'd love to move fast — are you available this week?",
  "Quick question: what's your expected salary range?",
  "We have another candidate — can you confirm your interest ASAP?",
  "Our hiring manager wants to chat today. Are you free?",
];

/**
 * Maybe inject a recruiter curveball into the state.
 * @param {object} state - current environment state
 * @param {object} taskConfig - task difficulty config
 * @returns {object} mutated state
 */
function maybeInjectRecruiterEvent(state, taskConfig) {
  if (!taskConfig.chaos_enabled) return state;
  if (state.recruiter_replied_pending) return state; // already pending, don't stack
  if (state.done) return state;

  const roll = Math.random();
  if (roll < (taskConfig.recruiter_curveball_probability || 0)) {
    const message =
      RECRUITER_MESSAGES[Math.floor(Math.random() * RECRUITER_MESSAGES.length)];

    state.recruiter_event = {
      type: "interview_request",
      message,
    };
    state.recruiter_replied_pending = true; // agent MUST reply_email next step
  }

  return state;
}

/**
 * Resolve the recruiter event after agent replies.
 * @param {object} state
 * @returns {object} mutated state
 */
function resolveRecruiterEvent(state) {
  state.recruiter_event = null;
  state.recruiter_replied_pending = false;
  state.got_interview = true;
  return state;
}

module.exports = { maybeInjectRecruiterEvent, resolveRecruiterEvent };
