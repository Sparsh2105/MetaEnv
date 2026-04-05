"""
server/app.py
OpenEnv-compatible entry point.
The actual server runs via Node.js (server.js).
This file satisfies the openenv validate requirement for a server entry point.
"""

import subprocess
import sys
import os


def main():
    """Start the Node.js RL environment server."""
    port = os.getenv("PORT", "7860")
    env = {**os.environ, "PORT": port}
    proc = subprocess.run(
        ["node", "server.js"],
        env=env,
        cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    )
    sys.exit(proc.returncode)


if __name__ == "__main__":
    main()
