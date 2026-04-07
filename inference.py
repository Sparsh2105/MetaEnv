#!/usr/bin/env python3
"""
inference.py
Job Application RL Environment — Baseline Inference Script

MANDATORY ENV VARS:
  API_BASE_URL   The API endpoint for the LLM.
  MODEL_NAME     The model identifier to use for inference.
  HF_TOKEN       Your Hugging Face / API key.
  ENV_API_URL    RL environment base URL (default: https://sparsh2105-metaenv.hf.space)

Defaults are set only for API_BASE_URL and MODEL_NAME (not HF_TOKEN):
  API_BASE_URL = os.getenv("API_BASE_URL", "https://api.openai.com/v1")
  MODEL_NAME   = os.getenv("MODEL_NAME",   "gpt-4o-mini")
  HF_TOKEN     = os.getenv("HF_TOKEN")

STDOUT FORMAT (strict):
  [START] task=<task_name> env=<benchmark> model=<model_name>
  [STEP]  step=<n> action=<action_str> reward=<0.00> done=<true|false> error=<msg|null>
  [END]   success=<true|false> steps=<n> score=<score> rewards=<r1,r2,...,rn>
"""

import os
import json
import re
import textwrap
import requests
from typing import List, Optional
from openai import OpenAI

# --- Credentials (defaults only for API_BASE_URL and MODEL_NAME, NOT HF_TOKEN) ---
API_KEY      = os.getenv("HF_TOKEN") or os.getenv("API_KEY")
API_BASE_URL = os.getenv("API_BASE_URL", "https://api.openai.com/v1")
MODEL_NAME   = os.getenv("MODEL_NAME",   "gpt-4o-mini")
ENV_API_URL  = os.getenv("ENV_API_URL",  "https://sparsh2105-metaenv.hf.space")

BENCHMARK             = "job-application-rl"
MAX_STEPS             = 30
TEMPERATURE           = 0.7
MAX_TOKENS            = 300
SUCCESS_SCORE_THRESHOLD = 0.5

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


# --- Strict log functions (must match sample exactly) ---

def log_start(task: str, env: str, model: str) -> None:
    print(f"[START] task={task} env={env} model={model}", flush=True)

def log_step(step: int, action: str, reward: float, done: bool, error: Optional[str]) -> None:
    error_val = error if error else "null"
    done_val  = str(done).lower()
    print(f"[STEP] step={step} action={action} reward={reward:.2f} done={done_val} error={error_val}", flush=True)

def log_end(success: bool, steps: int, score: float, rewards: List[float]) -> None:
    rewards_str = ",".join(f"{r:.2f}" for r in rewards)
    print(f"[END] success={str(success).lower()} steps={steps} score={score:.2f} rewards={rewards_str}", flush=True)


# --- Environment API ---

def env_reset(difficulty: str) -> dict:
    resp = requests.post(f"{ENV_API_URL}/reset", json={"difficulty": difficulty}, timeout=15)
    resp.raise_for_status()
    return resp.json()["observation"]

def env_step(action: str, tailored_skills: Optional[List[str]] = None) -> dict:
    payload = {"action": action}
    if tailored_skills:
        payload["tailored_skills"] = tailored_skills
    resp = requests.post(f"{ENV_API_URL}/step", json=payload, timeout=15)
    resp.raise_for_status()
    return resp.json()


# --- LLM ---

def get_model_action(client: OpenAI, obs: dict, history: List[str]) -> dict:
    history_block = "\n".join(history[-4:]) if history else "None"
    user_prompt = textwrap.dedent(f"""
        Current state:
        {json.dumps(obs, indent=2)}

        Recent history:
        {history_block}

        What action do you take?
    """).strip()

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
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            match = re.search(r'\{[\s\S]*\}', text)
            if match:
                return json.loads(match.group())
        return {"action": "wait", "reasoning": "parse error"}
    except Exception as exc:
        print(f"[DEBUG] LLM error: {exc}", flush=True)
        return {"action": "wait", "reasoning": str(exc)}


# --- Episode runner ---

def run_episode(client: OpenAI, difficulty: str) -> float:
    task_name = f"job-application-{difficulty}"

    log_start(task=task_name, env=BENCHMARK, model=MODEL_NAME)

    rewards:    List[float] = []
    steps_taken = 0
    score       = 0.0
    success     = False
    history:    List[str]  = []

    try:
        obs = env_reset(difficulty)

        for step in range(1, MAX_STEPS + 1):
            if obs.get("done", False):
                break

            parsed    = get_model_action(client, obs, history)
            action    = parsed.get("action", "wait")
            skills    = parsed.get("tailored_skills") or None
            reasoning = parsed.get("reasoning", "")

            reward = 0.0
            done   = False
            error  = None

            try:
                result = env_step(action, skills)
                obs    = result["observation"]
                reward = result.get("reward", 0.0)
                done   = obs.get("done", False)
                info   = result.get("info", {})

                if info.get("penalty"):
                    error = info["penalty"]
                elif info.get("warning"):
                    error = info["warning"]

                if info.get("final_grade"):
                    score = info["final_grade"]["score"]

            except Exception as e:
                error = str(e)
                done  = False

            rewards.append(reward)
            steps_taken = step

            log_step(step=step, action=action, reward=reward, done=done, error=error)

            history.append(f"Step {step}: {action} -> reward {reward:+.2f} | {reasoning}")

            if done:
                break

        success = score >= SUCCESS_SCORE_THRESHOLD

    except Exception as e:
        print(f"[DEBUG] Episode error: {e}", flush=True)

    finally:
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
        print("[ERROR] HF_TOKEN env var not set", flush=True)
        exit(1)

    client = OpenAI(api_key=API_KEY, base_url=API_BASE_URL)

    difficulties = [args.difficulty] if args.difficulty else ["easy", "medium", "hard"]

    all_scores = []
    for diff in difficulties:
        for _ in range(args.episodes):
            s = run_episode(client, diff)
            all_scores.append(s)

    if len(difficulties) > 1:
        avg = sum(all_scores) / len(all_scores) if all_scores else 0.0
        print(f"[SUMMARY] overall_avg={avg:.2f} model={MODEL_NAME}", flush=True)
