/**
 * initialState.js
 * Defines the base state object for the job application RL environment.
 * Each field is observable by the agent via GET /state.
 */

const PLATFORMS = ["workday", "1click", "linkedin_easy_apply"];

function createInitialState(taskConfig = {}) {
  return {
    // --- Job Info ---
    job_title: taskConfig.job_title || "Software Engineer Intern",
    company: taskConfig.company || "TechCorp",
    platform: taskConfig.platform || PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)],
    job_description_keywords: taskConfig.keywords || ["React", "Node.js", "REST APIs"],

    // --- Time ---
    day: 1,
    deadline: taskConfig.deadline || 10, // steps before job closes

    // --- Agent Progress ---
    referral_requested: false,
    applied: false,
    application_submitted: false,
    tailored_skills_submitted: null,

    // --- Chaos State ---
    ghosted: false,
    recruiter_event: null, // null | { type: "interview_request", message: string }
    recruiter_replied_pending: false, // agent MUST reply_email next step

    // --- Outcome ---
    got_interview: false,
    done: false,
    terminal_reason: null, // "deadline_missed" | "interview_secured" | "applied_cold" | "applied_with_referral"

    // --- Scoring ---
    total_reward: 0,
    steps_taken: 0,
  };
}

module.exports = { createInitialState, PLATFORMS };
