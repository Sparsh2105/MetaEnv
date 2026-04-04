"""
inference.py
Groq-powered agent that plays the job application RL environment.

Usage:
    python inference.py --difficulty medium
"""

import requests
import json
import os
import argparse
from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """You are an AI agent playing a job application simulation game.

Your goal: Secure an interview before the deadline.

RULES:
- Every step costs -0.01 reward (time penalty), so act fast
- If recruiter_replied_pending is true, you MUST use reply_email or face -1.0 penalty
- request_referral has a 30% chance of being ghosted
- Platform matters: apply_workday costs 3 steps (only for platform=workday), apply_1click costs 1 step
- After applying, call submit_application with tailored_skills matching job_description_keywords to double reward

SCORING: 1.0=interview | 0.5=applied with referral | 0.2=cold apply | 0.0=deadline missed

Respond ONLY with valid JSON, no extra text:
{
  "action": "request_referral" | "reply_email" | "apply_workday" | "apply_1click" | "submit_application" | "wait",
  "tailored_skills": ["skill1", "skill2"],
  "reasoning": "one sentence"
}
tailored_skills only needed for submit_application."""


def reset_env(api_url, difficulty):
    resp = requests.post(f"{api_url}/reset", json={"difficulty": difficulty}, timeout=5)
    resp.raise_for_status()
    return resp.json()["observation"]


def send_action(api_url, action, tailored_skills=None):
    payload = {"action": action}
    if tailored_skills:
        payload["tailored_skills"] = tailored_skills
    resp = requests.post(f"{api_url}/step", json=payload, timeout=5)
    resp.raise_for_status()
    return resp.json()


def ask_groq(obs):
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Current state:\n{json.dumps(obs, indent=2)}\n\nWhat action do you take?"}
        ],
        temperature=0.7,
        max_tokens=300,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)


def run_episode(api_url, difficulty="medium", max_steps=50):
    print(f"\n{'='*60}")
    print(f"Episode start — {difficulty.upper()} difficulty")
    print(f"{'='*60}")

    obs = reset_env(api_url, difficulty)
    step_count = 0
    final_score = 0.0

    while not obs["done"] and step_count < max_steps:
        step_count += 1
        print(f"\n--- Step {step_count} | Day {obs['day']}/{obs['deadline']} | Platform: {obs['platform']} ---")
        print(f"Applied: {obs['applied']} | Referral: {obs['referral_requested']} | Ghosted: {obs['ghosted']}")

        if obs.get("recruiter_event"):
            print(f"🚨 RECRUITER: {obs['recruiter_event']['message']}")

        try:
            parsed = ask_groq(obs)
            action = parsed["action"]
            tailored_skills = parsed.get("tailored_skills")
            print(f"Action: {action} | Reason: {parsed.get('reasoning', '')}")

            result = send_action(api_url, action, tailored_skills)
            obs = result["observation"]

            print(f"Reward: {result['reward']:+.4f} | Total: {obs['total_reward']:+.4f}")

            info = result.get("info", {})
            if info.get("warning"):
                print(f"⚠️  {info['warning']}")
            if info.get("penalty"):
                print(f"❌ {info['penalty']}")
            if info.get("final_grade"):
                g = info["final_grade"]
                final_score = g["score"]
                print(f"\n{'='*60}")
                print(f"DONE — Score: {final_score} | Reason: {g['breakdown']['terminal_reason']}")
                print(f"Base: {g['breakdown']['base_score']} × {g['breakdown']['tailoring_multiplier']}x tailoring")
                print(f"Steps: {g['breakdown']['steps_taken']}")

        except json.JSONDecodeError as e:
            print(f"❌ JSON parse error: {e}")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
            break

    if step_count >= max_steps:
        print(f"\n⏱️  Max steps reached")

    return final_score


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-url", default="http://localhost:3000")
    parser.add_argument("--difficulty", default="medium", choices=["easy", "medium", "hard"])
    parser.add_argument("--episodes", type=int, default=1)
    args = parser.parse_args()

    for ep in range(args.episodes):
        if args.episodes > 1:
            print(f"\n{'#'*60}\nEPISODE {ep + 1}/{args.episodes}\n{'#'*60}")
        run_episode(args.api_url, args.difficulty)
