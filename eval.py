"""
eval.py
Runs N episodes across all difficulties and prints average scores.

Usage:
    python eval.py --api-url https://sparsh2105-metaenv.hf.space --episodes 10
"""

import argparse
import os
import time
from inference import run_episode

DIFFICULTIES = ["easy", "medium", "hard"]


def run_eval(api_url, episodes=10):
    results = {d: [] for d in DIFFICULTIES}

    for difficulty in DIFFICULTIES:
        print(f"\n{'#'*60}")
        print(f"EVALUATING: {difficulty.upper()} — {episodes} episodes")
        print(f"{'#'*60}")

        for ep in range(episodes):
            print(f"\n[Episode {ep+1}/{episodes}]")
            try:
                score = run_episode(api_url, difficulty)
                results[difficulty].append(score)
            except Exception as e:
                print(f"❌ Episode failed: {e}")
                results[difficulty].append(0)
            time.sleep(0.5)  # small delay to avoid rate limits

    # --- Print Summary ---
    print(f"\n{'='*60}")
    print(f"EVALUATION SUMMARY ({episodes} episodes per difficulty)")
    print(f"{'='*60}")
    for difficulty in DIFFICULTIES:
        scores = results[difficulty]
        if scores:
            avg = sum(scores) / len(scores)
            best = max(scores)
            worst = min(scores)
            print(f"\n{difficulty.upper()}")
            print(f"  Avg Score : {avg:+.4f}")
            print(f"  Best      : {best:+.4f}")
            print(f"  Worst     : {worst:+.4f}")
            print(f"  All scores: {[round(s, 4) for s in scores]}")

    print(f"\n{'='*60}")
    overall = [s for scores in results.values() for s in scores]
    print(f"OVERALL AVG: {sum(overall)/len(overall):+.4f} across {len(overall)} episodes")
    print(f"{'='*60}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-url", default="https://sparsh2105-metaenv.hf.space")
    parser.add_argument("--episodes", type=int, default=10)
    args = parser.parse_args()

    run_eval(args.api_url, args.episodes)
