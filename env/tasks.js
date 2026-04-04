/**
 * tasks.js
 * Scenario configs for Easy / Medium / Hard difficulty.
 * Pass one of these into createInitialState(taskConfig).
 */

const TASKS = {
  easy: {
    job_title: "Frontend Developer Intern",
    company: "StartupXYZ",
    platform: "1click",
    deadline: 15,
    keywords: ["React", "CSS", "JavaScript"],
    chaos_enabled: false,
    ghosting_probability: 0,
    recruiter_curveball_probability: 0,
  },

  medium: {
    job_title: "Backend Engineer",
    company: "MidSizeCo",
    platform: "linkedin_easy_apply",
    deadline: 10,
    keywords: ["Node.js", "PostgreSQL", "REST APIs", "Docker"],
    chaos_enabled: true,
    ghosting_probability: 0.3,       // 30% chance of ghosting on referral request
    recruiter_curveball_probability: 0.2, // 20% chance per step
  },

  hard: {
    job_title: "Software Engineer",
    company: "BigTechCorp",
    platform: "workday",
    deadline: 7,
    keywords: ["System Design", "Python", "Distributed Systems", "Kubernetes", "Go"],
    chaos_enabled: true,
    ghosting_probability: 0.5,
    recruiter_curveball_probability: 0.35,
    require_tailoring: true, // resume tailoring is mandatory for full score
  },
};

module.exports = { TASKS };
