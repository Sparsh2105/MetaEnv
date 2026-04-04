---
title: Job Application RL Environment
emoji: 💼
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
tags:
  - openenv
  - reinforcement-learning
  - llm-agent
  - job-application
---

<div align="center">

# 💼 MetaEnv — Job Application RL Environment

### A production-grade OpenEnv environment where LLM agents navigate real-world job applications

[![OpenEnv](https://img.shields.io/badge/OpenEnv-v1.0-4f6ef7?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==)](https://huggingface.co/spaces)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**[🚀 Live Demo](#-deployment) · [📖 API Docs](#-api-reference) · [🎮 Playground](#-frontend-ui) · [🤖 Agent Runner](#-agent-runner)**

</div>

---

## 🧠 What Is This?

MetaEnv is a **real-world reinforcement learning environment** built on the [OpenEnv](https://huggingface.co/openenv) spec. It simulates the full lifecycle of a job application — from discovering a role to securing an interview — complete with:

- ⏰ **Time pressure** — deadlines that force efficient decision-making
- 🚨 **Recruiter chaos** — random curveball events that demand immediate response
- 🏢 **Platform constraints** — Workday costs 3 steps, 1-click costs 1
- 👻 **Ghosting mechanics** — referral requests can be ignored
- 📄 **Resume tailoring** — keyword matching multiplies your reward up to 2×

This is not a toy. It models a task that millions of people do every day, making it ideal for training and evaluating LLM agents on **real-world sequential decision-making**.

---

## 🗂️ Project Structure

```
metaenv/
├── 🖥️  server.js              # Express API — OpenEnv HTTP interface
├── 🐍  inference.py           # Baseline agent (OpenAI client, [START]/[STEP]/[END] logs)
├── 📊  eval.py                # Multi-episode evaluation script
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
        ├── api/client.js      # Typed API client with proxy
        ├── components/
        │   ├── Header.jsx     # Nav + live API status indicator
        │   ├── StatePanel.jsx # Real-time environment state display
        │   ├── RewardChart.jsx# Recharts reward-per-step line chart
        │   ├── StepLog.jsx    # Scrolling terminal-style action log
        │   └── DifficultyBadge.jsx
        └── pages/
            ├── Dashboard.jsx  # Overview, metrics, task cards, charts
            ├── Playground.jsx # Manual interactive episode play
            ├── AgentRunner.jsx# Live LLM agent with configurable API
            └── DocsPage.jsx   # Interactive API reference + try-it
```

---

## ✅ OpenEnv Spec Compliance

| Requirement | Status |
|---|---|
| Real-world task simulation | ✅ Job application lifecycle |
| Typed Observation / Action / Reward models | ✅ Fully documented |
| `step(action)` → observation, reward, done, info | ✅ `POST /step` |
| `reset()` → initial observation | ✅ `POST /reset` |
| `state()` → current state | ✅ `GET /state` |
| `openenv.yaml` with metadata | ✅ Complete |
| Minimum 3 tasks with graders (easy→hard) | ✅ Easy / Medium / Hard |
| Reward 0.0–1.0 with partial progress signals | ✅ Step penalties + bonuses |
| Baseline inference script | ✅ `inference.py` |
| Dockerfile + HF Space deployment | ✅ Multi-stage Docker |

---

## 🎯 Task Scenarios

### 🟢 Easy — Frontend Developer Intern @ StartupXYZ
| Property | Value |
|---|---|
| Platform | `1click` |
| Deadline | 15 days |
| Ghosting probability | 0% |
| Recruiter curveballs | Disabled |
| Keywords | React, CSS, JavaScript |
| **Expected score** | **~0.8–1.0** |

No chaos. Straightforward apply flow. Designed for baseline agents to establish a performance floor.

---

### 🟡 Medium — Backend Engineer @ MidSizeCo
| Property | Value |
|---|---|
| Platform | `linkedin_easy_apply` |
| Deadline | 10 days |
| Ghosting probability | 30% |
| Recruiter curveball probability | 20% per step |
| Keywords | Node.js, PostgreSQL, REST APIs, Docker |
| **Expected score** | **~0.4–0.7** |

Tighter deadline. Recruiter events fire randomly — agent must prioritize `reply_email` or take a -1.0 hit. Tests reactive decision-making.

---

### 🔴 Hard — Software Engineer @ BigTechCorp
| Property | Value |
|---|---|
| Platform | `workday` |
| Deadline | 7 days |
| Ghosting probability | 50% |
| Recruiter curveball probability | 35% per step |
| Keywords | System Design, Python, Distributed Systems, Kubernetes, Go |
| Tailoring required | Yes (mandatory for full score) |
| **Expected score** | **~0.1–0.3** |

Workday costs 3 steps. High chaos. Brutal deadline. Resume tailoring is mandatory for full reward. Designed to challenge frontier models.

---

## 🏆 Reward Structure

```
Terminal Rewards:
  interview_secured    → 1.0   (reply_email to recruiter event)
  applied_with_referral → 0.5  (referral not ghosted + submitted)
  applied_cold         → 0.2   (submitted without referral)
  deadline_missed      → 0.0   (ran out of time)

Step Rewards:
  every step           → -0.01  (time penalty — act efficiently)
  recruiter reply      → +0.30  (correct prioritization bonus)

Penalties:
  missed recruiter event → -1.00  (ignored reply_email when pending)
  wrong platform action  → -0.10  (apply_1click on workday, etc.)
  redundant action       → -0.05  (already applied, already requested)

Tailoring Multiplier (applied to terminal reward):
  ≥80% keyword match   → 2.0×
  ≥50% keyword match   → 1.5×
  no tailoring         → 1.0×
  (capped at 1.0 total)
```

---

## 🖥️ Frontend UI

A full enterprise-grade React dashboard served at the same port as the API.

### 📊 Dashboard Tab
- Hero banner with live API status indicator
- Live environment state strip (job, company, day, reward)
- 3 task scenario cards (Easy / Medium / Hard) with full metadata
- Baseline agent scores bar chart (Recharts)
- Terminal reward structure visualization
- Reward mechanics breakdown grid

### 🎮 Playground Tab
- Select difficulty and start a manual episode
- Real-time `StatePanel` — job info, time bar, keyword tags, status flags
- 6 action buttons with urgency highlighting (reply_email pulses red when pending)
- Tailored skills input pre-filled with job keywords
- Live reward-per-step line chart
- Scrolling terminal-style step log with color-coded entries
- Final score display with tailoring multiplier breakdown

### 🤖 Agent Runner Tab
- Configure LLM API base URL, model name, API key, episode count
- Runs a real LLM agent against the environment in the browser
- Step-by-step live visualization — state updates, reward chart, log
- Per-episode scores + average score summary
- Stop button to interrupt mid-run
- Works with any OpenAI-compatible API (OpenAI, Groq, Together, local Ollama)

### 📖 API Docs Tab
- Full endpoint reference for all 4 routes
- Request/response examples with copy button
- Live "Try it" panel — send real requests and see responses inline
- Observation space field reference table
- Python quick-start code snippet

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/state` | Current observation (what the agent sees) |
| `POST` | `/reset` | Reset episode `{"difficulty": "easy\|medium\|hard"}` |
| `POST` | `/step` | Take action `{"action": "...", "tailored_skills": [...]}` |
| `GET` | `/actions` | List all valid actions with descriptions |

### Valid Actions

| Action | Cost | Notes |
|---|---|---|
| `request_referral` | 1 step | 30% ghosting chance (configurable per difficulty) |
| `reply_email` | 1 step | MUST use when `recruiter_replied_pending: true` |
| `apply_workday` | 3 steps | Only valid when `platform == "workday"` |
| `apply_1click` | 1 step | Not valid for Workday platform |
| `submit_application` | 1 step | Include `tailored_skills[]` for multiplier bonus |
| `wait` | 1 step | Skip step — time still advances |

### Example: Full Episode

```python
import requests

BASE = "http://localhost:3000"

# 1. Reset
obs = requests.post(f"{BASE}/reset", json={"difficulty": "hard"}).json()["observation"]

# 2. Agent loop
while not obs["done"]:
    # Handle recruiter event immediately
    if obs["recruiter_replied_pending"]:
        action = "reply_email"
    elif not obs["applied"]:
        action = "apply_workday" if obs["platform"] == "workday" else "apply_1click"
    elif not obs["application_submitted"]:
        action = "submit_application"
    else:
        action = "wait"

    result = requests.post(f"{BASE}/step", json={
        "action": action,
        "tailored_skills": obs["job_description_keywords"]  # full match = 2x reward
    }).json()

    obs = result["observation"]
    print(f"Step reward: {result['reward']:+.4f} | Total: {obs['total_reward']:+.4f}")

print(f"Done: {obs['terminal_reason']}")
```

---

## 🐍 Inference Script

The `inference.py` script runs an LLM agent against the environment using the OpenAI client.

### Environment Variables

```bash
export API_BASE_URL="https://api.openai.com/v1"   # LLM API endpoint
export MODEL_NAME="gpt-4o-mini"                    # Model identifier
export HF_TOKEN="sk-..."                           # API key
export ENV_API_URL="http://localhost:3000"         # RL environment URL
```

### Run

```bash
pip install openai requests
python inference.py --difficulty medium --episodes 3
```

### Output Format (required by hackathon spec)

```json
{"type": "START", "episode": 1, "difficulty": "medium", "model": "gpt-4o-mini"}
{"type": "STEP",  "episode": 1, "step": 1, "action": "apply_1click", "reward": -0.01, "total_reward": -0.01, "done": false}
{"type": "STEP",  "episode": 1, "step": 2, "action": "submit_application", "reward": -0.01, "total_reward": -0.02, "done": false}
{"type": "END",   "episode": 1, "score": 0.5, "steps_taken": 3, "terminal_reason": "applied_with_referral"}
{"type": "SUMMARY", "avg_score": 0.54, "episodes": 3, "scores": [0.5, 0.6, 0.52]}
```

---

## 🐳 Deployment

### Local Development

```bash
# 1. Install backend dependencies
npm install

# 2. Start the backend API
node server.js
# → API running at http://localhost:3000

# 3. In a separate terminal — start frontend dev server
cd frontend
npm install
npm run dev
# → Frontend at http://localhost:5173 (proxies API calls to :3000)
```

### Production (Single Server)

```bash
# Build frontend
cd frontend && npm run build && cd ..

# Start — serves both API and frontend on port 3000
node server.js
# → Open http://localhost:3000
```

### Docker

```bash
# Build
docker build -t metaenv .

# Run
docker run -p 7860:7860 metaenv

# → Open http://localhost:7860
```

### Hugging Face Spaces

The `Dockerfile` is configured for HF Spaces (port 7860). Push to your Space repo and it deploys automatically.

```bash
git remote add space https://huggingface.co/spaces/YOUR_USERNAME/metaenv
git push space main
```

---

## 📊 Baseline Scores

Scores from `gpt-4o-mini` across 10 episodes per difficulty:

| Difficulty | Avg Score | Best | Worst |
|---|---|---|---|
| 🟢 Easy | 0.82 | 1.0 | 0.4 |
| 🟡 Medium | 0.54 | 1.0 | 0.0 |
| 🔴 Hard | 0.21 | 0.5 | 0.0 |
| **Overall** | **0.52** | — | — |

---

## 🧪 Testing the Full System

### Step 1 — Start the server
```bash
node server.js
```

### Step 2 — Test API endpoints manually
```bash
# Health check
curl http://localhost:3000/state

# Reset to easy
curl -X POST http://localhost:3000/reset -H "Content-Type: application/json" -d '{"difficulty":"easy"}'

# Take an action
curl -X POST http://localhost:3000/step -H "Content-Type: application/json" -d '{"action":"apply_1click"}'

# Submit with tailoring
curl -X POST http://localhost:3000/step -H "Content-Type: application/json" \
  -d '{"action":"submit_application","tailored_skills":["React","CSS","JavaScript"]}'
```

### Step 3 — Open the UI
Navigate to `http://localhost:3000` in your browser.

### Step 4 — Run the inference script
```bash
export API_BASE_URL="https://api.openai.com/v1"
export MODEL_NAME="gpt-4o-mini"
export HF_TOKEN="your-key-here"
python inference.py --difficulty easy --episodes 1
```

### Step 5 — Run full evaluation
```bash
python eval.py --api-url http://localhost:3000 --episodes 5
```

### Step 6 — Docker test
```bash
docker build -t metaenv . && docker run -p 7860:7860 metaenv
# Open http://localhost:7860
```

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Node.js 20, Express 4 |
| RL Environment | Pure JavaScript (stateful, in-memory) |
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| Charts | Recharts |
| Inference | Python 3, OpenAI client |
| Container | Docker (multi-stage build) |
| Deployment | Hugging Face Spaces (Docker SDK) |

---

## 📋 Hackathon Checklist

- [x] Real-world task simulation (job application lifecycle)
- [x] Full OpenEnv spec: `step()` / `reset()` / `state()` / `openenv.yaml`
- [x] 3 tasks with graders: Easy → Medium → Hard (scores 0.0–1.0)
- [x] Meaningful reward function with partial progress signals
- [x] Step penalties, chaos penalties, tailoring multipliers
- [x] Baseline inference script (`inference.py`) using OpenAI client
- [x] Reads `API_BASE_URL`, `MODEL_NAME`, `HF_TOKEN` from env vars
- [x] Structured `[START]` / `[STEP]` / `[END]` stdout logs
- [x] Working Dockerfile (multi-stage, port 7860)
- [x] Enterprise-grade frontend UI (dark mode, 4 tabs, live charts)
- [x] Interactive API docs with live try-it panel
- [x] CORS enabled for cross-origin agent access
- [x] README with full documentation

---

## 📄 License

MIT © 2025 MetaEnv Contributors
