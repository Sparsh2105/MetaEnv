---
title: Job Application RL Environment
emoji: 💼
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
---

# Job Application RL Environment

A simulated reinforcement learning environment where an LLM agent navigates a job application process under time pressure, recruiter chaos, and platform-specific constraints.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/state` | Current observation |
| POST | `/reset` | Reset episode `{"difficulty": "easy\|medium\|hard"}` |
| POST | `/step` | Take action `{"action": "...", "tailored_skills": [...]}` |
| GET | `/actions` | List valid actions |

## Valid Actions

- `request_referral` — 30% ghosting chance
- `reply_email` — must respond to recruiter event immediately
- `apply_workday` — 3 time-steps, only for workday platform
- `apply_1click` — 1 time-step
- `submit_application` — finalize, include `tailored_skills` for 2x reward
- `wait` — skip step

## Scoring

| Outcome | Score |
|---------|-------|
| Interview secured | 1.0 |
| Applied with referral | 0.5 |
| Cold apply | 0.2 |
| Missed deadline | 0.0 |

Resume tailoring multiplier: up to 2x if skills match job keywords.

## Run the LLM Agent

```bash
pip install groq requests
export GROQ_API_KEY=your_key
python inference.py --api-url https://your-space.hf.space --difficulty medium
```
