"""
inference.py
OpenAI-client-based agent for the Job Application RL Environment.

Reads credentials from environment variables:
  API_BASE_URL  — LLM API endpoint (default: https://api.openai.com/v1)
  MODEL_NAME    — model identifier  (default: gpt-4o-mini)
  HF_TOKEN      — Hugging Face / API key

Emits structured stdout logs in [START] / [STEP] / [END] format.

Usage:
    export API_BASE_URL=https://api.openai.com/v1
    export MODEL_NAME=gpt-4o-mini
    export HF_TOKEN=sk-...
    python inference.py --api-url http://localhost:3000 --difficulty medium
"""

import requests
import json
import os
import argparse
import time
from openai import OpenAI

# --- Credentials from env ---
API_BASE_URL = os.getenv("API_BASE_URL", "https://api.openai.com/v1")
MODEL_NAME   = os.getenv("MODEL_NAME",   "gpt-4o-mini")
HF_TOKEN     = os.getenv("HF_TOKEN",     "")

client = OpenAI(api_key=HF_TOKEN, base_url=API_BASE_URL)

SYSTEM_PROMPT = """You are an AI agent playing a job application simulation.
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
tailored_skills only needed for submit_application."""


def reset_env(api_url, difficulty):
    resp = requests.post(f"{api_url}/reset", json={"difficulty": difficulty}, timeout=10)
    resp.raise_for_status()
    return resp.json()["observation"]


def send_action(api_url, action, tailored_skills=None):
    payload = {"action": action}
    if tailored_skills:
        payload["tailored_skills"] = tailored_skills
    resp = requests.post(f"{api_url}/step", json=payload, timeout=10)
    resp.raise_for_status()
    return resp.json()


def ask_llm(obs):
    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": f"Current state:\n{json.dumps(obs, indent=2)}\n\nWhat action do you take?"}
        ],
        temperature=0.7,
        max_tokens=300,
    )
    content = response.choices[0].message.content
    # Extract JSON from response
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        import re
        match = re.search(r'\{[\s\S]*\}', content)
        if match:
            return json.loads(match.group())
        raise ValueError(f"Could not parse LLM response: {content}")


def run_episode(api_url, difficulty="medium", episode_num=1, max_steps=30):
    # [START] log
    print(json.dumps({
        "type": "START",
        "episode": episode_num,
        "difficulty": difficulty,
        "model": MODEL_NAME,
        "api_base": API_BASE_URL,
    }))

    obs = reset_env(api_url, difficulty)
    step_count = 0
    final_score = 0.0
    terminal_reason = "unknown"

    while not obs["done"] and step_count < max_steps:
        step_count += 1

        try:
            parsed = ask_llm(obs)
            action = parsed["action"]
            tailored_skills = parsed.get("tailored_skills")
            reasoning = parsed.get("reasoning", "")

            result = send_action(api_url, action, tailored_skills)
            obs = result["observation"]
            reward = result["reward"]
            info = result.get("info", {})

            # [STEP] log — required format
            print(json.dumps({
                "type": "STEP",
                "episode": episode_num,
                "step": step_count,
                "action": action,
                "reasoning": reasoning,
                "reward": reward,
                "total_reward": obs["total_reward"],
                "done": obs["done"],
                "day": obs["day"],
                "deadline": obs["deadline"],
                "warning": info.get("warning"),
                "penalty": info.get("penalty"),
                "event": info.get("event"),
            }))

            if info.get("final_grade"):
                g = info["final_grade"]
                final_score = g["score"]
                terminal_reason = info.get("terminal_reason", obs.get("terminal_reason", "unknown"))

        except Exception as e:
            print(json.dumps({
                "type": "STEP",
                "episode": episode_num,
                "step": step_count,
                "error": str(e),
            }))
            break

    if step_count >= max_steps and not obs["done"]:
        terminal_reason = "max_steps_reached"

    # [END] log — required format
    print(json.dumps({
        "type": "END",
        "episode": episode_num,
        "difficulty": difficulty,
        "score": final_score,
        "total_reward": obs["total_reward"],
        "steps_taken": step_count,
        "terminal_reason": terminal_reason,
    }))

    return final_score


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Job Application RL — Inference Script")
    parser.add_argument("--api-url",    default=os.getenv("ENV_API_URL", "http://localhost:3000"))
    parser.add_argument("--difficulty", default="medium", choices=["easy", "medium", "hard"])
    parser.add_argument("--episodes",   type=int, default=3)
    args = parser.parse_args()

    if not HF_TOKEN:
        print(json.dumps({"type": "ERROR", "message": "HF_TOKEN env var not set"}))
        exit(1)

    all_scores = []
    for ep in range(1, args.episodes + 1):
        score = run_episode(args.api_url, args.difficulty, episode_num=ep)
        all_scores.append(score)
        time.sleep(0.5)

    avg = sum(all_scores) / len(all_scores) if all_scores else 0.0
    print(json.dumps({
        "type": "SUMMARY",
        "difficulty": args.difficulty,
        "episodes": len(all_scores),
        "scores": all_scores,
        "avg_score": round(avg, 4),
        "model": MODEL_NAME,
    }))
