/**
 * server.js
 * Express API exposing the RL environment over HTTP.
 *
 * Endpoints:
 *   GET  /state          → current observation
 *   POST /reset          → reset episode (body: { difficulty: "easy"|"medium"|"hard" })
 *   POST /step           → take action   (body: { action: string, tailored_skills?: string[] })
 *   GET  /actions        → list valid actions
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
const { Environment } = require("./env/environment");
const { TASKS } = require("./env/tasks");

const app = express();
app.use(cors());
app.use(express.json());

// Serve built frontend (production)
const FRONTEND_DIST = path.join(__dirname, "frontend", "dist");
app.use(express.static(FRONTEND_DIST));

// Single shared environment instance (stateful per session)
let env = new Environment(TASKS.medium);

// Helper: register route on both /path and /api/path
function route(method, path, handler) {
  app[method](path, handler);
  app[method](`/api${path}`, handler);
}

// --- GET /state ---
route("get", "/state", (req, res) => {
  res.json({ observation: env.getState() });
});

// --- POST /reset ---
route("post", "/reset", (req, res) => {
  const difficulty = req.body?.difficulty || "medium";
  const taskConfig = TASKS[difficulty];

  if (!taskConfig) {
    return res.status(400).json({
      error: `Unknown difficulty "${difficulty}". Valid: easy, medium, hard`,
    });
  }

  const observation = env.reset(taskConfig);
  res.json({ observation, message: `Episode reset. Difficulty: ${difficulty}` });
});

// --- POST /step ---
route("post", "/step", (req, res) => {
  const { action, tailored_skills } = req.body || {};

  if (!action) {
    return res.status(400).json({ error: "Missing required field: action" });
  }

  const result = env.step({ action, tailored_skills });
  res.json(result);
});

// --- GET /actions ---
route("get", "/actions", (req, res) => {
  res.json({
    valid_actions: [
      {
        name: "request_referral",
        description: "Ask someone for a referral. 30% chance of being ghosted.",
        cost: "1 step",
      },
      {
        name: "reply_email",
        description: "Reply to a pending recruiter event. MUST be done immediately or -1.0 penalty.",
        cost: "1 step",
      },
      {
        name: "apply_workday",
        description: "Apply via Workday portal. Only valid if platform=workday.",
        cost: "3 steps",
      },
      {
        name: "apply_1click",
        description: "Apply via 1-click (LinkedIn Easy Apply etc). Not valid for Workday.",
        cost: "1 step",
      },
      {
        name: "submit_application",
        description: "Finalize application. Optionally include tailored_skills[] for bonus reward.",
        cost: "1 step",
        optional_payload: { tailored_skills: "string[]" },
      },
      {
        name: "wait",
        description: "Do nothing this step. Time still advances.",
        cost: "1 step",
      },
    ],
  });
});

// Fallback: serve frontend for any non-API route
app.get("*", (req, res) => {
  const indexPath = path.join(FRONTEND_DIST, "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) res.status(404).json({ error: "Frontend not built. Run: cd frontend && npm run build" });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`RL Environment API running on http://localhost:${PORT}`);
  console.log(`Frontend served at http://localhost:${PORT}`);
  console.log(`Endpoints: GET /state | POST /reset | POST /step | GET /actions`);
});
