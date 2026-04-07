"""
inference.py
Job Application RL Environment — Baseline Inference Script

MANDATORY ENV VARS:
  API_BASE_URL      LLM API endpoint
  MODEL_NAME        Model identifier
  HF_TOKEN          Hugging Face / API key (also accepts OPENAI_API_KEY)
  ENV_API_URL       RL environment base URL (default: https://sparsh2105-metaenv.hf.space)

Usage:
    export API_BASE_URL=https://api.openai.com/v1
    export MODEL_NAME=gpt-4o-mini
    export HF_TOKEN=sk-...
    python inference.py
"""

import os
import json
import requests
import textwrap
from typing import List, Optional
from openai import OpenAI

# --- Credentials ---
API_KEY      = os.getenv("HF_TOKEN") or os.getenv("OPENAI_API_KEY", "")
API_BASE_URL = os.getenv("API_BASE_URL", "https://api.openai.com/v1")
MODEL_NAME   = os.getenv("MODEL_NAME",   "gpt-4o-mini")
ENV_API_URL  = os.getenv("ENV_API_URL",  "https://sparsh2105-metaenv.hf.space")

BENCHMARK    = "job-application-rl"
MAX_STEPS    = 30
TEMPERATURE  = 0.7
MAX_TOKENS   = 300
SUCCESS_SCORE_THRESHOLD = 0.5

client = OpenAI(api_key=API_KEY, base_url=API_BASE_URL)

SYSTEM_PROMPT = textwrap.dedent("""
You are an AI agent playing a job application simulation.
Goal: Secure an interview before the deadline.

Rules:
- If recruiter_replied_pending is true, you MUST use reply_email immediately or face -1.0 penalty
- Platform matters: apply_workday costs 3 steps (only for platform=workday)
- apply_1click costs 1 step and is NOT valid for workday platform
- After applying, call submit_application with tailored_skills matching job_description_keywords for 2x reward
- Every step costs -0.01 (time penalty), act efficiently

Respond ONLY with valid JSON (no extra text):
{
  "action": "request_referral" | "reply_email" | "apply_workday" | "apply_1click" | "submit_application" | "wait",
  "tailored_skills": ["skill1", "skill2"],
  "reasoning": "one sentence"
}
tailored_skills only needed for submit_application.
""").strip()


# --- Logging (strict format) ---

def log_start(task: str, env: str, model: str) -> None:
    print(f"[START] task={task} env={env} model={model}", flush=True)

def log_step(step: int, action: str, reward: float, done: bool, error: Optional[str]) -> None:
    error_val = error if error else "null"
    done_val  = str(done).lower()
    print(f"[STEP] step={step} action={action} reward={reward:.2f} done={done_val} error={error_val}", flush=True)

def log_end(success: bool, steps: int, score: float, rewards: List[float]) -> None:
    rewards_str = ",".join(f"{r:.2f}" for r in rewards)
    print(f"[END] success={str(success).lower()} steps={steps} score={score:.3f} rewards={rewards_str}", flush=True)


# --- Environment API ---

def env_reset(difficulty: str) -> dict:
    resp = requests.post(f"{ENV_API_URL}/reset", json={"difficulty": difficulty}, timeout=10)
    resp.raise_for_status()
    return resp.json()["observation"]

def env_step(action: str, tailored_skills: Optional[List[str]] = None) -> dict:
    payload = {"action": action}
    if tailored_skills:
        payload["tailored_skills"] = tailored_skills
    resp = requests.post(f"{ENV_API_URL}/step", json=payload, timeout=10)
    resp.raise_for_status()
    return resp.json()


# --- LLM ---

def get_model_action(obs: dict, history: List[str]) -> dict:
    history_block = "\n".join(history[-4:]) if history else "None"
    user_prompt = f"Current state:\n{json.dumps(obs, indent=2)}\n\nRecent history:\n{history_block}\n\nWhat action do you take?"
    try:
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": user_prompt},
            ],
            temperature=TEMPERATURE,
            max_tokens=MAX_TOKENS,
            stream=False,
        )
        text = (completion.choices[0].message.content or "").strip()
        # Try direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            import re
            match = re.search(r'\{[\s\S]*\}', text)
            if match:
                return json.loads(match.group())
        return {"action": "wait", "reasoning": "parse error"}
    except Exception as exc:
        print(f"[DEBUG] LLM error: {exc}", flush=True)
        return {"action": "wait", "reasoning": str(exc)}


# --- Episode runner ---

def run_episode(difficulty: str, episode_num: int = 1) -> float:
    task_name = f"job-application-{difficulty}"

    log_start(task=task_name, env=BENCHMARK, model=MODEL_NAME)

    rewards: List[float] = []
    steps_taken = 0
    score = 0.0
    success = False
    history: List[str] = []
    last_error: Optional[str] = None

    try:
        obs = env_reset(difficulty)

        for step in range(1, MAX_STEPS + 1):
            if obs["done"]:
                break

            parsed   = get_model_action(obs, history)
            action   = parsed.get("action", "wait")
            skills   = parsed.get("tailored_skills") or None
            reasoning = parsed.get("reasoning", "")

            last_error = None
            done = False
            try:
                result  = env_step(action, skills)
                obs     = result["observation"]
                reward  = result.get("reward", 0.0)
                done    = obs["done"]
                info    = result.get("info", {})

                if info.get("penalty"):
                    last_error = info["penalty"]
                elif info.get("warning"):
                    last_error = info["warning"]

                # Extract final score
                if info.get("final_grade"):
                    score = info["final_grade"]["score"]

            except Exception as e:
                reward = 0.0
                done   = False
                last_error = str(e)

            rewards.append(reward)
            steps_taken = step

            log_step(step=step, action=action, reward=reward, done=done, error=last_error)

            history.append(f"Step {step}: {action} -> reward {reward:+.2f} | {reasoning}")

            if done:
                break

        success = score >= SUCCESS_SCORE_THRESHOLD

    except Exception as e:
        last_error = str(e)
        print(f"[DEBUG] Episode error: {e}", flush=True)

    log_end(success=success, steps=steps_taken, score=score, rewards=rewards)
    return score


# --- Main ---

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--api-url",    default=ENV_API_URL)
    parser.add_argument("--difficulty", default=None, choices=["easy", "medium", "hard"])
    parser.add_argument("--episodes",   type=int, default=1)
    args = parser.parse_args()

    ENV_API_URL = args.api_url

    if not API_KEY:
        print("[ERROR] HF_TOKEN or OPENAI_API_KEY env var not set", flush=True)
        exit(1)

    difficulties = [args.difficulty] if args.difficulty else ["easy", "medium", "hard"]

    ep_num = 1
    all_scores = []
    for diff in difficulties:
        for _ in range(args.episodes):
            s = run_episode(diff, episode_num=ep_num)
            all_scores.append(s)
            ep_num += 1

    if len(difficulties) > 1:
        avg = sum(all_scores) / len(all_scores) if all_scores else 0.0
        print(f"[SUMMARY] difficulties=all overall_avg={avg:.3f} model={MODEL_NAME}", flush=True)
