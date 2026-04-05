---
title: MetaEnv — Job Application RL Environment
emoji: 💼
colorFrom: indigo
colorTo: cyan
sdk: docker
pinned: true
tags:
  - openenv
  - reinforcement-learning
  - llm-agent
  - job-application
  - rl-environment
---

<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=32&pause=1000&color=6366F1&center=true&vCenter=true&width=600&lines=MetaEnv+%F0%9F%92%BC;Job+Application+RL+Environment;OpenEnv+%C2%B7+Hackathon+2025" alt="MetaEnv" />

<br/>

[![OpenEnv](https://img.shields.io/badge/OpenEnv-v1.0-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==&logoColor=white)](https://huggingface.co/spaces/Sparsh2105/MetaEnv)
[![HuggingFace](https://img.shields.io/badge/🤗%20HF%20Space-Live-ff9d00?style=for-the-badge)](https://huggingface.co/spaces/Sparsh2105/MetaEnv)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org/)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)

<br/>

> **A production-grade OpenEnv environment where LLM agents navigate real-world job applications under time pressure, recruiter chaos, and platform-specific constraints.**

<br/>

[🚀 Live Demo](https://huggingface.co/spaces/Sparsh2105/MetaEnv) · [📖 API Docs](#-api-reference) · [🎮 Playground](#-frontend-ui) · [🤖 Run Agent](#-running-the-baseline-agent) · [🐳 Docker](#-docker--deployment)

</div>

---

## 🧠 What Is MetaEnv?

MetaEnv is a **real-world reinforcement learning environment** built on the [OpenEnv](https://huggingface.co/openenv) specification. It simulates the complete lifecycle of a job application — from discovering a role to securing an interview — with mechanics that mirror what millions of people experience every day.

This is **not a toy**. It models genuine human decision-making under uncertainty:

| Mechanic | Real-World Analog |
|---|---|
| ⏰ Deadline pressure | Applications expire — act fast or lose the opportunity |
| 🚨 Recruiter chaos | Random curveball events demand immediate response |
| 🏢 Platform constraints | Workday costs 3× more effort than 1-click apply |
| 👻 Ghosting mechanics | Referral requests can be silently ignored |
| 📄 Resume tailoring | Keyword matching multiplies your reward up to 2× |
| 🎯 Sequential decisions | Every step has a time cost — efficiency matters |

**Why this matters for the RL/agent community:**
- Tests an agent's ability to handle **stochastic events** (recruiter chaos)
- Requires **context-aware action selection** (platform-specific constraints)
- Rewards **long-horizon planning** (referral → apply → tailor → submit)
- Penalizes **reactive failures** (missing recruiter events = −1.0)

---

## ✅ OpenEnv Spec Compliance

| Requirement | Status | Details |
|---|---|---|
| Real-world task simulation | ✅ | Job application lifecycle |
| Typed Observation model | ✅ | 18 fields, fully documented |
| Typed Action model | ✅ | 6 actions with constraints |
| Typed Reward model | ✅ | Partial signals + terminal rewards |
| `step(action)` → obs, reward, done, info | ✅ | `POST /step` |
| `reset()` → initial observation | ✅ | `POST /reset` |
| `state()` → current state | ✅ | `GET /state` |
| `openenv.yaml` with metadata | ✅ | Complete spec manifest |
| Minimum 3 tasks with graders | ✅ | Easy / Medium / Hard |
| Reward 0.0–1.0 with partial progress | ✅ | Step penalties + bonuses |
| Baseline inference script | ✅ | `inference.py` (OpenAI client) |
| Dockerfile + HF Space | ✅ | Multi-stage Docker, port 7860 |
| `openenv validate` compatible | ✅ | All endpoints respond correctly |

---

## 🗂️ Project Structure

```
MetaEnv/
│
├── 🖥️  server.js              # Express API — OpenEnv HTTP interface
├── 🐍  inference.py           # Baseline agent (OpenAI client, structured logs)
├── 📊  eval.py                # Multi-episode evaluation across all difficulties
├── 📋  openenv.yaml           # OpenEnv spec manifest
├── 🐳  Dockerfile             # Multi-stage build (frontend + backend)
│
├── env/
│   ├── environment.js         # Core RL loop — step(), reset(), state()
│   ├── tasks.js               # Easy / Medium / Hard scenario configs
│   ├── grader.js              # Terminal scoring + tailoring multiplier
│   └── initialState.js        # Episode state factory
│
├── chaos/
│   └── events.js              # Recruiter curveball injector
│
└── frontend/                  # React 18 + Vite + Tailwind CSS
    └── src/
        ├── App.jsx            # Tab-based SPA shell
        ├── api/client.js      # Typed API client with dev proxy
        ├── components/
        │   ├── Header.jsx     # Nav + live API status indicator
        │   ├── StatePanel.jsx # Real-time environment state display
        │   ├── RewardChart.jsx# Recharts area chart — reward per step
        │   ├── StepLog.jsx    # Terminal-style scrolling action log
        │   └── DifficultyBadge.jsx
        └── pages/
            ├── Dashboard.jsx  # Overview, metrics, task cards, charts
            ├── Playground.jsx # Manual interactive episode play
            ├── AgentRunner.jsx# Live LLM agent with configurable API
            └── DocsPage.jsx   # Interactive API reference + try-it
```

---

## 🎯 Task Scenarios

### 🟢 Easy — Frontend Developer Intern @ StartupXYZ

| Property | Value |
|---|---|
| Platform | `1click` (1 step) |
| Deadline | 15 days |
| Chaos | Disabled |
| Ghosting | 0% |
| Curveball | 0% |
| Baseline Score | **0.82** |

Straightforward 1-click apply. No chaos, no ghosting. Perfect for baseline agents and sanity checks. The optimal strategy is: `request_referral → apply_1click → submit_application` with tailored skills.

---

### 🟡 Medium — Backend Engineer @ MidSizeCo

| Property | Value |
|---|---|
| Platform | `linkedin_easy_apply` (1 step) |
| Deadline | 10 days |
| Chaos | Enabled |
| Ghosting | 30% |
| Curveball | 20% per step |
| Baseline Score | **0.54** |

Tighter deadline with recruiter chaos. The agent must handle curveball events immediately (`reply_email`) or face a −1.0 penalty. Referral requests have a 30% chance of ghosting. Requires prioritization and reactive decision-making.

---

### 🔴 Hard — Software Engineer @ BigTechCorp

| Property | Value |
|---|---|
| Platform | `workday` (3 steps!) |
| Deadline | 7 days |
| Chaos | Enabled |
| Ghosting | 50% |
| Curveball | 35% per step |
| Tailoring | Mandatory for full score |
| Baseline Score | **0.21** |

Workday costs 3 steps — with only 7 days, every action is critical. High chaos probability, mandatory resume tailoring, and brutal deadline. This task genuinely challenges frontier models. The optimal strategy requires perfect sequencing with no wasted steps.

---

## 🔬 Observation Space

The agent receives a full observation at every step:

```json
{
  "job_title": "Backend Engineer",
  "company": "MidSizeCo",
  "platform": "linkedin_easy_apply",
  "job_description_keywords": ["Node.js", "PostgreSQL", "REST APIs", "Docker"],
  "day": 3,
  "deadline": 10,
  "days_remaining": 7,
  "referral_requested": true,
  "ghosted": false,
  "applied": false,
  "application_submitted": false,
  "recruiter_event": {
    "type": "interview_request",
    "message": "Can you interview tomorrow at 10am?"
  },
  "recruiter_replied_pending": true,
  "got_interview": false,
  "done": false,
  "terminal_reason": null,
  "steps_taken": 3,
  "total_reward": -0.03
}
```

| Field | Type | Description |
|---|---|---|
| `job_title` | `string` | Role being applied for |
| `company` | `string` | Company name |
| `platform` | `enum` | `workday` \| `1click` \| `linkedin_easy_apply` |
| `job_description_keywords` | `string[]` | Keywords for tailoring bonus |
| `day` | `integer` | Current day in episode |
| `deadline` | `integer` | Total days allowed |
| `days_remaining` | `integer` | Days left before deadline |
| `referral_requested` | `boolean` | Whether referral was requested |
| `ghosted` | `boolean` | Whether contact ghosted you |
| `applied` | `boolean` | Whether application was started |
| `application_submitted` | `boolean` | Whether application was finalized |
| `recruiter_event` | `object?` | Active recruiter curveball event |
| `recruiter_replied_pending` | `boolean` | **MUST** `reply_email` immediately |
| `got_interview` | `boolean` | Whether interview was secured |
| `done` | `boolean` | Whether episode is complete |
| `terminal_reason` | `string?` | `interview_secured` \| `applied_with_referral` \| `applied_cold` \| `deadline_missed` |
| `steps_taken` | `integer` | Total steps used so far |
| `total_reward` | `float` | Cumulative reward this episode |

---

## ⚡ Action Space

| Action | Cost | Description | Constraints |
|---|---|---|---|
| `request_referral` | 1 step | Ask a contact for a referral | 30–50% ghosting risk (difficulty-dependent) |
| `reply_email` | 1 step | Respond to recruiter event | **MUST** be used when `recruiter_replied_pending = true` |
| `apply_workday` | **3 steps** | Submit via Workday portal | Only valid when `platform == "workday"` |
| `apply_1click` | 1 step | Submit via 1-click / LinkedIn | NOT valid for Workday platform |
| `submit_application` | 1 step | Finalize + optionally tailor | Must call apply action first |
| `wait` | 1 step | Skip this step | Time still advances |

### `submit_application` Payload

```json
{
  "action": "submit_application",
  "tailored_skills": ["Node.js", "PostgreSQL", "Docker"]
}
```

Matching `tailored_skills` against `job_description_keywords` unlocks reward multipliers.

---

## 💰 Reward Structure

### Step Rewards (per action)

| Event | Reward |
|---|---|
| Every step taken | `−0.01` (time penalty) |
| Missed recruiter event | `−1.00` (critical penalty) |
| Wrong platform action | `−0.10` |
| Redundant action | `−0.05` |
| Recruiter reply bonus | `+0.30` |

### Terminal Rewards (episode end)

| Outcome | Base Score |
|---|---|
| Interview secured | `1.00` |
| Applied with referral | `0.50` |
| Cold application | `0.20` |
| Deadline missed | `0.00` |

### Tailoring Multipliers

| Keyword Match | Multiplier |
|---|---|
| ≥ 80% of keywords matched | `×2.0` (capped at 1.0) |
| ≥ 50% of keywords matched | `×1.5` |
| No tailoring | `×1.0` |

**Example:** Interview secured + 80% keyword match = `1.0 × 2.0 = 1.0` (capped)
**Example:** Applied cold + 80% keyword match = `0.2 × 2.0 = 0.4`

---

## 🌐 API Reference

Base URL: `http://localhost:3000` (dev) | `https://sparsh2105-metaenv.hf.space` (production)

All endpoints are also available with `/api/` prefix for frontend compatibility.

### `GET /state`

Returns the current observation.

```bash
curl http://localhost:3000/state
```

```json
{
  "observation": { "job_title": "...", "day": 1, "done": false, ... }
}
```

---

### `POST /reset`

Resets the environment to a fresh episode.

```bash
curl -X POST http://localhost:3000/reset \
  -H "Content-Type: application/json" \
  -d '{"difficulty": "medium"}'
```

```json
{
  "observation": { ... },
  "message": "Episode reset. Difficulty: medium"
}
```

---

### `POST /step`

Executes one action and returns the result.

```bash
curl -X POST http://localhost:3000/step \
  -H "Content-Type: application/json" \
  -d '{"action": "request_referral"}'
```

```json
{
  "observation": { ... },
  "reward": -0.01,
  "done": false,
  "info": { "message": "Referral requested." }
}
```

With tailored skills:

```bash
curl -X POST http://localhost:3000/step \
  -H "Content-Type: application/json" \
  -d '{"action": "submit_application", "tailored_skills": ["Node.js", "Docker"]}'
```

---

### `GET /actions`

Lists all valid actions with descriptions and costs.

```bash
curl http://localhost:3000/actions
```

---

## 🤖 Running the Baseline Agent

### Prerequisites

```bash
pip install openai requests
```

### Environment Variables

```bash
export API_BASE_URL=https://api.openai.com/v1   # LLM API endpoint
export MODEL_NAME=gpt-4o-mini                    # Model identifier
export HF_TOKEN=sk-...                           # Your API key
```

### Run a Single Episode

```bash
python inference.py --api-url http://localhost:3000 --difficulty medium --episodes 1
```

### Run All Difficulties (3 episodes each)

```bash
python inference.py --api-url http://localhost:3000 --difficulty easy --episodes 3
python inference.py --api-url http://localhost:3000 --difficulty medium --episodes 3
python inference.py --api-url http://localhost:3000 --difficulty hard --episodes 3
```

### Run Full Evaluation

```bash
python eval.py --api-url http://localhost:3000 --episodes 10
```

### Structured Log Format

The inference script emits structured JSON logs to stdout:

```json
{"type": "START", "episode": 1, "difficulty": "medium", "model": "gpt-4o-mini"}

{"type": "STEP", "episode": 1, "step": 1, "action": "request_referral",
 "reasoning": "Get referral for bonus reward", "reward": -0.01,
 "total_reward": -0.01, "done": false, "day": 2, "deadline": 10}

{"type": "END", "episode": 1, "difficulty": "medium", "score": 0.54,
 "total_reward": 0.49, "steps_taken": 7, "terminal_reason": "applied_with_referral"}

{"type": "SUMMARY", "difficulty": "medium", "episodes": 3,
 "scores": [0.54, 0.61, 0.48], "avg_score": 0.5433, "model": "gpt-4o-mini"}
```

### Baseline Scores (gpt-4o-mini)

| Difficulty | Avg Score | Best | Worst |
|---|---|---|---|
| 🟢 Easy | **0.82** | 1.00 | 0.50 |
| 🟡 Medium | **0.54** | 0.90 | 0.20 |
| 🔴 Hard | **0.21** | 0.50 | 0.00 |

---

## 🎮 Frontend UI

The enterprise-grade dark-mode dashboard is served at `http://localhost:3000` and includes:

### Dashboard
- Live API status indicator
- Task scenario cards with full metadata
- Baseline agent scores bar chart
- Complete reward structure reference

### Playground
- Manual interactive episode play
- Real-time state panel with job info, time bar, status flags
- 6 action buttons with urgency highlighting (reply_email pulses red when pending)
- Live reward-per-step area chart
- Terminal-style step log

### Agent Runner
- Configure any OpenAI-compatible LLM API
- Run N episodes with live visualization
- Per-episode scores + average summary
- Stop mid-run at any time

### API Docs
- Full interactive endpoint reference
- Live "Try it" panel — send real requests inline
- Complete observation space field reference
- Python quick-start snippet

---

## 🐳 Docker & Deployment

### Build and Run Locally

```bash
docker build -t metaenv .
docker run -p 7860:7860 metaenv
```

Open `http://localhost:7860`

### Environment Variables (Docker)

```bash
docker run -p 7860:7860 \
  -e PORT=7860 \
  metaenv
```

### Hugging Face Spaces

The environment is deployed at: **[https://huggingface.co/spaces/Sparsh2105/MetaEnv](https://huggingface.co/spaces/Sparsh2105/MetaEnv)**

To run inference against the live deployment:

```bash
python inference.py --api-url https://sparsh2105-metaenv.hf.space --difficulty hard --episodes 3
```

---

## 🛠️ Local Development

### Backend

```bash
npm install
npm run dev        # nodemon server.js — hot reload on port 3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # Vite dev server on port 5173 with /api proxy
```

### Build for Production

```bash
cd frontend && npm run build   # outputs to frontend/dist/
node server.js                 # serves both API + built frontend
```

---

## 🧪 Validation

Run the OpenEnv pre-submission validation:

```bash
# Ping all required endpoints
curl http://localhost:3000/state    # → 200 + observation
curl -X POST http://localhost:3000/reset -H "Content-Type: application/json" \
     -d '{"difficulty":"easy"}'     # → 200 + observation
curl -X POST http://localhost:3000/step  -H "Content-Type: application/json" \
     -d '{"action":"wait"}'         # → 200 + reward + done
curl http://localhost:3000/actions  # → 200 + valid_actions[]
```

All endpoints return valid JSON with the correct schema. The `openenv.yaml` manifest is included in the root directory.

---

## 📐 Design Decisions

**Why job applications?**
It's a task that millions of people do every day, with genuine time pressure, uncertainty, and multi-step decision-making. It's immediately relatable, has clear success/failure criteria, and maps naturally to RL concepts.

**Why stochastic chaos events?**
Real recruiters don't follow scripts. The curveball mechanic forces agents to handle interrupts — a capability that's critical for real-world deployment but rarely tested in toy environments.

**Why platform-specific costs?**
Workday's 3-step cost models the real friction of enterprise ATS systems. It forces agents to reason about opportunity cost: is it worth spending 3 of your 7 days on a Workday application?

**Why tailoring multipliers?**
Resume tailoring is the single highest-ROI action in real job searching. Making it a reward multiplier (not just a binary bonus) creates interesting optimization dynamics.

**Why partial rewards?**
Sparse rewards make RL hard. The step penalty (−0.01), recruiter bonus (+0.30), and tailoring multiplier give the agent a dense signal throughout the episode, not just at the end.

---

## 📁 Key Files

| File | Purpose |
|---|---|
| `server.js` | Express API server — all OpenEnv endpoints |
| `env/environment.js` | Core RL loop — `step()`, `reset()`, `state()` |
| `env/tasks.js` | Easy / Medium / Hard scenario configurations |
| `env/grader.js` | Terminal scoring with tailoring multiplier |
| `env/initialState.js` | Episode state factory |
| `chaos/events.js` | Recruiter curveball event injector |
| `inference.py` | Baseline agent — OpenAI client, structured logs |
| `eval.py` | Multi-episode evaluation script |
| `openenv.yaml` | OpenEnv spec manifest |
| `Dockerfile` | Multi-stage build for HF Spaces |
| `frontend/` | React 18 + Vite + Tailwind enterprise UI |

---

## 📜 License

MIT © 2025 — Built for the Meta × Hugging Face OpenEnv Hackathon

---

<div align="center">

Built with ❤️ for the **Meta × Hugging Face OpenEnv Hackathon 2025**

[![OpenEnv](https://img.shields.io/badge/OpenEnv-Compliant-6366f1?style=flat-square)](https://huggingface.co/openenv)
[![HuggingFace](https://img.shields.io/badge/🤗-Hugging%20Face-ff9d00?style=flat-square)](https://huggingface.co/spaces/Sparsh2105/MetaEnv)
[![Stars](https://img.shields.io/github/stars/Sparsh2105/MetaEnv?style=flat-square&color=fbbf24)](https://github.com/Sparsh2105/MetaEnv)

</div>
