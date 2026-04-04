/**
 * environment.js
 * Core RL environment. Manages state transitions and reward logic.
 *
 * Valid actions:
 *   - request_referral
 *   - reply_email
 *   - apply_workday       (costs 3 time-steps)
 *   - apply_1click        (costs 1 time-step)
 *   - submit_application  (payload: { tailored_skills: string[] })
 *   - wait
 */

const { createInitialState } = require("./initialState");
const { grade } = require("./grader");
const { maybeInjectRecruiterEvent, resolveRecruiterEvent } = require("../chaos/events");

const TIME_PENALTY = -0.01; // cost per step

class Environment {
  constructor(taskConfig = {}) {
    this.taskConfig = taskConfig;
    this.state = createInitialState(taskConfig);
  }

  reset(taskConfig = null) {
    if (taskConfig) this.taskConfig = taskConfig;
    this.state = createInitialState(this.taskConfig);
    return this._observation();
  }

  /**
   * Main step function. Takes an action object and returns { observation, reward, done, info }.
   * @param {{ action: string, tailored_skills?: string[] }} actionPayload
   */
  step(actionPayload) {
    const { action, tailored_skills } = actionPayload;

    if (this.state.done) {
      return {
        observation: this._observation(),
        reward: 0,
        done: true,
        info: { error: "Episode already done. Call /reset to start a new episode." },
      };
    }

    let reward = TIME_PENALTY; // every step costs time
    let info = {};

    // --- Deadline check (before processing action) ---
    if (this.state.day > this.state.deadline) {
      return this._terminate("deadline_missed", reward, { reason: "Deadline passed before action." });
    }

    // --- Action handlers ---
    switch (action) {

      case "request_referral": {
        if (this.state.referral_requested) {
          reward -= 0.05; // penalty for redundant action
          info.warning = "Referral already requested.";
          break;
        }
        this.state.referral_requested = true;

        // Ghosting mechanic: 30% chance (or task-configured probability)
        const ghostRoll = Math.random();
        const ghostProb = this.taskConfig.ghosting_probability ?? 0.3;
        if (ghostRoll < ghostProb) {
          this.state.ghosted = true;
          info.event = "ghosted";
          info.message = "No response. You've been ghosted.";
        } else {
          info.event = "referral_sent";
          info.message = "Referral request sent successfully.";
        }
        break;
      }

      case "reply_email": {
        if (!this.state.recruiter_replied_pending) {
          reward -= 0.1; // penalty for replying when no event is pending
          info.warning = "No pending recruiter event to reply to.";
          break;
        }
        // Resolve the curveball — agent nailed it
        this.state = resolveRecruiterEvent(this.state);
        reward += 0.3; // bonus for correct prioritization
        info.event = "recruiter_replied";
        info.message = "You replied to the recruiter. Interview likely secured.";

        if (this.state.got_interview) {
          return this._terminate("interview_secured", reward, info);
        }
        break;
      }

      case "apply_workday": {
        if (this.state.applied) {
          reward -= 0.05;
          info.warning = "Already applied.";
          break;
        }
        if (this.state.platform !== "workday") {
          reward -= 0.1;
          info.warning = `Platform is ${this.state.platform}, not workday. Wrong apply action.`;
          break;
        }
        // Workday costs 3 time-steps
        this.state.day += 2; // +2 extra on top of the +1 at end of step
        this.state.applied = true;
        info.event = "applied_workday";
        info.message = "Applied via Workday (3 steps used).";
        break;
      }

      case "apply_1click": {
        if (this.state.applied) {
          reward -= 0.05;
          info.warning = "Already applied.";
          break;
        }
        if (this.state.platform === "workday") {
          reward -= 0.1;
          info.warning = "Platform is Workday. Use apply_workday instead.";
          break;
        }
        this.state.applied = true;
        info.event = "applied_1click";
        info.message = "Applied via 1-click (1 step used).";
        break;
      }

      case "submit_application": {
        if (!this.state.applied) {
          reward -= 0.1;
          info.warning = "Must apply before submitting application details.";
          break;
        }
        if (this.state.application_submitted) {
          reward -= 0.05;
          info.warning = "Application already submitted.";
          break;
        }

        this.state.application_submitted = true;

        if (tailored_skills && Array.isArray(tailored_skills)) {
          this.state.tailored_skills_submitted = tailored_skills;
          info.event = "application_submitted_tailored";
        } else {
          info.event = "application_submitted_cold";
        }

        // Determine terminal reason
        const reason = this.state.referral_requested && !this.state.ghosted
          ? "applied_with_referral"
          : "applied_cold";

        return this._terminate(reason, reward, info);
      }

      case "wait": {
        info.event = "waited";
        info.message = "Agent chose to wait.";
        // Recruiter curveball might fire — handled below
        break;
      }

      default: {
        reward -= 0.2; // penalty for invalid action
        info.error = `Unknown action: "${action}". Valid: request_referral, reply_email, apply_workday, apply_1click, submit_application, wait`;
        break;
      }
    }

    // --- Missed recruiter event penalty ---
    // If recruiter was pending and agent did NOT reply_email, penalize hard
    if (
      this.state.recruiter_replied_pending &&
      action !== "reply_email"
    ) {
      reward -= 1.0;
      info.penalty = "MISSED recruiter event! Should have used reply_email.";
      this.state.recruiter_replied_pending = false; // event expires
      this.state.recruiter_event = null;
    }

    // --- Advance time ---
    this.state.day += 1;
    this.state.steps_taken += 1;
    this.state.total_reward += reward;

    // --- Inject chaos for next step ---
    this.state = maybeInjectRecruiterEvent(this.state, this.taskConfig);

    // --- Deadline check (after advancing time) ---
    if (this.state.day > this.state.deadline) {
      return this._terminate("deadline_missed", 0, { reason: "Deadline reached." });
    }

    return {
      observation: this._observation(),
      reward: parseFloat(reward.toFixed(4)),
      done: false,
      info,
    };
  }

  _terminate(reason, reward, info = {}) {
    this.state.done = true;
    this.state.terminal_reason = reason;
    this.state.steps_taken += 1;
    this.state.total_reward += reward;

    const gradeResult = grade(this.state);

    return {
      observation: this._observation(),
      reward: parseFloat(reward.toFixed(4)),
      done: true,
      info: {
        ...info,
        terminal_reason: reason,
        final_grade: gradeResult,
      },
    };
  }

  _observation() {
    // Only expose what the agent is allowed to see
    return {
      job_title: this.state.job_title,
      company: this.state.company,
      platform: this.state.platform,
      job_description_keywords: this.state.job_description_keywords,
      day: this.state.day,
      deadline: this.state.deadline,
      days_remaining: this.state.deadline - this.state.day,
      referral_requested: this.state.referral_requested,
      ghosted: this.state.ghosted,
      applied: this.state.applied,
      application_submitted: this.state.application_submitted,
      recruiter_event: this.state.recruiter_event,
      recruiter_replied_pending: this.state.recruiter_replied_pending,
      got_interview: this.state.got_interview,
      done: this.state.done,
      terminal_reason: this.state.terminal_reason,
      steps_taken: this.state.steps_taken,
      total_reward: parseFloat(this.state.total_reward.toFixed(4)),
    };
  }

  getState() {
    return this._observation();
  }
}

module.exports = { Environment };
